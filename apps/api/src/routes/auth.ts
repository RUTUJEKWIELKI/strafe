import {
  AuthResponseSchema,
  CurrentUserSchema,
  ErrorResponseSchema,
  LoginBodySchema,
  LogoutBodySchema,
  LogoutResponseSchema,
  RefreshBodySchema,
  RegisterBodySchema,
  type LoginBody,
  type LogoutBody,
  type RefreshBody,
  type RegisterBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'

import { sessionMetadata } from '../lib/session-metadata.js'
import { AppError } from '../lib/errors.js'

const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: RegisterBody }>(
    '/auth/register',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      schema: {
        body: RegisterBodySchema,
        operationId: 'register',
        response: {
          201: AuthResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
          503: ErrorResponseSchema,
        },
        summary: 'Create a user account and session',
        tags: ['auth'],
      },
    },
    async (request, reply) => {
      if (app.config.NODE_ENV === 'production') {
        if (!request.body.captchaToken) {
          throw new AppError({
            code: 'CAPTCHA_REQUIRED',
            message: 'Bot verification is required',
            statusCode: 400,
          })
        }
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: app.config.TURNSTILE_SECRET_KEY,
            response: request.body.captchaToken,
            remoteip: request.ip,
          }),
        })
        const outcome = await verifyRes.json()
        if (!outcome.success) {
          throw new AppError({
            code: 'CAPTCHA_FAILED',
            message: 'Bot verification failed',
            statusCode: 400,
          })
        }
      }

      const result = await app.authService.register(
        request.body,
        sessionMetadata(request),
      )
      return reply.code(201).send(result)
    },
  )

  app.post<{ Body: LoginBody }>(
    '/auth/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
      schema: {
        body: LoginBodySchema,
        operationId: 'login',
        response: {
          200: AuthResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          503: ErrorResponseSchema,
        },
        summary: 'Create a session using local credentials',
        tags: ['auth'],
      },
    },
    async (request) =>
      app.authService.login(request.body, sessionMetadata(request)),
  )

  app.post<{ Body: RefreshBody }>(
    '/auth/refresh',
    {
      config: { rateLimit: { max: 30, timeWindow: '15 minutes' } },
      schema: {
        body: RefreshBodySchema,
        operationId: 'refreshSession',
        response: {
          200: AuthResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          503: ErrorResponseSchema,
        },
        summary: 'Rotate a refresh token and issue a new access token',
        tags: ['auth'],
      },
    },
    async (request) =>
      app.authService.refresh(
        request.body.refreshToken,
        sessionMetadata(request),
      ),
  )

  app.post<{ Body: LogoutBody }>(
    '/auth/logout',
    {
      preHandler: app.authenticate,
      schema: {
        body: LogoutBodySchema,
        operationId: 'logout',
        response: {
          200: LogoutResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: 'Revoke the current session',
        tags: ['auth'],
      },
    },
    async (request) => ({
      revoked: await app.authService.revoke(
        request.auth,
        request.body.refreshToken,
      ),
    }),
  )

  app.get(
    '/users/@me',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'getCurrentUser',
        response: {
          200: CurrentUserSchema,
          401: ErrorResponseSchema,
        },
        summary: 'Return the authenticated user',
        tags: ['users'],
      },
    },
    async (request) => app.authService.getCurrentUser(request.auth.userId),
  )
}

export default authRoutes
