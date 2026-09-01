import type {
  BanMemberBody,
  ServerMember,
  TimeoutMemberBody,
  UpdateMemberRolesBody,
} from '@strafe/shared'
import { and, desc, eq, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  auditLog,
  moderationActions,
  moderationCases,
  outboxEvents,
  serverBans,
  serverMemberProfiles,
  serverMemberRoles,
  serverMembers,
  serverRoles,
  servers,
  userProfiles,
  users,
} from '../../db/schema.js'
import { decodeCursor, encodeCursor } from '../../lib/cursor.js'
import { requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'
import { Permission } from '../../lib/permissions.js'
import {
  authorizeServer,
  type ServerAuthorization,
} from '../permissions/authorization.js'

export class MemberService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async list(
    actorId: string,
    serverId: string,
    limit: number,
    before?: string,
  ) {
    await authorizeServer(this.#app, actorId, serverId, Permission.ViewChannel)
    const { db } = requireDatabase(this.#app)
    const cursor = before ? decodeCursor(before) : null
    const conditions = [
      eq(serverMembers.serverId, serverId),
      eq(serverMembers.state, 'active'),
      isNull(users.deletedAt),
    ]
    if (cursor) {
      const cursorDate = new Date(cursor.createdAt)
      conditions.push(
        or(
          lt(serverMembers.joinedAt, cursorDate),
          and(
            eq(serverMembers.joinedAt, cursorDate),
            lt(serverMembers.id, cursor.id),
          ),
        )!,
      )
    }

    const rows = await db
      .select({
        avatarFileId: userProfiles.avatarFileId,
        displayName: userProfiles.displayName,
        handle: users.handle,
        joinedAt: serverMembers.joinedAt,
        memberId: serverMembers.id,
        nickname: serverMemberProfiles.nickname,
        permissionsVersion: serverMembers.permissionsVersion,
        timeoutUntil: serverMembers.timeoutUntil,
        userCreatedAt: users.createdAt,
        userId: users.id,
        userStatus: users.status,
      })
      .from(serverMembers)
      .innerJoin(users, eq(users.id, serverMembers.userId))
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .leftJoin(
        serverMemberProfiles,
        eq(serverMemberProfiles.memberId, serverMembers.id),
      )
      .where(and(...conditions))
      .orderBy(desc(serverMembers.joinedAt), desc(serverMembers.id))
      .limit(limit + 1)
    const hasMore = rows.length > limit
    const page = rows.slice(0, limit)
    const memberIds = page.map((member) => member.memberId)
    const roleRows =
      memberIds.length === 0
        ? []
        : await db
            .select({
              memberId: serverMemberRoles.memberId,
              roleId: serverMemberRoles.roleId,
            })
            .from(serverMemberRoles)
            .where(inArray(serverMemberRoles.memberId, memberIds))
    const members: ServerMember[] = page.map((member) => ({
      id: member.memberId,
      joinedAt: member.joinedAt.toISOString(),
      nickname: member.nickname,
      permissionsVersion: member.permissionsVersion,
      roleIds: roleRows
        .filter((role) => role.memberId === member.memberId)
        .map((role) => role.roleId),
      timeoutUntil: member.timeoutUntil?.toISOString() ?? null,
      user: {
        avatarUrl: null,
        createdAt: member.userCreatedAt.toISOString(),
        displayName: member.displayName,
        handle: member.handle,
        id: member.userId,
        status: member.userStatus as ServerMember['user']['status'],
      },
    }))
    const last = page.at(-1)
    return {
      members,
      nextCursor:
        hasMore && last
          ? encodeCursor({
              createdAt: last.joinedAt.toISOString(),
              id: last.memberId,
            })
          : null,
    }
  }

  async leave(userId: string, serverId: string) {
    await authorizeServer(this.#app, userId, serverId, Permission.ViewChannel)
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      const [membership] = await tx
        .select({
          id: serverMembers.id,
          ownerId: servers.ownerId,
        })
        .from(serverMembers)
        .innerJoin(servers, eq(servers.id, serverMembers.serverId))
        .where(
          and(
            eq(serverMembers.serverId, serverId),
            eq(serverMembers.userId, userId),
            eq(serverMembers.state, 'active'),
            isNull(servers.deletedAt),
          ),
        )
        .limit(1)
        .for('update')
      if (!membership) throw new NotFoundError('Server membership not found')
      if (membership.ownerId === userId) {
        throw new BadRequestError(
          'Transfer ownership before leaving the server',
          'OWNER_CANNOT_LEAVE',
        )
      }

      const leftAt = new Date()
      await tx
        .update(serverMembers)
        .set({
          leftAt,
          membershipVersion: sql`${serverMembers.membershipVersion} + 1`,
          permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
          state: 'left',
          timeoutUntil: null,
        })
        .where(eq(serverMembers.id, membership.id))
      const [defaultRole] = await tx
        .select({ id: serverRoles.id })
        .from(serverRoles)
        .where(
          and(
            eq(serverRoles.serverId, serverId),
            eq(serverRoles.isDefault, true),
          ),
        )
        .limit(1)
      if (!defaultRole) throw new Error('Server default role is missing')
      await tx
        .delete(serverMemberRoles)
        .where(
          and(
            eq(serverMemberRoles.memberId, membership.id),
            ne(serverMemberRoles.roleId, defaultRole.id),
          ),
        )
      await tx
        .update(servers)
        .set({
          memberCount: sql`greatest(0, ${servers.memberCount} - 1)`,
          version: sql`${servers.version} + 1`,
        })
        .where(eq(servers.id, serverId))
      await tx.insert(auditLog).values({
        action: 'member.left',
        actorId: userId,
        id: createId(),
        serverId,
        targetId: userId,
        targetType: 'user',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: membership.id,
        aggregateType: 'server_member',
        id: createId(),
        payload: {
          audience: { serverId, userIds: [userId] },
          data: { serverId, userId },
        },
        topic: 'server.member_left',
      })

      return { serverId, state: 'left' as const, userId }
    })
  }

  async kick(
    actorId: string,
    serverId: string,
    targetUserId: string,
    reason?: string,
  ) {
    const authorization = await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.KickMembers,
    )
    const target = await this.#targetMember(
      authorization,
      targetUserId,
      Permission.KickMembers,
    )
    const { db } = requireDatabase(this.#app)
    const normalizedReason = reason?.trim() || null

    return db.transaction(async (tx) => {
      const leftAt = new Date()
      await tx
        .update(serverMembers)
        .set({
          leftAt,
          membershipVersion: sql`${serverMembers.membershipVersion} + 1`,
          permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
          state: 'left',
          timeoutUntil: null,
        })
        .where(eq(serverMembers.id, target.id))
      const [defaultRole] = await tx
        .select({ id: serverRoles.id })
        .from(serverRoles)
        .where(
          and(
            eq(serverRoles.serverId, serverId),
            eq(serverRoles.isDefault, true),
          ),
        )
        .limit(1)
      if (!defaultRole) throw new Error('Server default role is missing')
      await tx
        .delete(serverMemberRoles)
        .where(
          and(
            eq(serverMemberRoles.memberId, target.id),
            ne(serverMemberRoles.roleId, defaultRole.id),
          ),
        )
      await tx
        .update(servers)
        .set({
          memberCount: sql`greatest(0, ${servers.memberCount} - 1)`,
          version: sql`${servers.version} + 1`,
        })
        .where(eq(servers.id, serverId))
      const caseId = createId()
      await tx.insert(moderationCases).values({
        id: caseId,
        openedBy: actorId,
        reason: normalizedReason,
        serverId,
        status: 'resolved',
        subjectId: targetUserId,
        subjectType: 'user',
      })
      await tx.insert(moderationActions).values({
        action: 'kick',
        actorId,
        caseId,
        id: createId(),
        reason: normalizedReason,
      })
      await tx.insert(auditLog).values({
        action: 'member.kicked',
        actorId,
        id: createId(),
        reason: normalizedReason,
        serverId,
        targetId: targetUserId,
        targetType: 'user',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: target.id,
        aggregateType: 'server_member',
        id: createId(),
        payload: {
          audience: { serverId, userIds: [targetUserId] },
          data: { serverId, targetUserId },
        },
        topic: 'server.member_kicked',
      })

      return { serverId, state: 'left' as const, userId: targetUserId }
    })
  }

  async clearTimeout(actorId: string, serverId: string, targetUserId: string) {
    const authorization = await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.MuteMembers,
    )
    const target = await this.#targetMember(
      authorization,
      targetUserId,
      Permission.MuteMembers,
    )
    if (!target.timeoutUntil) {
      return { cleared: false, serverId, userId: targetUserId }
    }
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      await tx
        .update(serverMembers)
        .set({
          permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
          timeoutUntil: null,
        })
        .where(eq(serverMembers.id, target.id))
      await tx.insert(auditLog).values({
        action: 'member.timeout_cleared',
        actorId,
        id: createId(),
        serverId,
        targetId: targetUserId,
        targetType: 'user',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: target.id,
        aggregateType: 'server_member',
        id: createId(),
        payload: {
          audience: { serverId, userIds: [targetUserId] },
          data: { serverId, targetUserId },
        },
        topic: 'server.member_timeout_cleared',
      })

      return { cleared: true, serverId, userId: targetUserId }
    })
  }

  async unban(actorId: string, serverId: string, targetUserId: string) {
    await authorizeServer(this.#app, actorId, serverId, Permission.BanMembers)
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      const removed = await tx
        .delete(serverBans)
        .where(
          and(
            eq(serverBans.serverId, serverId),
            eq(serverBans.userId, targetUserId),
          ),
        )
        .returning({ userId: serverBans.userId })
      if (removed.length > 0) {
        const caseId = createId()
        await tx.insert(moderationCases).values({
          id: caseId,
          openedBy: actorId,
          serverId,
          status: 'resolved',
          subjectId: targetUserId,
          subjectType: 'user',
        })
        await tx.insert(moderationActions).values({
          action: 'unban',
          actorId,
          caseId,
          id: createId(),
        })
        await tx.insert(auditLog).values({
          action: 'member.unbanned',
          actorId,
          id: createId(),
          serverId,
          targetId: targetUserId,
          targetType: 'user',
        })
        await tx.insert(outboxEvents).values({
          aggregateId: targetUserId,
          aggregateType: 'server_ban',
          id: createId(),
          payload: {
            audience: { serverId, userIds: [targetUserId] },
            data: { serverId, targetUserId },
          },
          topic: 'server.member_unbanned',
        })
      }

      return {
        removed: removed.length > 0,
        serverId,
        userId: targetUserId,
      }
    })
  }

  async replaceRoles(
    actorId: string,
    serverId: string,
    targetUserId: string,
    input: UpdateMemberRolesBody,
  ) {
    const authorization = await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageRoles,
    )
    const { db } = requireDatabase(this.#app)
    const target = await this.#targetMember(
      authorization,
      targetUserId,
      Permission.ManageRoles,
    )
    const requestedRoles =
      input.roleIds.length === 0
        ? []
        : await db
            .select()
            .from(serverRoles)
            .where(
              and(
                eq(serverRoles.serverId, serverId),
                inArray(serverRoles.id, input.roleIds),
              ),
            )
    if (requestedRoles.length !== input.roleIds.length) {
      throw new BadRequestError(
        'One or more roles do not belong to this server',
        'INVALID_ROLE',
      )
    }

    for (const role of requestedRoles) {
      if (
        !authorization.isOwner &&
        ((role.permissions & ~authorization.permissions) !== 0n ||
          !authorization.highestRolePosition ||
          role.positionKey >= authorization.highestRolePosition)
      ) {
        throw new ForbiddenError(
          'You cannot assign a role equal to or above your hierarchy',
        )
      }
    }

    const [defaultRole] = await db
      .select()
      .from(serverRoles)
      .where(
        and(
          eq(serverRoles.serverId, serverId),
          eq(serverRoles.isDefault, true),
        ),
      )
      .limit(1)
    if (!defaultRole) throw new Error('Server default role is missing')

    const roleIds = [
      defaultRole.id,
      ...requestedRoles
        .filter((role) => !role.isDefault)
        .map((role) => role.id),
    ]
    const result = await db.transaction(async (tx) => {
      await tx
        .delete(serverMemberRoles)
        .where(
          and(
            eq(serverMemberRoles.memberId, target.id),
            ne(serverMemberRoles.roleId, defaultRole.id),
          ),
        )
      if (roleIds.length > 0) {
        await tx
          .insert(serverMemberRoles)
          .values(
            roleIds.map((roleId) => ({
              assignedBy: actorId,
              memberId: target.id,
              roleId,
            })),
          )
          .onConflictDoNothing()
      }
      const [member] = await tx
        .update(serverMembers)
        .set({
          permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
        })
        .where(eq(serverMembers.id, target.id))
        .returning()
      if (!member) throw new Error('Target membership disappeared')

      await tx.insert(auditLog).values({
        action: 'member.roles_updated',
        actorId,
        id: createId(),
        metadata: { roleIds },
        serverId,
        targetId: targetUserId,
        targetType: 'user',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: target.id,
        aggregateType: 'server_member',
        aggregateVersion: member.permissionsVersion,
        id: createId(),
        payload: {
          audience: { serverId, userIds: [targetUserId] },
          data: { memberId: target.id, roleIds, serverId, targetUserId },
        },
        topic: 'server.member_roles_updated',
      })
      return member
    })

    return {
      memberId: target.id,
      permissionsVersion: result.permissionsVersion,
      roleIds,
    }
  }

  async timeout(
    actorId: string,
    serverId: string,
    targetUserId: string,
    input: TimeoutMemberBody,
  ) {
    const authorization = await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.MuteMembers,
    )
    const target = await this.#targetMember(
      authorization,
      targetUserId,
      Permission.MuteMembers,
    )
    const { db } = requireDatabase(this.#app)
    const timeoutUntil = new Date(Date.now() + input.durationSeconds * 1_000)
    const caseId = createId()

    await db.transaction(async (tx) => {
      await tx
        .update(serverMembers)
        .set({
          permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
          timeoutUntil,
        })
        .where(eq(serverMembers.id, target.id))
      await tx.insert(moderationCases).values({
        id: caseId,
        openedBy: actorId,
        reason: input.reason?.trim() || null,
        serverId,
        status: 'resolved',
        subjectId: targetUserId,
        subjectType: 'user',
      })
      await tx.insert(moderationActions).values({
        action: 'timeout',
        actorId,
        caseId,
        expiresAt: timeoutUntil,
        id: createId(),
        reason: input.reason?.trim() || null,
      })
      await tx.insert(auditLog).values({
        action: 'member.timed_out',
        actorId,
        id: createId(),
        metadata: { timeoutUntil: timeoutUntil.toISOString() },
        reason: input.reason?.trim() || null,
        serverId,
        targetId: targetUserId,
        targetType: 'user',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: target.id,
        aggregateType: 'server_member',
        id: createId(),
        payload: {
          audience: { serverId, userIds: [targetUserId] },
          data: {
            serverId,
            targetUserId,
            timeoutUntil: timeoutUntil.toISOString(),
          },
        },
        topic: 'server.member_timed_out',
      })
    })

    return { applied: true, targetUserId }
  }

  async ban(
    actorId: string,
    serverId: string,
    targetUserId: string,
    input: BanMemberBody,
  ) {
    const authorization = await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.BanMembers,
    )
    const target = await this.#targetMember(
      authorization,
      targetUserId,
      Permission.BanMembers,
    )
    const { db } = requireDatabase(this.#app)
    const expiresAt = input.expiresInSeconds
      ? new Date(Date.now() + input.expiresInSeconds * 1_000)
      : null
    const caseId = createId()

    await db.transaction(async (tx) => {
      await tx
        .insert(serverBans)
        .values({
          expiresAt,
          moderatorId: actorId,
          reason: input.reason?.trim() || null,
          serverId,
          userId: targetUserId,
        })
        .onConflictDoUpdate({
          set: {
            createdAt: new Date(),
            expiresAt,
            moderatorId: actorId,
            reason: input.reason?.trim() || null,
          },
          target: [serverBans.serverId, serverBans.userId],
        })
      await tx
        .update(serverMembers)
        .set({
          leftAt: new Date(),
          membershipVersion: sql`${serverMembers.membershipVersion} + 1`,
          permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
          state: 'left',
          timeoutUntil: null,
        })
        .where(eq(serverMembers.id, target.id))
      const [defaultRole] = await tx
        .select({ id: serverRoles.id })
        .from(serverRoles)
        .where(
          and(
            eq(serverRoles.serverId, serverId),
            eq(serverRoles.isDefault, true),
          ),
        )
        .limit(1)
      if (!defaultRole) throw new Error('Server default role is missing')
      await tx
        .delete(serverMemberRoles)
        .where(
          and(
            eq(serverMemberRoles.memberId, target.id),
            ne(serverMemberRoles.roleId, defaultRole.id),
          ),
        )
      await tx
        .update(servers)
        .set({
          memberCount: sql`greatest(0, ${servers.memberCount} - 1)`,
          version: sql`${servers.version} + 1`,
        })
        .where(eq(servers.id, serverId))
      await tx.insert(moderationCases).values({
        id: caseId,
        openedBy: actorId,
        reason: input.reason?.trim() || null,
        serverId,
        status: 'resolved',
        subjectId: targetUserId,
        subjectType: 'user',
      })
      await tx.insert(moderationActions).values({
        action: 'ban',
        actorId,
        caseId,
        expiresAt,
        id: createId(),
        reason: input.reason?.trim() || null,
      })
      await tx.insert(auditLog).values({
        action: 'member.banned',
        actorId,
        id: createId(),
        metadata: { expiresAt: expiresAt?.toISOString() ?? null },
        reason: input.reason?.trim() || null,
        serverId,
        targetId: targetUserId,
        targetType: 'user',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: target.id,
        aggregateType: 'server_member',
        id: createId(),
        payload: {
          audience: { serverId, userIds: [targetUserId] },
          data: { serverId, targetUserId },
        },
        topic: 'server.member_banned',
      })
    })

    return { applied: true, targetUserId }
  }

  async #targetMember(
    authorization: ServerAuthorization,
    targetUserId: string,
    requiredPermission: bigint,
  ) {
    if (authorization.userId === targetUserId) {
      throw new BadRequestError(
        'You cannot apply this action to yourself',
        'SELF_MODERATION',
      )
    }
    const { db } = requireDatabase(this.#app)
    const [target] = await db
      .select({
        id: serverMembers.id,
        ownerId: servers.ownerId,
        state: serverMembers.state,
        timeoutUntil: serverMembers.timeoutUntil,
      })
      .from(serverMembers)
      .innerJoin(servers, eq(servers.id, serverMembers.serverId))
      .where(
        and(
          eq(serverMembers.serverId, authorization.serverId),
          eq(serverMembers.userId, targetUserId),
        ),
      )
      .limit(1)
    if (!target || target.state !== 'active') {
      throw new NotFoundError('Target member not found')
    }
    if (target.ownerId === targetUserId) {
      throw new ForbiddenError('The server owner cannot be moderated')
    }

    if (!authorization.isOwner) {
      const roles = await db
        .select({
          permissions: serverRoles.permissions,
          positionKey: serverRoles.positionKey,
        })
        .from(serverMemberRoles)
        .innerJoin(serverRoles, eq(serverRoles.id, serverMemberRoles.roleId))
        .where(eq(serverMemberRoles.memberId, target.id))
      const targetPermissions = roles.reduce(
        (permissions, role) => permissions | role.permissions,
        0n,
      )
      const targetHighestPosition = roles.reduce<string | null>(
        (highest, role) =>
          !highest || role.positionKey > highest ? role.positionKey : highest,
        null,
      )
      if (
        !authorization.highestRolePosition ||
        !targetHighestPosition ||
        targetHighestPosition >= authorization.highestRolePosition ||
        (targetPermissions & ~authorization.permissions) !== 0n ||
        (targetPermissions & requiredPermission) !== 0n
      ) {
        throw new ForbiddenError(
          'The target member is equal to or above your permission level',
        )
      }
    }
    return target
  }
}
