import {
  ChannelListResponseSchema,
  ChannelSchema,
  CreateDirectMessageBodySchema,
  CreateGroupDirectMessageBodySchema,
  ConversationListResponseSchema,
  ConversationSchema,
  ErrorResponseSchema,
  type CreateDirectMessageBody,
  type CreateGroupDirectMessageBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'

const directMessageRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/users/@me/conversations',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listConversations',
        response: { 200: ConversationListResponseSchema },
        summary: 'List private DM and group conversations',
        tags: ['direct-messages'],
      },
    },
    async (request) => ({
      conversations: await app.directMessageService.listConversations(
        request.auth.userId,
      ),
    }),
  )

  app.post<{ Body: CreateGroupDirectMessageBody }>(
    '/users/@me/groups',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      preHandler: app.authenticate,
      schema: {
        body: CreateGroupDirectMessageBodySchema,
        operationId: 'createGroupDirectMessage',
        response: {
          201: ConversationSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Create a private group conversation',
        tags: ['direct-messages'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.directMessageService.createGroup(
            request.auth.userId,
            request.body,
            request.ip,
          ),
        ),
  )

  app.get(
    '/users/@me/dms',
    {
      config: { botScopes: ['channels:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'listDirectMessages',
        response: { 200: ChannelListResponseSchema },
        summary: 'List private conversations for the current user',
        tags: ['direct-messages'],
      },
    },
    async (request) => ({
      channels: await app.directMessageService.list(request.auth.userId),
    }),
  )

  app.post<{ Body: CreateDirectMessageBody }>(
    '/users/@me/dms',
    {
      config: {
        rateLimit: { max: 20, timeWindow: '1 minute' },
        botScopes: ['messages:write'],
      },
      preHandler: app.authenticate,
      schema: {
        body: CreateDirectMessageBodySchema,
        operationId: 'createDirectMessage',
        response: {
          201: ChannelSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Create or return a canonical two-user conversation',
        tags: ['direct-messages'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.directMessageService.create(
            request.auth.userId,
            request.body,
            request.ip,
          ),
        ),
  )
}

export default directMessageRoutes
