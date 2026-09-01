import {
  ChannelListResponseSchema,
  ChannelSchema,
  CreateDirectMessageBodySchema,
  ErrorResponseSchema,
  type CreateDirectMessageBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'

const directMessageRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/users/@me/dms',
    {
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
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
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
          ),
        ),
  )
}

export default directMessageRoutes
