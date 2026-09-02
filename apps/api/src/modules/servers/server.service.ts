import {
  EncryptedChannelFlag,
  type Channel,
  type CreateChannelBody,
  type CreateInviteBody,
  type CreateRoleBody,
  type CreateServerBody,
  type Server,
  type TransferServerOwnershipBody,
  type UpdateServerBody,
} from '@strafe/shared'
import { and, eq, gt, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  auditLog,
  channelPermissionOverwrites,
  channels,
  channelVoiceSettings,
  outboxEvents,
  serverBans,
  serverInvites,
  serverMemberRoles,
  serverMembers,
  serverRoles,
  servers,
} from '../../db/schema.js'
import { canUseChannelParent } from '../../lib/channel-tree.js'
import { requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js'
import {
  createId,
  createOpaqueToken,
  hashSecret,
  safeSlug,
} from '../../lib/ids.js'
import {
  DefaultMemberPermissions,
  hasPermission,
  parsePermissionBits,
  Permission,
  resolveChannelPermissions,
} from '../../lib/permissions.js'
import { authorizeServer } from '../permissions/authorization.js'

function mapServer(row: typeof servers.$inferSelect): Server {
  return {
    createdAt: row.createdAt.toISOString(),
    description: row.description,
    id: row.id,
    memberCount: row.memberCount,
    name: row.name,
    ownerId: row.ownerId,
    slug: row.slug,
    version: row.version,
    visibility: row.visibility as Server['visibility'],
  }
}

function mapChannel(row: typeof channels.$inferSelect): Channel {
  return {
    archivedAt: row.archivedAt?.toISOString() ?? null,
    flags: row.flags,
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    positionKey: row.positionKey,
    serverId: row.serverId,
    slowmodeSeconds: row.slowmodeSeconds,
    topic: row.topic,
    type: row.type as Channel['type'],
  }
}

export class ServerService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async create(userId: string, input: CreateServerBody) {
    const { db } = requireDatabase(this.#app)
    const serverId = createId()
    const memberId = createId()
    const defaultRoleId = createId()
    const categoryId = createId()
    const textChannelId = createId()
    const voiceChannelId = createId()
    const slug = `${safeSlug(input.name)}-${serverId.slice(0, 8)}`

    const server = await db.transaction(async (tx) => {
      const [createdServer] = await tx
        .insert(servers)
        .values({
          description: input.description?.trim() || null,
          id: serverId,
          name: input.name.trim(),
          ownerId: userId,
          slug,
          visibility: input.visibility ?? 'private',
        })
        .returning()

      if (!createdServer) {
        throw new Error('Server insert returned no row')
      }

      await tx.insert(serverMembers).values({
        id: memberId,
        serverId,
        userId,
      })
      await tx.insert(serverRoles).values({
        id: defaultRoleId,
        isDefault: true,
        name: '@everyone',
        permissions: DefaultMemberPermissions,
        positionKey: '00000000000000000000',
        serverId,
      })
      await tx.insert(serverMemberRoles).values({
        assignedBy: userId,
        memberId,
        roleId: defaultRoleId,
      })
      await tx.insert(channels).values([
        {
          id: categoryId,
          name: 'Ogólne',
          positionKey: '100000',
          serverId,
          type: 'category',
        },
        {
          id: textChannelId,
          name: 'general',
          parentId: categoryId,
          positionKey: '100000',
          serverId,
          topic: 'Główny kanał społeczności',
          type: 'text',
        },
        {
          id: voiceChannelId,
          name: 'Ogólny',
          parentId: categoryId,
          positionKey: '200000',
          serverId,
          type: 'voice',
        },
      ])
      await tx
        .insert(channelVoiceSettings)
        .values({ channelId: voiceChannelId })
      await tx.insert(auditLog).values({
        action: 'server.created',
        actorId: userId,
        id: createId(),
        serverId,
        targetId: serverId,
        targetType: 'server',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: serverId,
        aggregateType: 'server',
        id: createId(),
        payload: {
          audience: { userIds: [userId] },
          data: { defaultChannelId: textChannelId, serverId },
        },
        topic: 'server.created',
      })

      return createdServer
    })

    return { defaultChannelId: textChannelId, server: mapServer(server) }
  }

  async listForUser(userId: string): Promise<Server[]> {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select({ server: servers })
      .from(serverMembers)
      .innerJoin(servers, eq(servers.id, serverMembers.serverId))
      .where(
        and(
          eq(serverMembers.userId, userId),
          eq(serverMembers.state, 'active'),
          isNull(servers.deletedAt),
        ),
      )
      .orderBy(serverMembers.joinedAt)

    return rows.map(({ server }) => mapServer(server))
  }

  async get(userId: string, serverId: string): Promise<Server> {
    await authorizeServer(this.#app, userId, serverId, Permission.ViewChannel)
    const { db } = requireDatabase(this.#app)
    const [server] = await db
      .select()
      .from(servers)
      .where(and(eq(servers.id, serverId), isNull(servers.deletedAt)))
      .limit(1)
    if (!server) throw new NotFoundError('Server not found')
    return mapServer(server)
  }

  async update(
    userId: string,
    serverId: string,
    input: UpdateServerBody,
  ): Promise<Server> {
    await authorizeServer(this.#app, userId, serverId, Permission.ManageServer)
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      const [server] = await tx
        .update(servers)
        .set({
          ...(input.description !== undefined
            ? { description: input.description?.trim() || null }
            : {}),
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          updatedAt: new Date(),
          version: sql`${servers.version} + 1`,
          ...(input.visibility !== undefined
            ? { visibility: input.visibility }
            : {}),
        })
        .where(and(eq(servers.id, serverId), isNull(servers.deletedAt)))
        .returning()
      if (!server) throw new NotFoundError('Server not found')

      const changedFields = Object.keys(input).sort()
      await tx.insert(auditLog).values({
        action: 'server.updated',
        actorId: userId,
        id: createId(),
        metadata: { changedFields },
        serverId,
        targetId: serverId,
        targetType: 'server',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: serverId,
        aggregateType: 'server',
        aggregateVersion: server.version,
        id: createId(),
        payload: {
          audience: { serverId },
          data: { changedFields, serverId },
        },
        topic: 'server.updated',
      })

      return mapServer(server)
    })
  }

  async transferOwnership(
    actorId: string,
    serverId: string,
    input: TransferServerOwnershipBody,
  ): Promise<Server> {
    if (actorId === input.newOwnerId) {
      throw new BadRequestError(
        'The requested user already owns this server',
        'OWNER_UNCHANGED',
      )
    }
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(servers)
        .where(and(eq(servers.id, serverId), isNull(servers.deletedAt)))
        .limit(1)
        .for('update')
      if (!current) throw new NotFoundError('Server not found')
      if (current.ownerId !== actorId) {
        throw new ForbiddenError(
          'Only the current owner can transfer server ownership',
        )
      }

      const [newOwnerMembership] = await tx
        .select({ id: serverMembers.id })
        .from(serverMembers)
        .where(
          and(
            eq(serverMembers.serverId, serverId),
            eq(serverMembers.userId, input.newOwnerId),
            eq(serverMembers.state, 'active'),
          ),
        )
        .limit(1)
        .for('update')
      if (!newOwnerMembership) {
        throw new BadRequestError(
          'The new owner must be an active server member',
          'INVALID_NEW_OWNER',
        )
      }

      const [server] = await tx
        .update(servers)
        .set({
          ownerId: input.newOwnerId,
          updatedAt: new Date(),
          version: sql`${servers.version} + 1`,
        })
        .where(eq(servers.id, serverId))
        .returning()
      if (!server) throw new Error('Server ownership update returned no row')

      await tx
        .update(serverMembers)
        .set({
          permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
        })
        .where(
          and(
            eq(serverMembers.serverId, serverId),
            inArray(serverMembers.userId, [actorId, input.newOwnerId]),
          ),
        )
      await tx
        .update(serverMembers)
        .set({ timeoutUntil: null })
        .where(eq(serverMembers.id, newOwnerMembership.id))
      await tx.insert(auditLog).values({
        action: 'server.ownership_transferred',
        actorId,
        id: createId(),
        metadata: { previousOwnerId: actorId },
        serverId,
        targetId: input.newOwnerId,
        targetType: 'user',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: serverId,
        aggregateType: 'server',
        aggregateVersion: server.version,
        id: createId(),
        payload: {
          audience: {
            serverId,
            userIds: [actorId, input.newOwnerId],
          },
          data: {
            newOwnerId: input.newOwnerId,
            previousOwnerId: actorId,
            serverId,
          },
        },
        topic: 'server.ownership_transferred',
      })

      return mapServer(server)
    })
  }

  async delete(actorId: string, serverId: string) {
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      const [server] = await tx
        .select({ ownerId: servers.ownerId })
        .from(servers)
        .where(and(eq(servers.id, serverId), isNull(servers.deletedAt)))
        .limit(1)
        .for('update')
      if (!server) throw new NotFoundError('Server not found')
      if (server.ownerId !== actorId) {
        throw new ForbiddenError('Only the server owner can delete the server')
      }

      const activeMembers = await tx
        .select({ userId: serverMembers.userId })
        .from(serverMembers)
        .where(
          and(
            eq(serverMembers.serverId, serverId),
            eq(serverMembers.state, 'active'),
          ),
        )
      const deletedAt = new Date()
      await tx
        .update(servers)
        .set({
          deletedAt,
          deletionScheduledAt: deletedAt,
          memberCount: 0,
          updatedAt: deletedAt,
          version: sql`${servers.version} + 1`,
        })
        .where(eq(servers.id, serverId))
      await tx
        .update(serverMembers)
        .set({
          leftAt: deletedAt,
          membershipVersion: sql`${serverMembers.membershipVersion} + 1`,
          permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
          state: 'left',
        })
        .where(
          and(
            eq(serverMembers.serverId, serverId),
            eq(serverMembers.state, 'active'),
          ),
        )
      await tx
        .update(channels)
        .set({ archivedAt: deletedAt, deletedAt, updatedAt: deletedAt })
        .where(and(eq(channels.serverId, serverId), isNull(channels.deletedAt)))
      await tx
        .update(serverInvites)
        .set({ revokedAt: deletedAt })
        .where(
          and(
            eq(serverInvites.serverId, serverId),
            isNull(serverInvites.revokedAt),
          ),
        )
      await tx.insert(auditLog).values({
        action: 'server.deleted',
        actorId,
        id: createId(),
        serverId,
        targetId: serverId,
        targetType: 'server',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: serverId,
        aggregateType: 'server',
        id: createId(),
        payload: {
          audience: {
            serverId,
            userIds: activeMembers.map((member) => member.userId),
          },
          data: { deletedAt: deletedAt.toISOString(), serverId },
        },
        topic: 'server.deleted',
      })

      return { deleted: true as const, serverId }
    })
  }

  async listChannels(userId: string, serverId: string): Promise<Channel[]> {
    const authorization = await authorizeServer(
      this.#app,
      userId,
      serverId,
      Permission.ViewChannel,
    )
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(channels)
      .where(and(eq(channels.serverId, serverId), isNull(channels.deletedAt)))
      .orderBy(channels.positionKey)

    if (
      authorization.isOwner ||
      hasPermission(authorization.permissions, Permission.Administrator)
    ) {
      return rows.map(mapChannel)
    }

    const subjectIds = [...authorization.roleIds, authorization.memberId]
    const overwrites =
      subjectIds.length === 0 || rows.length === 0
        ? []
        : await db
            .select()
            .from(channelPermissionOverwrites)
            .where(
              and(
                inArray(
                  channelPermissionOverwrites.channelId,
                  rows.map((channel) => channel.id),
                ),
                inArray(channelPermissionOverwrites.subjectId, subjectIds),
              ),
            )

    return rows
      .filter((channel) => {
        const channelOverwrites = overwrites.filter(
          (overwrite) => overwrite.channelId === channel.id,
        )
        const defaultRoleOverwrite = channelOverwrites.find(
          (overwrite) =>
            overwrite.subjectType === 'role' &&
            overwrite.subjectId === authorization.defaultRoleId,
        )
        const roleOverwrites = channelOverwrites.filter(
          (overwrite) =>
            overwrite.subjectType === 'role' &&
            overwrite.subjectId !== authorization.defaultRoleId,
        )
        const memberOverwrite = channelOverwrites.find(
          (overwrite) =>
            overwrite.subjectType === 'member' &&
            overwrite.subjectId === authorization.memberId,
        )
        const permissions = resolveChannelPermissions(
          authorization.permissions,
          defaultRoleOverwrite,
          roleOverwrites,
          memberOverwrite,
        )
        return hasPermission(permissions, Permission.ViewChannel)
      })
      .map(mapChannel)
  }

  async createChannel(
    userId: string,
    serverId: string,
    input: CreateChannelBody,
  ): Promise<Channel> {
    await authorizeServer(
      this.#app,
      userId,
      serverId,
      Permission.ManageChannels,
    )
    if (input.type === 'dm' || input.type === 'group_dm') {
      throw new BadRequestError(
        'DM channels cannot be created inside a server',
        'INVALID_CHANNEL_TYPE',
      )
    }
    if (
      input.encrypted &&
      ![
        'announcement',
        'forum',
        'text',
        'thread_private',
        'thread_public',
      ].includes(input.type)
    ) {
      throw new BadRequestError(
        'Only message channels can be end-to-end encrypted',
        'INVALID_CHANNEL_ENCRYPTION',
      )
    }

    const { db } = requireDatabase(this.#app)
    if (
      (input.type === 'category' && input.parentId) ||
      ((input.type === 'thread_public' || input.type === 'thread_private') &&
        !input.parentId)
    ) {
      throw new BadRequestError(
        'The requested channel parent is incompatible',
        'INVALID_PARENT_CHANNEL',
      )
    }
    if (input.parentId) {
      const [parent] = await db
        .select({ id: channels.id, type: channels.type })
        .from(channels)
        .where(
          and(
            eq(channels.id, input.parentId),
            eq(channels.serverId, serverId),
            isNull(channels.deletedAt),
          ),
        )
        .limit(1)
      if (!parent) {
        throw new BadRequestError(
          'The parent channel does not belong to this server',
          'INVALID_PARENT_CHANNEL',
        )
      }
      if (!canUseChannelParent(input.type, parent.type)) {
        throw new BadRequestError(
          'The requested channel parent is incompatible',
          'INVALID_PARENT_CHANNEL',
        )
      }
    }

    const id = createId()
    const [channel] = await db.transaction(async (tx) => {
      const created = await tx
        .insert(channels)
        .values({
          id,
          flags: input.encrypted ? EncryptedChannelFlag : 0,
          name: input.name.trim(),
          parentId: input.parentId ?? null,
          positionKey: `z:${id}`,
          serverId,
          slowmodeSeconds: input.slowmodeSeconds ?? 0,
          topic: input.topic?.trim() || null,
          type: input.type,
        })
        .returning()

      if (input.type === 'voice' || input.type === 'stage') {
        await tx.insert(channelVoiceSettings).values({ channelId: id })
      }
      await tx.insert(auditLog).values({
        action: 'channel.created',
        actorId: userId,
        id: createId(),
        serverId,
        targetId: id,
        targetType: 'channel',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: id,
        aggregateType: 'channel',
        id: createId(),
        payload: {
          audience: { serverId },
          data: { channelId: id, serverId },
        },
        topic: 'channel.created',
      })
      return created
    })

    if (!channel) throw new Error('Channel insert returned no row')
    return mapChannel(channel)
  }

  async createRole(userId: string, serverId: string, input: CreateRoleBody) {
    const authorization = await authorizeServer(
      this.#app,
      userId,
      serverId,
      Permission.ManageRoles,
    )
    let permissions: bigint
    try {
      permissions = parsePermissionBits(input.permissions ?? '0')
    } catch {
      throw new BadRequestError(
        'Permission bit field is invalid',
        'INVALID_PERMISSIONS',
      )
    }

    if (
      !authorization.isOwner &&
      (permissions & ~authorization.permissions) !== 0n
    ) {
      throw new ForbiddenError(
        'A role cannot grant permissions you do not have',
      )
    }

    const { db } = requireDatabase(this.#app)
    const id = createId()
    const newRolePosition = authorization.isOwner
      ? `z:${id}`
      : `00000000000000000001:${id}`
    if (
      !authorization.isOwner &&
      (!authorization.highestRolePosition ||
        newRolePosition >= authorization.highestRolePosition)
    ) {
      throw new ForbiddenError(
        'There is no hierarchy space below your highest role; ask the owner to reorder roles',
      )
    }
    const [role] = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(serverRoles)
        .values({
          color: input.color ?? null,
          id,
          name: input.name.trim(),
          permissions,
          positionKey: newRolePosition,
          serverId,
        })
        .returning()
      await tx.insert(auditLog).values({
        action: 'role.created',
        actorId: userId,
        id: createId(),
        serverId,
        targetId: id,
        targetType: 'role',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: id,
        aggregateType: 'role',
        id: createId(),
        payload: {
          audience: { serverId },
          data: { roleId: id, serverId },
        },
        topic: 'role.created',
      })
      return inserted
    })

    if (!role) throw new Error('Role insert returned no row')
    return {
      color: role.color,
      id: role.id,
      isDefault: role.isDefault,
      name: role.name,
      permissions: role.permissions.toString(),
      positionKey: role.positionKey,
      serverId: role.serverId,
    }
  }

  async createInvite(
    userId: string,
    serverId: string,
    input: CreateInviteBody,
  ) {
    await authorizeServer(this.#app, userId, serverId, Permission.CreateInvites)
    const { db } = requireDatabase(this.#app)
    if (input.channelId) {
      const [channel] = await db
        .select({ id: channels.id })
        .from(channels)
        .where(
          and(
            eq(channels.id, input.channelId),
            eq(channels.serverId, serverId),
            isNull(channels.deletedAt),
          ),
        )
        .limit(1)
      if (!channel) {
        throw new BadRequestError(
          'Invite channel does not belong to the server',
          'INVALID_INVITE_CHANNEL',
        )
      }
    }

    const code = createOpaqueToken(18)
    const id = createId()
    const expiresAt = input.expiresInSeconds
      ? new Date(Date.now() + input.expiresInSeconds * 1_000)
      : null
    return db.transaction(async (tx) => {
      const [invite] = await tx
        .insert(serverInvites)
        .values({
          channelId: input.channelId ?? null,
          codeHash: hashSecret(code),
          creatorId: userId,
          expiresAt,
          id,
          maxUses: input.maxUses ?? null,
          serverId,
        })
        .returning()
      if (!invite) throw new Error('Invite insert returned no row')

      await tx.insert(auditLog).values({
        action: 'invite.created',
        actorId: userId,
        id: createId(),
        metadata: {
          expiresAt: expiresAt?.toISOString() ?? null,
          maxUses: invite.maxUses,
        },
        serverId,
        targetId: id,
        targetType: 'invite',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: id,
        aggregateType: 'invite',
        id: createId(),
        payload: {
          audience: { serverId },
          data: {
            expiresAt: expiresAt?.toISOString() ?? null,
            inviteId: id,
            maxUses: invite.maxUses,
            serverId,
          },
        },
        topic: 'server.invite_created',
      })

      return {
        code,
        expiresAt: invite.expiresAt?.toISOString() ?? null,
        id: invite.id,
        maxUses: invite.maxUses,
        serverId: invite.serverId,
        uses: invite.uses,
      }
    })
  }

  async joinInvite(userId: string, code: string) {
    const { db } = requireDatabase(this.#app)
    const now = new Date()
    const codeHash = hashSecret(code)

    const [candidate] = await db
      .select({ serverId: serverInvites.serverId })
      .from(serverInvites)
      .where(
        and(
          eq(serverInvites.codeHash, codeHash),
          isNull(serverInvites.revokedAt),
          or(isNull(serverInvites.expiresAt), gt(serverInvites.expiresAt, now)),
          or(
            isNull(serverInvites.maxUses),
            lt(serverInvites.uses, serverInvites.maxUses),
          ),
        ),
      )
      .limit(1)
    if (candidate) {
      const [[activeMembership], [activeBan]] = await Promise.all([
        db
          .select({ id: serverMembers.id })
          .from(serverMembers)
          .where(
            and(
              eq(serverMembers.serverId, candidate.serverId),
              eq(serverMembers.userId, userId),
              eq(serverMembers.state, 'active'),
            ),
          )
          .limit(1),
        db
          .select({ userId: serverBans.userId })
          .from(serverBans)
          .where(
            and(
              eq(serverBans.serverId, candidate.serverId),
              eq(serverBans.userId, userId),
              or(isNull(serverBans.expiresAt), gt(serverBans.expiresAt, now)),
            ),
          )
          .limit(1),
      ])
      if (!activeMembership && !activeBan) {
        const automod = await this.#app.moderationService.evaluateJoin(
          candidate.serverId,
          userId,
        )
        if (automod.blocked) {
          throw new ForbiddenError('Join blocked by server automod')
        }
      }
    }

    return db.transaction(async (tx) => {
      const [invite] = await tx
        .select()
        .from(serverInvites)
        .where(
          and(
            eq(serverInvites.codeHash, codeHash),
            isNull(serverInvites.revokedAt),
            or(
              isNull(serverInvites.expiresAt),
              gt(serverInvites.expiresAt, now),
            ),
            or(
              isNull(serverInvites.maxUses),
              lt(serverInvites.uses, serverInvites.maxUses),
            ),
          ),
        )
        .limit(1)
        .for('update')

      if (!invite) {
        throw new NotFoundError('Invite is invalid, expired, or exhausted')
      }

      const [ban] = await tx
        .select({ userId: serverBans.userId })
        .from(serverBans)
        .where(
          and(
            eq(serverBans.serverId, invite.serverId),
            eq(serverBans.userId, userId),
            or(isNull(serverBans.expiresAt), gt(serverBans.expiresAt, now)),
          ),
        )
        .limit(1)
      if (ban) {
        throw new ForbiddenError('You are banned from this server')
      }

      const [existing] = await tx
        .select()
        .from(serverMembers)
        .where(
          and(
            eq(serverMembers.serverId, invite.serverId),
            eq(serverMembers.userId, userId),
          ),
        )
        .limit(1)
      const wasActive = existing?.state === 'active'
      const memberId = existing?.id ?? createId()

      const [member] = await tx
        .insert(serverMembers)
        .values({
          id: memberId,
          serverId: invite.serverId,
          userId,
        })
        .onConflictDoUpdate({
          set: {
            joinedAt: now,
            leftAt: null,
            membershipVersion: sql`${serverMembers.membershipVersion} + 1`,
            state: 'active',
          },
          target: [serverMembers.serverId, serverMembers.userId],
        })
        .returning()

      const [defaultRole] = await tx
        .select({ id: serverRoles.id })
        .from(serverRoles)
        .where(
          and(
            eq(serverRoles.serverId, invite.serverId),
            eq(serverRoles.isDefault, true),
          ),
        )
        .limit(1)
      if (!member || !defaultRole) {
        throw new Error('Server membership invariant is broken')
      }

      await tx
        .delete(serverMemberRoles)
        .where(
          and(
            eq(serverMemberRoles.memberId, member.id),
            ne(serverMemberRoles.roleId, defaultRole.id),
          ),
        )
      await tx
        .insert(serverMemberRoles)
        .values({
          assignedBy: invite.creatorId,
          memberId: member.id,
          roleId: defaultRole.id,
        })
        .onConflictDoNothing()
      await tx
        .update(serverInvites)
        .set({ uses: sql`${serverInvites.uses} + 1` })
        .where(eq(serverInvites.id, invite.id))
      if (!wasActive) {
        await tx
          .update(servers)
          .set({
            memberCount: sql`${servers.memberCount} + 1`,
            version: sql`${servers.version} + 1`,
          })
          .where(eq(servers.id, invite.serverId))
      }
      await tx.insert(auditLog).values({
        action: 'member.joined',
        actorId: userId,
        id: createId(),
        serverId: invite.serverId,
        targetId: userId,
        targetType: 'user',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: userId,
        aggregateType: 'server_member',
        id: createId(),
        payload: {
          audience: { serverId: invite.serverId, userIds: [userId] },
          data: { serverId: invite.serverId, userId },
        },
        topic: 'server.member_joined',
      })

      const [server] = await tx
        .select()
        .from(servers)
        .where(eq(servers.id, invite.serverId))
        .limit(1)
      if (!server) throw new Error('Invite references a missing server')
      return { joined: !wasActive, server: mapServer(server) }
    })
  }
}
