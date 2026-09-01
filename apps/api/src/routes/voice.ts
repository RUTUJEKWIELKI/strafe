import { ErrorResponseSchema, VoiceTokenSchema } from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const ChannelParamsSchema = Type.Object({
  channelId: Type.String({ format: 'uuid' }),
})

const voiceRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Params: { channelId: string } }>(
    '/channels/:channelId/voice/token',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'createVoiceToken',
        params: ChannelParamsSchema,
        response: {
          200: VoiceTokenSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          503: ErrorResponseSchema,
        },
        summary: 'Issue a short-lived LiveKit token after permission checks',
        tags: ['voice'],
      },
    },
    async (request) =>
      app.voiceService.createToken(
        request.auth.userId,
        request.params.channelId,
      ),
  )
}

export default voiceRoutes
