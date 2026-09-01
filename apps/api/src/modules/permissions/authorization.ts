import { and, eq, inArray, isNull } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  channelMembers,
  channelPermissionOverwrites,
  channels,
  serverMemberRoles,
  serverMembers,
  serverRoles,
  servers,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import { ForbiddenError, NotFoundError } from '../../lib/errors.js'
import {
  AllPermissions,
  hasPermission,
  Permission,
  resolveChannelPermissions,
} from '../../lib/permissions.js'

export interface ServerAuthorization {
  defaultRoleId: string | null
  highestRolePosition: string | null
  isOwner: boolean
  memberId: string
  permissions: bigint
  roleIds: string[]
  serverId: string
  userId: string
}

export interface ChannelAuthorization extends ServerAuthorization {
  channel: typeof channels.$inferSelect
}

export async function authorizeServer(
  app: FastifyInstance,
  userId: string,
  serverId: string,
  requiredPermission = Permission.ViewChannel,
): Promise<ServerAuthorization> {
  const { db } = requireDatabase(app)
  const [membership] = await db
    .select({
      memberId: serverMembers.id,
      ownerId: servers.ownerId,
      state: serverMembers.state,
      timeoutUntil: serverMembers.timeoutUntil,
    })
    .from(serverMembers)
    .innerJoin(servers, eq(servers.id, serverMembers.serverId))
    .where(
      and(
        eq(serverMembers.serverId, serverId),
        eq(serverMembers.userId, userId),
        isNull(servers.deletedAt),
      ),
    )
    .limit(1)

  if (!membership || membership.state !== 'active') {
    throw new ForbiddenError('You are not an active member of this server')
  }

  if (membership.ownerId === userId) {
    return {
      defaultRoleId: null,
      highestRolePosition: null,
      isOwner: true,
      memberId: membership.memberId,
      permissions: AllPermissions,
      roleIds: [],
      serverId,
      userId,
    }
  }

  const roles = await db
    .select({
      id: serverRoles.id,
      isDefault: serverRoles.isDefault,
      permissions: serverRoles.permissions,
      positionKey: serverRoles.positionKey,
    })
    .from(serverMemberRoles)
    .innerJoin(serverRoles, eq(serverRoles.id, serverMemberRoles.roleId))
    .where(eq(serverMemberRoles.memberId, membership.memberId))

  let permissions = roles.reduce(
    (combined, role) => combined | role.permissions,
    0n,
  )
  if ((permissions & Permission.Administrator) !== 0n) {
    permissions = AllPermissions
  }
  const defaultRoleId = roles.find((role) => role.isDefault)?.id
  if (!defaultRoleId) {
    throw new Error('Server membership is missing the default role')
  }

  if (
    membership.timeoutUntil &&
    membership.timeoutUntil.getTime() > Date.now()
  ) {
    permissions &= ~(
      Permission.SendMessages |
      Permission.AddReactions |
      Permission.SpeakVoice
    )
  }

  if (!hasPermission(permissions, requiredPermission)) {
    throw new ForbiddenError()
  }

  return {
    defaultRoleId,
    highestRolePosition: roles.reduce<string | null>(
      (highest, role) =>
        !highest || role.positionKey > highest ? role.positionKey : highest,
      null,
    ),
    isOwner: false,
    memberId: membership.memberId,
    permissions,
    roleIds: roles.map((role) => role.id),
    serverId,
    userId,
  }
}

export async function authorizeChannel(
  app: FastifyInstance,
  userId: string,
  channelId: string,
  requiredPermission = Permission.ViewChannel,
): Promise<ChannelAuthorization> {
  const { db } = requireDatabase(app)
  const [channel] = await db
    .select()
    .from(channels)
    .where(and(eq(channels.id, channelId), isNull(channels.deletedAt)))
    .limit(1)

  if (!channel) {
    throw new NotFoundError('Channel not found')
  }

  if (!channel.serverId) {
    const [recipient] = await db
      .select({ userId: channelMembers.userId })
      .from(channelMembers)
      .where(
        and(
          eq(channelMembers.channelId, channelId),
          eq(channelMembers.userId, userId),
        ),
      )
      .limit(1)

    if (!recipient) {
      throw new ForbiddenError('You are not a participant in this conversation')
    }

    return {
      channel,
      defaultRoleId: null,
      highestRolePosition: null,
      isOwner: channel.ownerId === userId,
      memberId: userId,
      permissions: AllPermissions,
      roleIds: [],
      serverId: '',
      userId,
    }
  }

  const authorization = await authorizeServer(
    app,
    userId,
    channel.serverId,
    Permission.ViewChannel,
  )

  if (authorization.isOwner) {
    return { ...authorization, channel }
  }

  const subjectIds = [...authorization.roleIds, authorization.memberId]
  const overwrites =
    subjectIds.length === 0
      ? []
      : await db
          .select()
          .from(channelPermissionOverwrites)
          .where(
            and(
              eq(channelPermissionOverwrites.channelId, channelId),
              inArray(channelPermissionOverwrites.subjectId, subjectIds),
            ),
          )

  const defaultRoleOverwrite = overwrites.find(
    (overwrite) =>
      overwrite.subjectType === 'role' &&
      overwrite.subjectId === authorization.defaultRoleId,
  )
  const roleOverwrites = overwrites.filter(
    (overwrite) =>
      overwrite.subjectType === 'role' &&
      overwrite.subjectId !== authorization.defaultRoleId,
  )
  const memberOverwrite = overwrites.find(
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

  if (!hasPermission(permissions, requiredPermission)) {
    throw new ForbiddenError()
  }

  return { ...authorization, channel, permissions }
}
