import {
  AccountSecurityEventListResponseSchema,
  AuthChallengeResponseSchema,
  ChangePasswordBodySchema,
  ChangePasswordResponseSchema,
  CompletePasswordResetBodySchema,
  ConsumeAuthChallengeBodySchema,
  ErrorResponseSchema,
  RequestEmailChangeBodySchema,
  RequestPasswordResetBodySchema,
  RevokeAllSessionsBodySchema,
  RevokeSessionsResponseSchema,
  UserSessionListResponseSchema,
  type ChangePasswordBody,
  type CompletePasswordResetBody,
  type ConsumeAuthChallengeBody,
  type RequestEmailChangeBody,
  type RequestPasswordResetBody,
  type RevokeAllSessionsBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const SessionParamsSchema = Type.Object({
  sessionId: Type.String({ format: 'uuid' }),
})

const SecurityEventsQuerySchema = Type.Object({
  before: Type.Optional(Type.String({ maxLength: 512 })),
  limit: Type.Optional(Type.Integer({ maximum: 100, minimum: 1 })),
})

const accountSecurityRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/users/@me/sessions',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listCurrentUserSessions',
        response: { 200: UserSessionListResponseSchema },
        summary: 'List active account devices and sessions',
        tags: ['account security'],
      },
    },
    async (request) => app.accountSecurityService.listSessions(request.auth),
  )

  app.delete<{ Params: { sessionId: string } }>(
    '/users/@me/sessions/:sessionId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'revokeCurrentUserSession',
        params: SessionParamsSchema,
        response: {
          200: RevokeSessionsResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Revoke one account session',
        tags: ['account security'],
      },
    },
    async (request) => ({
      revoked: await app.accountSecurityService.revokeSession(
        request.auth,
        request.params.sessionId,
      ),
    }),
  )

  app.delete<{ Body: RevokeAllSessionsBody }>(
    '/users/@me/sessions',
    {
      preHandler: app.authenticate,
      schema: {
        body: RevokeAllSessionsBodySchema,
        operationId: 'revokeAllCurrentUserSessions',
        response: { 200: RevokeSessionsResponseSchema },
        summary: 'Revoke all account sessions',
        tags: ['account security'],
      },
    },
    async (request) => ({
      revoked: await app.accountSecurityService.revokeAll(
        request.auth,
        request.body.keepCurrent ?? false,
      ),
    }),
  )

  app.post<{ Body: ChangePasswordBody }>(
    '/users/@me/password',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      preHandler: app.authenticate,
      schema: {
        body: ChangePasswordBodySchema,
        operationId: 'changeCurrentUserPassword',
        response: {
          200: ChangePasswordResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: 'Change the local account password',
        tags: ['account security'],
      },
    },
    async (request) =>
      app.accountSecurityService.changePassword(request.auth, request.body),
  )

  app.post<{ Body: RequestPasswordResetBody }>(
    '/auth/password/reset/request',
    {
      config: { rateLimit: { max: 5, timeWindow: '30 minutes' } },
      schema: {
        body: RequestPasswordResetBodySchema,
        operationId: 'requestPasswordReset',
        response: { 202: AuthChallengeResponseSchema },
        summary: 'Request a one-time password reset link',
        tags: ['account security'],
      },
    },
    async (request, reply) =>
      reply
        .code(202)
        .send(
          await app.accountSecurityService.requestPasswordReset(
            request.body.email,
          ),
        ),
  )

  app.post<{ Body: CompletePasswordResetBody }>(
    '/auth/password/reset/complete',
    {
      config: { rateLimit: { max: 10, timeWindow: '30 minutes' } },
      schema: {
        body: CompletePasswordResetBodySchema,
        operationId: 'completePasswordReset',
        response: {
          200: AuthChallengeResponseSchema,
          400: ErrorResponseSchema,
        },
        summary: 'Consume a reset token and replace the password',
        tags: ['account security'],
      },
    },
    async (request) =>
      app.accountSecurityService.completePasswordReset(request.body),
  )

  app.post(
    '/users/@me/email/verification',
    {
      config: { rateLimit: { max: 5, timeWindow: '30 minutes' } },
      preHandler: app.authenticate,
      schema: {
        operationId: 'requestEmailVerification',
        response: {
          202: AuthChallengeResponseSchema,
          503: ErrorResponseSchema,
        },
        summary: 'Send an email verification link',
        tags: ['account security'],
      },
    },
    async (request, reply) =>
      reply
        .code(202)
        .send(
          await app.accountSecurityService.requestEmailVerification(
            request.auth.userId,
          ),
        ),
  )

  app.post<{ Body: ConsumeAuthChallengeBody }>(
    '/auth/email/verify',
    {
      config: { rateLimit: { max: 10, timeWindow: '30 minutes' } },
      schema: {
        body: ConsumeAuthChallengeBodySchema,
        operationId: 'verifyEmail',
        response: { 200: AuthChallengeResponseSchema },
        summary: 'Consume an email verification token',
        tags: ['account security'],
      },
    },
    async (request) =>
      app.accountSecurityService.verifyEmail(request.body.token),
  )

  app.post<{ Body: RequestEmailChangeBody }>(
    '/users/@me/email/change',
    {
      config: { rateLimit: { max: 5, timeWindow: '30 minutes' } },
      preHandler: app.authenticate,
      schema: {
        body: RequestEmailChangeBodySchema,
        operationId: 'requestCurrentUserEmailChange',
        response: {
          202: AuthChallengeResponseSchema,
          409: ErrorResponseSchema,
          503: ErrorResponseSchema,
        },
        summary: 'Send a confirmation link to a new email address',
        tags: ['account security'],
      },
    },
    async (request, reply) =>
      reply
        .code(202)
        .send(
          await app.accountSecurityService.requestEmailChange(
            request.auth,
            request.body,
          ),
        ),
  )

  app.post<{ Body: ConsumeAuthChallengeBody }>(
    '/auth/email/change/confirm',
    {
      config: { rateLimit: { max: 10, timeWindow: '30 minutes' } },
      schema: {
        body: ConsumeAuthChallengeBodySchema,
        operationId: 'confirmEmailChange',
        response: {
          200: AuthChallengeResponseSchema,
          409: ErrorResponseSchema,
        },
        summary: 'Consume a token and safely replace the account email',
        tags: ['account security'],
      },
    },
    async (request) =>
      app.accountSecurityService.confirmEmailChange(request.body.token),
  )

  app.get<{
    Querystring: { before?: string; limit?: number }
  }>(
    '/users/@me/security-events',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listCurrentUserSecurityEvents',
        querystring: SecurityEventsQuerySchema,
        response: { 200: AccountSecurityEventListResponseSchema },
        summary: 'List the account security audit trail',
        tags: ['account security'],
      },
    },
    async (request) =>
      app.accountSecurityService.listSecurityEvents(
        request.auth.userId,
        request.query.limit ?? 50,
        request.query.before,
      ),
  )
}

export default accountSecurityRoutes
