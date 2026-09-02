import {
  CreateMessageBodySchema,
  DeleteMessageResponseSchema,
  ErrorResponseSchema,
  ListMessagesQuerySchema,
  MessageListResponseSchema,
  MessageSchema,
  ReactionBodySchema,
  ReactionResponseSchema,
  ReadStateBodySchema,
  ReadStateSchema,
  UpdateMessageBodySchema,
  type CreateMessageBody,
  type ListMessagesQuery,
  type ReactionBody,
  type ReadStateBody,
  type UpdateMessageBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const ChannelParamsSchema = Type.Object({
  channelId: Type.String({ format: 'uuid' }),
})
const MessageParamsSchema = Type.Object({
  messageId: Type.String({ format: 'uuid' }),
})

const messageRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Params: { channelId: string }
    Querystring: ListMessagesQuery
  }>(
    '/channels/:channelId/messages',
    {
      config: { botScopes: ['messages:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'listMessages',
        params: ChannelParamsSchema,
        querystring: ListMessagesQuerySchema,
        response: {
          200: MessageListResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Read channel history using keyset pagination',
        tags: ['messages'],
      },
    },
    async (request) =>
      app.messageService.list(
        request.auth.userId,
        request.params.channelId,
        request.query.limit ?? 50,
        request.query.before,
      ),
  )

  app.post<{
    Body: CreateMessageBody
    Params: { channelId: string }
  }>(
    '/channels/:channelId/messages',
    {
      config: { botScopes: ['messages:write'], rateLimit: { max: 30, timeWindow: '10 seconds' } },
      preHandler: app.authenticate,
      schema: {
        body: CreateMessageBodySchema,
        operationId: 'createMessage',
        params: ChannelParamsSchema,
        response: {
          201: MessageSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Send an idempotent message',
        tags: ['messages'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.messageService.create(
            request.auth.userId,
            request.params.channelId,
            request.body,
          ),
        ),
  )

  app.patch<{
    Body: UpdateMessageBody
    Params: { messageId: string }
  }>(
    '/messages/:messageId',
    {
      config: { botScopes: ['messages:write'] },
      preHandler: app.authenticate,
      schema: {
        body: UpdateMessageBodySchema,
        operationId: 'updateMessage',
        params: MessageParamsSchema,
        response: {
          200: MessageSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Edit a message and retain its moderation history',
        tags: ['messages'],
      },
    },
    async (request) =>
      app.messageService.update(
        request.auth.userId,
        request.params.messageId,
        request.body,
      ),
  )

  app.delete<{ Params: { messageId: string } }>(
    '/messages/:messageId',
    {
      config: { botScopes: ['messages:write'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'deleteMessage',
        params: MessageParamsSchema,
        response: {
          200: DeleteMessageResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'Replace a message with a stable tombstone',
        tags: ['messages'],
      },
    },
    async (request) => ({
      deleted: await app.messageService.delete(
        request.auth.userId,
        request.params.messageId,
      ),
    }),
  )

  app.put<{ Body: ReactionBody; Params: { messageId: string } }>(
    '/messages/:messageId/reactions',
    {
      config: { botScopes: ['messages:write'] },
      preHandler: app.authenticate,
      schema: {
        body: ReactionBodySchema,
        operationId: 'addMessageReaction',
        params: MessageParamsSchema,
        response: {
          200: ReactionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Add an idempotent reaction to a message',
        tags: ['messages'],
      },
    },
    async (request) => ({
      active: await app.messageService.setReaction(
        request.auth.userId,
        request.params.messageId,
        request.body.emojiKey,
        true,
      ),
    }),
  )

  app.delete<{ Body: ReactionBody; Params: { messageId: string } }>(
    '/messages/:messageId/reactions',
    {
      config: { botScopes: ['messages:write'] },
      preHandler: app.authenticate,
      schema: {
        body: ReactionBodySchema,
        operationId: 'removeMessageReaction',
        params: MessageParamsSchema,
        response: {
          200: ReactionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Remove the current user reaction',
        tags: ['messages'],
      },
    },
    async (request) => ({
      active: await app.messageService.setReaction(
        request.auth.userId,
        request.params.messageId,
        request.body.emojiKey,
        false,
      ),
    }),
  )

  app.put<{
    Body: ReadStateBody
    Params: { channelId: string }
  }>(
    '/channels/:channelId/read-state',
    {
      preHandler: app.authenticate,
      schema: {
        body: ReadStateBodySchema,
        operationId: 'markChannelRead',
        params: ChannelParamsSchema,
        response: {
          200: ReadStateSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'Move the current user read cursor atomically',
        tags: ['messages'],
      },
    },
    async (request) =>
      app.messageService.markRead(
        request.auth.userId,
        request.params.channelId,
        request.body.lastReadMessageId,
      ),
  )
}

export default messageRoutes
