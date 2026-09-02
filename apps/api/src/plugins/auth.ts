import jwt from '@fastify/jwt'
import { hash, argon2id } from 'argon2'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { randomBytes } from 'node:crypto'

import { strafeTokenSecurityRequirement } from '../lib/strafe-token.js'
import { AuthService } from '../modules/auth/auth.service.js'
import { ForbiddenError } from '../lib/errors.js'

const authPlugin: FastifyPluginAsync = async (app) => {
  if (app.config.NODE_ENV === 'production' && !app.config.AUTH_JWT_SECRET) {
    throw new Error('AUTH_JWT_SECRET is required in production')
  }

  const secret =
    app.config.AUTH_JWT_SECRET ?? randomBytes(48).toString('base64url')
  if (!app.config.AUTH_JWT_SECRET) {
    app.log.warn(
      'AUTH_JWT_SECRET is not configured; access tokens reset on restart',
    )
  }

  await app.register(jwt, { secret })

  const dummyPasswordHash = await hash(randomBytes(32), {
    hashLength: 32,
    memoryCost: 19_456,
    parallelism: 1,
    timeCost: 2,
    type: argon2id,
  })
  const authService = new AuthService(app, dummyPasswordHash)

  app.decorate('authService', authService)
  app.decorateRequest('auth')
  app.decorate('authenticate', async (request) => {
    request.auth = await authService.authenticateRequest(request)
    if (request.auth.actorType === 'bot') {
      const requiredScopes = request.routeOptions.config.botScopes
      if (!requiredScopes?.some((scope) => request.auth.scopes?.includes(scope))) {
        throw new ForbiddenError('This endpoint is not available to this bot token')
      }
    }
  })
  app.addHook('onRoute', (routeOptions) => {
    const preHandlers = Array.isArray(routeOptions.preHandler)
      ? routeOptions.preHandler
      : [routeOptions.preHandler]

    if (!preHandlers.includes(app.authenticate)) return

    routeOptions.schema = {
      ...routeOptions.schema,
      security: strafeTokenSecurityRequirement(),
    }
  })
}

export default fp(authPlugin, {
  dependencies: ['bot-service', 'database'],
  name: 'auth',
})
