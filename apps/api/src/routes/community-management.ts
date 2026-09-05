import {
  AuditLogListResponseSchema,
  ChannelListResponseSchema,
  ChannelPermissionOverwriteListResponseSchema,
  ChannelPermissionOverwriteSchema,
  ChannelSchema,
  DeleteChannelPermissionOverwriteResponseSchema,
  DeleteChannelResponseSchema,
  DeleteRoleResponseSchema,
  DeleteServerResponseSchema,
  ErrorResponseSchema,
  PermissionOverwriteSubjectTypeSchema,
  ReorderChannelsBodySchema,
  ReorderRolesBodySchema,
  RoleListResponseSchema,
  RoleSchema,
  ServerSchema,
  TransferServerOwnershipBodySchema,
  UpdateChannelBodySchema,
  UpdateRoleBodySchema,
  UpdateServerBodySchema,
  UpsertChannelPermissionOverwriteBodySchema,
  type PermissionOverwriteSubjectType,
  type ReorderChannelsBody,
  type ReorderRolesBody,
  type TransferServerOwnershipBody,
  type UpdateChannelBody,
  type UpdateRoleBody,
  type UpdateServerBody,
  type UpsertChannelPermissionOverwriteBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const ServerParamsSchema = Type.Object({
  serverId: Type.String({ format: 'uuid' }),
})
const ChannelParamsSchema = Type.Object({
  channelId: Type.String({ format: 'uuid' }),
})
const RoleParamsSchema = Type.Object({
  roleId: Type.String({ format: 'uuid' }),
  serverId: Type.String({ format: 'uuid' }),
})
const OverwriteParamsSchema = Type.Object({
  channelId: Type.String({ format: 'uuid' }),
  subjectId: Type.String({ format: 'uuid' }),
  subjectType: PermissionOverwriteSubjectTypeSchema,
})
const PageQuerySchema = Type.Object({
  before: Type.Optional(Type.String({ maxLength: 2_048, minLength: 1 })),
  limit: Type.Optional(Type.Integer({ default: 50, maximum: 100, minimum: 1 })),
})

const managementRoutes: FastifyPluginAsync = async (app) => {
  app.patch<{ Body: UpdateServerBody; Params: { serverId: string } }>(
    '/servers/:serverId',
    {
      config: { botScopes: ['servers:write'] },
      preHandler: app.authenticate,
      schema: {
        body: UpdateServerBodySchema,
        operationId: 'updateServer',
        params: ServerParamsSchema,
        response: {
          200: ServerSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Update server settings using ManageServer permission',
        tags: ['servers'],
      },
    },
    async (request) =>
      app.serverService.update(
        request.auth.userId,
        request.params.serverId,
        request.body,
      ),
  )

  app.post<{
    Body: TransferServerOwnershipBody
    Params: { serverId: string }
  }>(
    '/servers/:serverId/transfer-ownership',
    {
      config: {
        rateLimit: { max: 5, timeWindow: '1 hour' },
        botScopes: ['servers:write'],
      },
      preHandler: app.authenticate,
      schema: {
        body: TransferServerOwnershipBodySchema,
        operationId: 'transferServerOwnership',
        params: ServerParamsSchema,
        response: {
          200: ServerSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Transfer ownership to another active member',
        tags: ['servers'],
      },
    },
    async (request) =>
      app.serverService.transferOwnership(
        request.auth.userId,
        request.params.serverId,
        request.body,
      ),
  )

  app.delete<{ Params: { serverId: string } }>(
    '/servers/:serverId',
    {
      config: {
        rateLimit: { max: 3, timeWindow: '1 hour' },
        botScopes: ['servers:write'],
      },
      preHandler: app.authenticate,
      schema: {
        operationId: 'deleteServer',
        params: ServerParamsSchema,
        response: {
          200: DeleteServerResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Soft-delete a server and deactivate its memberships',
        tags: ['servers'],
      },
    },
    async (request) =>
      app.serverService.delete(request.auth.userId, request.params.serverId),
  )

  app.patch<{ Body: UpdateChannelBody; Params: { channelId: string } }>(
    '/channels/:channelId',
    {
      config: { botScopes: ['channels:write'] },
      preHandler: app.authenticate,
      schema: {
        body: UpdateChannelBodySchema,
        operationId: 'updateChannel',
        params: ChannelParamsSchema,
        response: {
          200: ChannelSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Update a server channel without changing its type',
        tags: ['channels'],
      },
    },
    async (request) =>
      app.channelManagementService.update(
        request.auth.userId,
        request.params.channelId,
        request.body,
      ),
  )

  app.delete<{ Params: { channelId: string } }>(
    '/channels/:channelId',
    {
      config: { botScopes: ['channels:write'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'deleteChannel',
        params: ChannelParamsSchema,
        response: {
          200: DeleteChannelResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Soft-delete a channel and detach its children',
        tags: ['channels'],
      },
    },
    async (request) =>
      app.channelManagementService.delete(
        request.auth.userId,
        request.params.channelId,
      ),
  )

  app.put<{ Body: ReorderChannelsBody; Params: { serverId: string } }>(
    '/servers/:serverId/channels/order',
    {
      config: { botScopes: ['channels:write'] },
      preHandler: app.authenticate,
      schema: {
        body: ReorderChannelsBodySchema,
        operationId: 'reorderServerChannels',
        params: ServerParamsSchema,
        response: {
          200: ChannelListResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'Replace the complete channel and category order',
        tags: ['channels'],
      },
    },
    async (request) => ({
      channels: await app.channelManagementService.reorder(
        request.auth.userId,
        request.params.serverId,
        request.body,
      ),
    }),
  )

  app.get<{ Params: { channelId: string } }>(
    '/channels/:channelId/permission-overwrites',
    {
      config: { botScopes: ['roles:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'listChannelPermissionOverwrites',
        params: ChannelParamsSchema,
        response: { 200: ChannelPermissionOverwriteListResponseSchema },
        summary: 'List channel role and member permission overwrites',
        tags: ['permissions'],
      },
    },
    async (request) => ({
      overwrites: await app.channelManagementService.listOverwrites(
        request.auth.userId,
        request.params.channelId,
      ),
    }),
  )

  app.put<{
    Body: UpsertChannelPermissionOverwriteBody
    Params: {
      channelId: string
      subjectId: string
      subjectType: PermissionOverwriteSubjectType
    }
  }>(
    '/channels/:channelId/permission-overwrites/:subjectType/:subjectId',
    {
      config: { botScopes: ['roles:write'] },
      preHandler: app.authenticate,
      schema: {
        body: UpsertChannelPermissionOverwriteBodySchema,
        operationId: 'upsertChannelPermissionOverwrite',
        params: OverwriteParamsSchema,
        response: {
          200: ChannelPermissionOverwriteSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Create or replace a channel permission overwrite',
        tags: ['permissions'],
      },
    },
    async (request) =>
      app.channelManagementService.upsertOverwrite(
        request.auth.userId,
        request.params.channelId,
        request.params.subjectType,
        request.params.subjectId,
        request.body,
      ),
  )

  app.delete<{
    Params: {
      channelId: string
      subjectId: string
      subjectType: PermissionOverwriteSubjectType
    }
  }>(
    '/channels/:channelId/permission-overwrites/:subjectType/:subjectId',
    {
      config: { botScopes: ['roles:write'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'deleteChannelPermissionOverwrite',
        params: OverwriteParamsSchema,
        response: { 200: DeleteChannelPermissionOverwriteResponseSchema },
        summary: 'Delete a channel permission overwrite',
        tags: ['permissions'],
      },
    },
    async (request) =>
      app.channelManagementService.deleteOverwrite(
        request.auth.userId,
        request.params.channelId,
        request.params.subjectType,
        request.params.subjectId,
      ),
  )

  app.get<{ Params: { serverId: string } }>(
    '/servers/:serverId/roles',
    {
      config: { botScopes: ['roles:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'listServerRoles',
        params: ServerParamsSchema,
        response: { 200: RoleListResponseSchema },
        summary: 'List roles from highest to lowest',
        tags: ['roles'],
      },
    },
    async (request) => ({
      roles: await app.roleService.list(
        request.auth.userId,
        request.params.serverId,
      ),
    }),
  )

  app.patch<{
    Body: UpdateRoleBody
    Params: { roleId: string; serverId: string }
  }>(
    '/servers/:serverId/roles/:roleId',
    {
      config: { botScopes: ['roles:write'] },
      preHandler: app.authenticate,
      schema: {
        body: UpdateRoleBodySchema,
        operationId: 'updateServerRole',
        params: RoleParamsSchema,
        response: {
          200: RoleSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Update a role without permission escalation',
        tags: ['roles'],
      },
    },
    async (request) =>
      app.roleService.update(
        request.auth.userId,
        request.params.serverId,
        request.params.roleId,
        request.body,
      ),
  )

  app.delete<{ Params: { roleId: string; serverId: string } }>(
    '/servers/:serverId/roles/:roleId',
    {
      config: { botScopes: ['roles:write'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'deleteServerRole',
        params: RoleParamsSchema,
        response: {
          200: DeleteRoleResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Delete an unmanaged non-default role',
        tags: ['roles'],
      },
    },
    async (request) =>
      app.roleService.delete(
        request.auth.userId,
        request.params.serverId,
        request.params.roleId,
      ),
  )

  app.put<{ Body: ReorderRolesBody; Params: { serverId: string } }>(
    '/servers/:serverId/roles/order',
    {
      config: { botScopes: ['roles:write'] },
      preHandler: app.authenticate,
      schema: {
        body: ReorderRolesBodySchema,
        operationId: 'reorderServerRoles',
        params: ServerParamsSchema,
        response: { 200: RoleListResponseSchema },
        summary: 'Replace the complete role hierarchy as server owner',
        tags: ['roles'],
      },
    },
    async (request) => ({
      roles: await app.roleService.reorder(
        request.auth.userId,
        request.params.serverId,
        request.body,
      ),
    }),
  )

  app.get<{
    Params: { serverId: string }
    Querystring: { before?: string; limit?: number }
  }>(
    '/servers/:serverId/audit-log',
    {
      config: { botScopes: ['servers:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'listServerAuditLog',
        params: ServerParamsSchema,
        querystring: PageQuerySchema,
        response: {
          200: AuditLogListResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'List the permission-protected server audit trail',
        tags: ['audit'],
      },
    },
    async (request) =>
      app.auditService.list(
        request.auth.userId,
        request.params.serverId,
        request.query.limit ?? 50,
        request.query.before,
      ),
  )
}

export default managementRoutes
