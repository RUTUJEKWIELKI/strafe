import {
  ChannelListResponseSchema,
  ChannelSchema,
  CreateChannelBodySchema,
  CreateInviteBodySchema,
  CreateRoleBodySchema,
  CreateServerBodySchema,
  CreateServerResponseSchema,
  ErrorResponseSchema,
  InviteSchema,
  JoinInviteResponseSchema,
  RoleSchema,
  ServerListResponseSchema,
  ServerSchema,
  type CreateChannelBody,
  type CreateInviteBody,
  type CreateRoleBody,
  type CreateServerBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const ServerParamsSchema = Type.Object({
  serverId: Type.String({ format: 'uuid' }),
})
const InviteParamsSchema = Type.Object({
  code: Type.String({ maxLength: 128, minLength: 8 }),
})

const serverRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: CreateServerBody }>(
    '/servers',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
      preHandler: app.authenticate,
      schema: {
        body: CreateServerBodySchema,
        operationId: 'createServer',
        response: {
          201: CreateServerResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: 'Create a server with default text and voice channels',
        tags: ['servers'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.serverService.create(request.auth.userId, request.body),
        ),
  )

  app.get(
    '/users/@me/servers',
    {
      config: { botScopes: ['servers:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'listCurrentUserServers',
        response: { 200: ServerListResponseSchema },
        summary: 'List servers joined by the authenticated user',
        tags: ['servers'],
      },
    },
    async (request) => ({
      servers: await app.serverService.listForUser(request.auth.userId),
    }),
  )

  app.get<{ Params: { serverId: string } }>(
    '/servers/:serverId',
    {
      config: { botScopes: ['servers:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'getServer',
        params: ServerParamsSchema,
        response: {
          200: ServerSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Get a server visible to the current member',
        tags: ['servers'],
      },
    },
    async (request) =>
      app.serverService.get(request.auth.userId, request.params.serverId),
  )

  app.get<{ Params: { serverId: string } }>(
    '/servers/:serverId/channels',
    {
      config: { botScopes: ['channels:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'listServerChannels',
        params: ServerParamsSchema,
        response: { 200: ChannelListResponseSchema },
        summary: 'List channels visible to the current member',
        tags: ['channels'],
      },
    },
    async (request) => ({
      channels: await app.serverService.listChannels(
        request.auth.userId,
        request.params.serverId,
      ),
    }),
  )

  app.post<{
    Body: CreateChannelBody
    Params: { serverId: string }
  }>(
    '/servers/:serverId/channels',
    {
      config: { botScopes: ['channels:write'] },
      preHandler: app.authenticate,
      schema: {
        body: CreateChannelBodySchema,
        operationId: 'createChannel',
        params: ServerParamsSchema,
        response: {
          201: ChannelSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'Create a channel using server role permissions',
        tags: ['channels'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.serverService.createChannel(
            request.auth.userId,
            request.params.serverId,
            request.body,
          ),
        ),
  )

  app.post<{ Body: CreateRoleBody; Params: { serverId: string } }>(
    '/servers/:serverId/roles',
    {
      config: { botScopes: ['roles:write'] },
      preHandler: app.authenticate,
      schema: {
        body: CreateRoleBodySchema,
        operationId: 'createRole',
        params: ServerParamsSchema,
        response: {
          201: RoleSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'Create a role without privilege escalation',
        tags: ['roles'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.serverService.createRole(
            request.auth.userId,
            request.params.serverId,
            request.body,
          ),
        ),
  )

  app.post<{ Body: CreateInviteBody; Params: { serverId: string } }>(
    '/servers/:serverId/invites',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      preHandler: app.authenticate,
      schema: {
        body: CreateInviteBodySchema,
        operationId: 'createInvite',
        params: ServerParamsSchema,
        response: {
          201: InviteSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'Create a hashed, optionally expiring server invite',
        tags: ['invites'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.serverService.createInvite(
            request.auth.userId,
            request.params.serverId,
            request.body,
          ),
        ),
  )

  app.post<{ Params: { code: string } }>(
    '/invites/:code/join',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'joinServerInvite',
        params: InviteParamsSchema,
        response: {
          200: JoinInviteResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Join a server using an invite in one locked transaction',
        tags: ['invites'],
      },
    },
    async (request) =>
      app.serverService.joinInvite(request.auth.userId, request.params.code),
  )
}

export default serverRoutes
