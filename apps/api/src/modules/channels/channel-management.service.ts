import type {
  Channel,
  ChannelPermissionOverwrite,
  PermissionOverwriteSubjectType,
  ReorderChannelsBody,
  UpdateChannelBody,
  UpsertChannelPermissionOverwriteBody,
} from '@strafe/shared'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  auditLog,
  channelPermissionOverwrites,
  channels,
  outboxEvents,
  serverMembers,
  serverRoles,
} from '../../db/schema.js'
import { canUseChannelParent } from '../../lib/channel-tree.js'
import { requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'
import { parsePermissionBits, Permission } from '../../lib/permissions.js'
import {
  authorizeChannel,
  authorizeServer,
  type ChannelAuthorization,
} from '../permissions/authorization.js'

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

function mapOverwrite(
  row: typeof channelPermissionOverwrites.$inferSelect,
): ChannelPermissionOverwrite {
  return {
    allowBits: row.allowBits.toString(),
    channelId: row.channelId,
    denyBits: row.denyBits.toString(),
    subjectId: row.subjectId,
    subjectType: row.subjectType as PermissionOverwriteSubjectType,
  }
}

function positionKey(index: number): string {
  return String(index + 1).padStart(6, '0')
}

export class ChannelManagementService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async update(
    actorId: string,
    channelId: string,
    input: UpdateChannelBody,
  ): Promise<Channel> {
    const authorization = await this.#authorizeManagedChannel(
      actorId,
      channelId,
    )
    const parent = await this.#validateParent(
      authorization,
      input.parentId,
      input.parentId !== undefined,
    )
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      const [channel] = await tx
        .update(channels)
        .set({
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.parentId !== undefined
            ? { parentId: parent?.id ?? null }
            : {}),
          ...(input.slowmodeSeconds !== undefined
            ? { slowmodeSeconds: input.slowmodeSeconds }
            : {}),
          ...(input.topic !== undefined
            ? { topic: input.topic?.trim() || null }
            : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(channels.id, channelId), isNull(channels.deletedAt)))
        .returning()
      if (!channel) throw new NotFoundError('Channel not found')

      const changedFields = Object.keys(input).sort()
      await tx.insert(auditLog).values({
        action: 'channel.updated',
        actorId,
        id: createId(),
        metadata: { changedFields },
        serverId: authorization.serverId,
        targetId: channelId,
        targetType: 'channel',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: channelId,
        aggregateType: 'channel',
        id: createId(),
        payload: {
          audience: { serverId: authorization.serverId },
          data: { changedFields, channelId, serverId: authorization.serverId },
        },
        topic: 'channel.updated',
      })

      return mapChannel(channel)
    })
  }

  async delete(actorId: string, channelId: string) {
    const authorization = await this.#authorizeManagedChannel(
      actorId,
      channelId,
    )
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      const deletedAt = new Date()
      const movedChildren = await tx
        .update(channels)
        .set({ parentId: null, updatedAt: deletedAt })
        .where(
          and(eq(channels.parentId, channelId), isNull(channels.deletedAt)),
        )
        .returning({ id: channels.id })
      const [channel] = await tx
        .update(channels)
        .set({ archivedAt: deletedAt, deletedAt, updatedAt: deletedAt })
        .where(and(eq(channels.id, channelId), isNull(channels.deletedAt)))
        .returning({ id: channels.id })
      if (!channel) throw new NotFoundError('Channel not found')

      const movedChildIds = movedChildren.map((child) => child.id)
      await tx.insert(auditLog).values({
        action: 'channel.deleted',
        actorId,
        id: createId(),
        metadata: { movedChildIds },
        serverId: authorization.serverId,
        targetId: channelId,
        targetType: 'channel',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: channelId,
        aggregateType: 'channel',
        id: createId(),
        payload: {
          audience: { serverId: authorization.serverId },
          data: {
            channelId,
            deletedAt: deletedAt.toISOString(),
            movedChildIds,
            serverId: authorization.serverId,
          },
        },
        topic: 'channel.deleted',
      })

      return { channelId, deleted: true as const }
    })
  }

  async reorder(
    actorId: string,
    serverId: string,
    input: ReorderChannelsBody,
  ): Promise<Channel[]> {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageChannels,
    )
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${serverId}, 0))`,
      )
      const rows = await tx
        .select()
        .from(channels)
        .where(and(eq(channels.serverId, serverId), isNull(channels.deletedAt)))
        .for('update')
      const rowById = new Map(rows.map((channel) => [channel.id, channel]))
      const requestedIds = input.items.map((item) => item.channelId)
      const uniqueIds = new Set(requestedIds)
      if (
        uniqueIds.size !== input.items.length ||
        rows.length !== input.items.length ||
        rows.some((channel) => !uniqueIds.has(channel.id))
      ) {
        throw new BadRequestError(
          'Channel order must contain every active server channel exactly once',
          'INVALID_CHANNEL_ORDER',
        )
      }

      for (const item of input.items) {
        const channel = rowById.get(item.channelId)!
        if (item.parentId === item.channelId) {
          throw new BadRequestError(
            'A channel cannot be its own parent',
            'INVALID_PARENT_CHANNEL',
          )
        }
        const parent = item.parentId ? rowById.get(item.parentId) : undefined
        if (
          (item.parentId && !parent) ||
          (parent && !canUseChannelParent(channel.type, parent.type)) ||
          (channel.type === 'category' && item.parentId)
        ) {
          throw new BadRequestError(
            'The requested channel parent is incompatible',
            'INVALID_PARENT_CHANNEL',
          )
        }
      }

      const updated: Channel[] = []
      for (const [index, item] of input.items.entries()) {
        const [channel] = await tx
          .update(channels)
          .set({
            parentId: item.parentId,
            positionKey: positionKey(index),
            updatedAt: new Date(),
          })
          .where(eq(channels.id, item.channelId))
          .returning()
        if (!channel) throw new Error('Channel order update returned no row')
        updated.push(mapChannel(channel))
      }

      await tx.insert(auditLog).values({
        action: 'channels.reordered',
        actorId,
        id: createId(),
        metadata: { channelIds: requestedIds },
        serverId,
        targetId: serverId,
        targetType: 'server',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: serverId,
        aggregateType: 'server',
        id: createId(),
        payload: {
          audience: { serverId },
          data: { items: input.items, serverId },
        },
        topic: 'server.channels_reordered',
      })

      return updated
    })
  }

  async listOverwrites(
    actorId: string,
    channelId: string,
  ): Promise<ChannelPermissionOverwrite[]> {
    await this.#authorizeManagedChannel(actorId, channelId)
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(channelPermissionOverwrites)
      .where(eq(channelPermissionOverwrites.channelId, channelId))
      .orderBy(
        asc(channelPermissionOverwrites.subjectType),
        asc(channelPermissionOverwrites.subjectId),
      )
    return rows.map(mapOverwrite)
  }

  async upsertOverwrite(
    actorId: string,
    channelId: string,
    subjectType: PermissionOverwriteSubjectType,
    subjectId: string,
    input: UpsertChannelPermissionOverwriteBody,
  ): Promise<ChannelPermissionOverwrite> {
    const authorization = await this.#authorizeManagedChannel(
      actorId,
      channelId,
    )
    let allowBits: bigint
    let denyBits: bigint
    try {
      allowBits = parsePermissionBits(input.allowBits)
      denyBits = parsePermissionBits(input.denyBits)
    } catch {
      throw new BadRequestError(
        'Permission bit field is invalid',
        'INVALID_PERMISSIONS',
      )
    }
    if ((allowBits & denyBits) !== 0n) {
      throw new BadRequestError(
        'The same permission cannot be both allowed and denied',
        'CONFLICTING_PERMISSIONS',
      )
    }
    if (
      !authorization.isOwner &&
      ((allowBits | denyBits) & ~authorization.permissions) !== 0n
    ) {
      throw new ForbiddenError(
        'An overwrite cannot modify permissions you do not have',
      )
    }

    const { db } = requireDatabase(this.#app)
    await this.#assertOverwriteSubject(authorization, subjectType, subjectId)

    return db.transaction(async (tx) => {
      const [overwrite] = await tx
        .insert(channelPermissionOverwrites)
        .values({ allowBits, channelId, denyBits, subjectId, subjectType })
        .onConflictDoUpdate({
          set: { allowBits, denyBits, updatedAt: new Date() },
          target: [
            channelPermissionOverwrites.channelId,
            channelPermissionOverwrites.subjectType,
            channelPermissionOverwrites.subjectId,
          ],
        })
        .returning()
      if (!overwrite) throw new Error('Overwrite upsert returned no row')

      await tx.insert(auditLog).values({
        action: 'channel.overwrite_updated',
        actorId,
        id: createId(),
        metadata: {
          allowBits: allowBits.toString(),
          denyBits: denyBits.toString(),
          subjectType,
        },
        serverId: authorization.serverId,
        targetId: subjectId,
        targetType: subjectType,
      })
      await tx.insert(outboxEvents).values({
        aggregateId: channelId,
        aggregateType: 'channel',
        id: createId(),
        payload: {
          audience: { channelId, serverId: authorization.serverId },
          data: {
            allowBits: allowBits.toString(),
            channelId,
            denyBits: denyBits.toString(),
            serverId: authorization.serverId,
            subjectId,
            subjectType,
          },
        },
        topic: 'channel.overwrite_updated',
      })

      return mapOverwrite(overwrite)
    })
  }

  async deleteOverwrite(
    actorId: string,
    channelId: string,
    subjectType: PermissionOverwriteSubjectType,
    subjectId: string,
  ) {
    const authorization = await this.#authorizeManagedChannel(
      actorId,
      channelId,
    )
    const { db } = requireDatabase(this.#app)
    await this.#assertOverwriteSubject(authorization, subjectType, subjectId)

    return db.transaction(async (tx) => {
      const removed = await tx
        .delete(channelPermissionOverwrites)
        .where(
          and(
            eq(channelPermissionOverwrites.channelId, channelId),
            eq(channelPermissionOverwrites.subjectType, subjectType),
            eq(channelPermissionOverwrites.subjectId, subjectId),
          ),
        )
        .returning({ subjectId: channelPermissionOverwrites.subjectId })
      if (removed.length > 0) {
        await tx.insert(auditLog).values({
          action: 'channel.overwrite_deleted',
          actorId,
          id: createId(),
          metadata: { subjectType },
          serverId: authorization.serverId,
          targetId: subjectId,
          targetType: subjectType,
        })
        await tx.insert(outboxEvents).values({
          aggregateId: channelId,
          aggregateType: 'channel',
          id: createId(),
          payload: {
            audience: { channelId, serverId: authorization.serverId },
            data: {
              channelId,
              serverId: authorization.serverId,
              subjectId,
              subjectType,
            },
          },
          topic: 'channel.overwrite_deleted',
        })
      }

      return {
        channelId,
        removed: removed.length > 0,
        subjectId,
        subjectType,
      }
    })
  }

  async #authorizeManagedChannel(actorId: string, channelId: string) {
    const authorization = await authorizeChannel(
      this.#app,
      actorId,
      channelId,
      Permission.ManageChannels,
    )
    if (!authorization.channel.serverId) {
      throw new BadRequestError(
        'Server channel management is not available for direct messages',
        'NOT_SERVER_CHANNEL',
      )
    }
    return authorization
  }

  async #validateParent(
    authorization: ChannelAuthorization,
    parentId: string | null | undefined,
    supplied: boolean,
  ) {
    if (!supplied) return undefined
    if (!parentId) return null
    if (parentId === authorization.channel.id) {
      throw new BadRequestError(
        'A channel cannot be its own parent',
        'INVALID_PARENT_CHANNEL',
      )
    }
    const { db } = requireDatabase(this.#app)
    const [parent] = await db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.id, parentId),
          eq(channels.serverId, authorization.serverId),
          isNull(channels.deletedAt),
        ),
      )
      .limit(1)
    if (
      !parent ||
      !canUseChannelParent(authorization.channel.type, parent.type)
    ) {
      throw new BadRequestError(
        'The requested channel parent is incompatible',
        'INVALID_PARENT_CHANNEL',
      )
    }
    return parent
  }

  async #assertOverwriteSubject(
    authorization: ChannelAuthorization,
    subjectType: PermissionOverwriteSubjectType,
    subjectId: string,
  ) {
    const { db } = requireDatabase(this.#app)
    if (subjectType === 'role') {
      const [role] = await db
        .select({
          permissions: serverRoles.permissions,
          positionKey: serverRoles.positionKey,
        })
        .from(serverRoles)
        .where(
          and(
            eq(serverRoles.id, subjectId),
            eq(serverRoles.serverId, authorization.serverId),
          ),
        )
        .limit(1)
      if (!role) {
        throw new BadRequestError(
          'The overwrite role does not belong to this server',
          'INVALID_OVERWRITE_SUBJECT',
        )
      }
      if (
        !authorization.isOwner &&
        ((role.permissions & ~authorization.permissions) !== 0n ||
          !authorization.highestRolePosition ||
          role.positionKey >= authorization.highestRolePosition)
      ) {
        throw new ForbiddenError(
          'You cannot modify an overwrite for a role above your permissions',
        )
      }
      return
    }

    const [member] = await db
      .select({ id: serverMembers.id })
      .from(serverMembers)
      .where(
        and(
          eq(serverMembers.id, subjectId),
          eq(serverMembers.serverId, authorization.serverId),
          eq(serverMembers.state, 'active'),
        ),
      )
      .limit(1)
    if (!member) {
      throw new BadRequestError(
        'The overwrite member does not belong to this server',
        'INVALID_OVERWRITE_SUBJECT',
      )
    }
  }
}
