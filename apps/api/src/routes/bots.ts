import {
  BotCredentialSchema,
  BotListResponseSchema,
  BotTokenResponseSchema,
  CreateBotBodySchema,
  ErrorResponseSchema,
  RevokeBotResponseSchema,
  RotateBotTokenBodySchema,
  type CreateBotBody,
  type RotateBotTokenBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

import { ForbiddenError } from '../lib/errors.js'

const BotParamsSchema = Type.Object({ botId: Type.String({ format: 'uuid' }) })
const BotInstallParamsSchema = Type.Object({
  botId: Type.String({ format: 'uuid' }),
  serverId: Type.String({ format: 'uuid' }),
})
const BotInstallResponseSchema = Type.Object({ installed: Type.Boolean(), memberId: Type.String({ format: 'uuid' }) })

const botRoutes: FastifyPluginAsync = async (app) => {
  const userOnly = async (request: Parameters<typeof app.authenticate>[0]) => {
    if (request.auth.actorType !== 'user') {
      throw new ForbiddenError('Bot credentials cannot manage bot applications')
    }
  }

  app.post<{ Body: CreateBotBody }>('/bots', {
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
    preHandler: [app.authenticate, userOnly],
    schema: {
      body: CreateBotBodySchema,
      operationId: 'createBotApplication',
      response: { 201: BotCredentialSchema, 400: ErrorResponseSchema, 409: ErrorResponseSchema },
      summary: 'Create a bot identity and its first scoped token',
      tags: ['bots'],
    },
  }, async (request, reply) => reply.code(201).send(await app.botService.create(request.auth.userId, request.body)))

  app.get('/bots', {
    preHandler: [app.authenticate, userOnly],
    schema: {
      operationId: 'listBotApplications', response: { 200: BotListResponseSchema },
      summary: 'List bot applications owned by the current user', tags: ['bots'],
    },
  }, async (request) => ({ bots: await app.botService.list(request.auth.userId) }))

  app.post<{ Body: RotateBotTokenBody; Params: { botId: string } }>('/bots/:botId/token', {
    preHandler: [app.authenticate, userOnly],
    schema: {
      body: RotateBotTokenBodySchema, operationId: 'rotateBotToken', params: BotParamsSchema,
      response: { 200: BotTokenResponseSchema, 404: ErrorResponseSchema },
      summary: 'Revoke previous credentials and issue a scoped bot token', tags: ['bots'],
    },
  }, async (request) => ({ token: await app.botService.rotate(request.auth.userId, request.params.botId, request.body.scopes) }))

  app.delete<{ Params: { botId: string } }>('/bots/:botId/token', {
    preHandler: [app.authenticate, userOnly],
    schema: {
      operationId: 'revokeBotToken', params: BotParamsSchema,
      response: { 200: RevokeBotResponseSchema, 404: ErrorResponseSchema },
      summary: 'Immediately revoke all active credentials for a bot', tags: ['bots'],
    },
  }, async (request) => ({ revoked: await app.botService.revoke(request.auth.userId, request.params.botId) }))

  app.post<{ Params: { botId: string; serverId: string } }>('/servers/:serverId/bots/:botId', {
    preHandler: [app.authenticate, userOnly],
    schema: {
      operationId: 'installBotApplication', params: BotInstallParamsSchema,
      response: { 200: BotInstallResponseSchema, 404: ErrorResponseSchema },
      summary: 'Install an owned bot identity into an owned server', tags: ['bots'],
    },
  }, async (request) => app.botService.install(request.auth.userId, request.params.botId, request.params.serverId))
}

export default botRoutes
