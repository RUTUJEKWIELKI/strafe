import {
  ChannelListResponseSchema,
  ChannelSchema,
  CreateDirectMessageBodySchema,
  CreateGroupDirectMessageBodySchema,
  ConversationListResponseSchema,
  ConversationSchema,
  GroupActionResponseSchema,
  GroupMemberBodySchema,
  UpdateGroupDirectMessageBodySchema,
  ErrorResponseSchema,
  type CreateDirectMessageBody,
  type CreateGroupDirectMessageBody,
  type GroupMemberBody,
  type UpdateGroupDirectMessageBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const directMessageRoutes: FastifyPluginAsync = async (app) => {
  const groupParams = Type.Object({
    conversationId: Type.String({ format: 'uuid' }),
  })
  const groupMemberParams = Type.Object({
    conversationId: Type.String({ format: 'uuid' }),
    userId: Type.String({ format: 'uuid' }),
  })

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

  app.patch<{
    Body: UpdateGroupDirectMessageBody
    Params: { conversationId: string }
  }>(
    '/conversations/:conversationId',
    {
      preHandler: app.authenticate,
      schema: {
        body: UpdateGroupDirectMessageBodySchema,
        operationId: 'updateGroupConversation',
        params: groupParams,
        response: {
          200: GroupActionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        tags: ['direct-messages'],
      },
    },
    async (request) =>
      app.directMessageService.renameGroup(
        request.auth.userId,
        request.params.conversationId,
        request.body,
      ),
  )

  app.post<{ Body: GroupMemberBody; Params: { conversationId: string } }>(
    '/conversations/:conversationId/members',
    {
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
      preHandler: app.authenticate,
      schema: {
        body: GroupMemberBodySchema,
        operationId: 'addGroupConversationMember',
        params: groupParams,
        response: {
          200: GroupActionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        tags: ['direct-messages'],
      },
    },
    async (request) =>
      app.directMessageService.addGroupMember(
        request.auth.userId,
        request.params.conversationId,
        request.body,
      ),
  )

  app.delete<{ Params: { conversationId: string; userId: string } }>(
    '/conversations/:conversationId/members/:userId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'removeGroupConversationMember',
        params: groupMemberParams,
        response: {
          200: GroupActionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        tags: ['direct-messages'],
      },
    },
    async (request) =>
      app.directMessageService.removeGroupMember(
        request.auth.userId,
        request.params.conversationId,
        request.params.userId,
      ),
  )

  app.post<{ Params: { conversationId: string } }>(
    '/conversations/:conversationId/leave',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'leaveGroupConversation',
        params: groupParams,
        response: {
          200: GroupActionResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        tags: ['direct-messages'],
      },
    },
    async (request) =>
      app.directMessageService.leaveGroup(
        request.auth.userId,
        request.params.conversationId,
      ),
  )

  app.post<{ Body: GroupMemberBody; Params: { conversationId: string } }>(
    '/conversations/:conversationId/ownership',
    {
      preHandler: app.authenticate,
      schema: {
        body: GroupMemberBodySchema,
        operationId: 'transferGroupConversationOwnership',
        params: groupParams,
        response: {
          200: GroupActionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        tags: ['direct-messages'],
      },
    },
    async (request) =>
      app.directMessageService.transferGroupOwnership(
        request.auth.userId,
        request.params.conversationId,
        request.body.userId,
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
