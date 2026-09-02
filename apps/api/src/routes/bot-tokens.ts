import {
  BotTokenCredentialResponseSchema,
  BotTokenListResponseSchema,
  CreateBotTokenBodySchema,
  ErrorResponseSchema,
  RevokeBotTokenResponseSchema,
  RotateBotTokenBodySchema,
  type CreateBotTokenBody,
  type RotateBotTokenBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const ApplicationParams = Type.Object({
  applicationId: Type.String({ format: 'uuid' }),
})
const TokenParams = Type.Object({
  applicationId: Type.String({ format: 'uuid' }),
  tokenId: Type.String({ format: 'uuid' }),
})

const routes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { applicationId: string } }>(
    '/applications/:applicationId/bot-tokens',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listBotTokens',
        params: ApplicationParams,
        response: { 200: BotTokenListResponseSchema },
        tags: ['bots'],
      },
    },
    async (request) => ({
      tokens: await app.botTokenService.list(
        request.auth.userId,
        request.params.applicationId,
      ),
    }),
  )

  app.post<{ Body: CreateBotTokenBody; Params: { applicationId: string } }>(
    '/applications/:applicationId/bot-tokens',
    {
      preHandler: app.authenticate,
      schema: {
        body: CreateBotTokenBodySchema,
        operationId: 'createBotToken',
        params: ApplicationParams,
        response: {
          201: BotTokenCredentialResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        tags: ['bots'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.botTokenService.create(
            request.auth.userId,
            request.params.applicationId,
            request.body,
          ),
        ),
  )

  app.post<{
    Body: RotateBotTokenBody
    Params: { applicationId: string; tokenId: string }
  }>(
    '/applications/:applicationId/bot-tokens/:tokenId/rotate',
    {
      preHandler: app.authenticate,
      schema: {
        body: RotateBotTokenBodySchema,
        operationId: 'rotateBotToken',
        params: TokenParams,
        response: {
          201: BotTokenCredentialResponseSchema,
          404: ErrorResponseSchema,
        },
        tags: ['bots'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.botTokenService.rotate(
            request.auth.userId,
            request.params.applicationId,
            request.params.tokenId,
            request.body,
          ),
        ),
  )

  app.delete<{ Params: { applicationId: string; tokenId: string } }>(
    '/applications/:applicationId/bot-tokens/:tokenId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'revokeBotToken',
        params: TokenParams,
        response: { 200: RevokeBotTokenResponseSchema },
        tags: ['bots'],
      },
    },
    async (request) => ({
      revoked: await app.botTokenService.revoke(
        request.auth.userId,
        request.params.applicationId,
        request.params.tokenId,
      ),
    }),
  )
}

export default routes
