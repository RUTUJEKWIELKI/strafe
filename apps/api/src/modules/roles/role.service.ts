import type { ReorderRolesBody, UpdateRoleBody } from '@strafe/shared'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  auditLog,
  outboxEvents,
  serverMemberRoles,
  serverMembers,
  serverRoles,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'
import { parsePermissionBits, Permission } from '../../lib/permissions.js'
import { authorizeServer } from '../permissions/authorization.js'

function mapRole(row: typeof serverRoles.$inferSelect) {
  return {
    color: row.color,
    id: row.id,
    isDefault: row.isDefault,
    name: row.name,
    permissions: row.permissions.toString(),
    positionKey: row.positionKey,
    serverId: row.serverId,
  }
}

export class RoleService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async list(actorId: string, serverId: string) {
    await authorizeServer(this.#app, actorId, serverId, Permission.ViewChannel)
    const { db } = requireDatabase(this.#app)
    const roles = await db
      .select()
      .from(serverRoles)
      .where(eq(serverRoles.serverId, serverId))
      .orderBy(desc(serverRoles.positionKey), desc(serverRoles.id))
    return roles.map(mapRole)
  }

  async update(
    actorId: string,
    serverId: string,
    roleId: string,
    input: UpdateRoleBody,
  ) {
    const authorization = await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageRoles,
    )
    const { db } = requireDatabase(this.#app)
    const [role] = await db
      .select()
      .from(serverRoles)
      .where(
        and(eq(serverRoles.id, roleId), eq(serverRoles.serverId, serverId)),
      )
      .limit(1)
    if (!role) throw new NotFoundError('Role not found')
    if (role.isManaged) {
      throw new ForbiddenError('Managed roles cannot be edited manually')
    }
    if (
      role.isDefault &&
      (input.name !== undefined || input.color !== undefined)
    ) {
      throw new BadRequestError(
        'The default role name and color are fixed',
        'DEFAULT_ROLE_IMMUTABLE',
      )
    }

    let permissions = role.permissions
    if (input.permissions !== undefined) {
      try {
        permissions = parsePermissionBits(input.permissions)
      } catch {
        throw new BadRequestError(
          'Permission bit field is invalid',
          'INVALID_PERMISSIONS',
        )
      }
    }
    if (
      !authorization.isOwner &&
      (((role.permissions | permissions) & ~authorization.permissions) !== 0n ||
        !authorization.highestRolePosition ||
        role.positionKey >= authorization.highestRolePosition)
    ) {
      throw new ForbiddenError(
        'You cannot edit a role equal to or above your hierarchy',
      )
    }

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(serverRoles)
        .set({
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          permissions,
          updatedAt: new Date(),
        })
        .where(eq(serverRoles.id, roleId))
        .returning()
      if (!updated) throw new Error('Role update returned no row')

      const affectedMembers = await tx
        .select({ memberId: serverMemberRoles.memberId })
        .from(serverMemberRoles)
        .where(eq(serverMemberRoles.roleId, roleId))
      if (affectedMembers.length > 0) {
        await tx
          .update(serverMembers)
          .set({
            permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
          })
          .where(
            inArray(
              serverMembers.id,
              affectedMembers.map((member) => member.memberId),
            ),
          )
      }
      const changedFields = Object.keys(input).sort()
      await tx.insert(auditLog).values({
        action: 'role.updated',
        actorId,
        id: createId(),
        metadata: { changedFields },
        serverId,
        targetId: roleId,
        targetType: 'role',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: roleId,
        aggregateType: 'role',
        id: createId(),
        payload: {
          audience: { serverId },
          data: { changedFields, roleId, serverId },
        },
        topic: 'role.updated',
      })

      return mapRole(updated)
    })
  }

  async delete(actorId: string, serverId: string, roleId: string) {
    const authorization = await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageRoles,
    )
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      const [role] = await tx
        .select()
        .from(serverRoles)
        .where(
          and(eq(serverRoles.id, roleId), eq(serverRoles.serverId, serverId)),
        )
        .limit(1)
        .for('update')
      if (!role) throw new NotFoundError('Role not found')
      if (role.isDefault || role.isManaged) {
        throw new ForbiddenError('Default and managed roles cannot be deleted')
      }
      if (
        !authorization.isOwner &&
        ((role.permissions & ~authorization.permissions) !== 0n ||
          !authorization.highestRolePosition ||
          role.positionKey >= authorization.highestRolePosition)
      ) {
        throw new ForbiddenError(
          'You cannot delete a role equal to or above your hierarchy',
        )
      }

      const affectedMembers = await tx
        .select({ memberId: serverMemberRoles.memberId })
        .from(serverMemberRoles)
        .where(eq(serverMemberRoles.roleId, roleId))
      await tx.delete(serverRoles).where(eq(serverRoles.id, roleId))
      if (affectedMembers.length > 0) {
        await tx
          .update(serverMembers)
          .set({
            permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
          })
          .where(
            inArray(
              serverMembers.id,
              affectedMembers.map((member) => member.memberId),
            ),
          )
      }
      await tx.insert(auditLog).values({
        action: 'role.deleted',
        actorId,
        id: createId(),
        serverId,
        targetId: roleId,
        targetType: 'role',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: roleId,
        aggregateType: 'role',
        id: createId(),
        payload: {
          audience: { serverId },
          data: { roleId, serverId },
        },
        topic: 'role.deleted',
      })

      return { deleted: true as const, roleId }
    })
  }

  async reorder(actorId: string, serverId: string, input: ReorderRolesBody) {
    const authorization = await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageRoles,
    )
    if (!authorization.isOwner) {
      throw new ForbiddenError(
        'Only the server owner can replace the complete role hierarchy',
      )
    }
    const { db } = requireDatabase(this.#app)

    return db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${serverId}, 0))`,
      )
      const roles = await tx
        .select()
        .from(serverRoles)
        .where(eq(serverRoles.serverId, serverId))
        .for('update')
      const movable = roles.filter((role) => !role.isDefault)
      const requested = new Set(input.roleIds)
      if (
        requested.size !== input.roleIds.length ||
        requested.size !== movable.length ||
        movable.some((role) => !requested.has(role.id))
      ) {
        throw new BadRequestError(
          'Role order must contain every non-default server role exactly once',
          'INVALID_ROLE_ORDER',
        )
      }

      const reordered = []
      for (const [index, roleId] of input.roleIds.entries()) {
        const [role] = await tx
          .update(serverRoles)
          .set({
            positionKey: String(
              (input.roleIds.length - index) * 1_000_000,
            ).padStart(20, '0'),
            updatedAt: new Date(),
          })
          .where(eq(serverRoles.id, roleId))
          .returning()
        if (!role) throw new Error('Role order update returned no row')
        reordered.push(mapRole(role))
      }
      const defaultRole = roles.find((role) => role.isDefault)
      if (!defaultRole) throw new Error('Server default role is missing')
      const [updatedDefaultRole] = await tx
        .update(serverRoles)
        .set({ positionKey: '00000000000000000000', updatedAt: new Date() })
        .where(eq(serverRoles.id, defaultRole.id))
        .returning()
      if (!updatedDefaultRole) {
        throw new Error('Default role order update returned no row')
      }
      reordered.push(mapRole(updatedDefaultRole))

      await tx.insert(auditLog).values({
        action: 'roles.reordered',
        actorId,
        id: createId(),
        metadata: { roleIds: input.roleIds },
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
          data: { roleIds: input.roleIds, serverId },
        },
        topic: 'server.roles_reordered',
      })

      return reordered
    })
  }
}
