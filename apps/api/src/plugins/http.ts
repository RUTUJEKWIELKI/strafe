import compress from '@fastify/compress'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { Counter } from 'prom-client'

import { AppError } from '../lib/errors.js'

const defaultRateLimit = { max: 300, timeWindow: '1 minute' } as const

const sensitiveRateLimits: Record<string, { max: number; timeWindow: string }> =
  {
    addMessageReaction: { max: 60, timeWindow: '1 minute' },
    completeFileUpload: { max: 20, timeWindow: '1 minute' },
    completePasswordReset: { max: 5, timeWindow: '30 minutes' },
    createAutomodRule: { max: 20, timeWindow: '1 minute' },
    createDirectMessage: { max: 20, timeWindow: '1 minute' },
    createInvite: { max: 20, timeWindow: '1 minute' },
    createMessage: { max: 30, timeWindow: '10 seconds' },
    initiateFileUpload: { max: 20, timeWindow: '1 minute' },
    login: { max: 10, timeWindow: '15 minutes' },
    refreshSession: { max: 30, timeWindow: '15 minutes' },
    register: { max: 5, timeWindow: '15 minutes' },
    removeMessageReaction: { max: 60, timeWindow: '1 minute' },
    requestPasswordReset: { max: 5, timeWindow: '30 minutes' },
    searchMessages: { max: 60, timeWindow: '1 minute' },
    searchServers: { max: 60, timeWindow: '1 minute' },
    updateAutomodRule: { max: 20, timeWindow: '1 minute' },
  }

function sensitiveDefault(id: string | undefined, url: string) {
  if (id && sensitiveRateLimits[id]) return sensitiveRateLimits[id]
  if (/bot/i.test(id ?? url)) return { max: 30, timeWindow: '1 minute' }
  if (/message|reaction/i.test(id ?? '')) {
    return { max: 60, timeWindow: '1 minute' }
  }
  if (/admin|moderation|automod|ban|kick|timeout/i.test(id ?? url)) {
    return { max: 30, timeWindow: '1 minute' }
  }
  if (/upload/i.test(id ?? url)) return { max: 30, timeWindow: '1 minute' }
  return undefined
}

function operationId(request: FastifyRequest) {
  const schema = request.routeOptions.schema as
    { operationId?: string } | undefined
  return schema?.operationId ?? request.routeOptions.url ?? 'unmatched'
}

export const httpPlugin: FastifyPluginAsync = async (app) => {
  const allowedOrigins = new Set(
    app.config.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )

  await app.register(sensible)
  await app.register(helmet, {
    contentSecurityPolicy: false,
    hsts: false,
  })
  await app.register(compress)

  app.addHook('onRoute', (options) => {
    const id = (options.schema as { operationId?: string } | undefined)
      ?.operationId
    const configured = sensitiveDefault(id, options.url)
    if (!configured || options.config?.rateLimit) return
    options.config = { ...options.config, rateLimit: configured }
  })

  const rejectedRequests = new Counter({
    help: 'Requests rejected by the HTTP rate limiter',
    labelNames: ['route'],
    name: 'strafe_http_rate_limit_rejections_total',
    registers: [app.metrics],
  })

  await app.register(rateLimit, {
    ...defaultRateLimit,
    addHeaders: {
      'retry-after': true,
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    global: true,
    hook: 'preHandler',
    keyGenerator: async (request) => {
      const schema = request.routeOptions.schema as
        { security?: Array<Record<string, unknown>> } | undefined
      if (schema?.security && !request.auth) await app.authenticate(request)

      const auth = request.auth as
        { botId?: string; sessionId?: string; userId?: string } | undefined
      const principal = auth?.botId
        ? `bot:${auth.botId}`
        : auth?.userId
          ? `user:${auth.userId}`
          : auth?.sessionId
            ? `session:${auth.sessionId}`
            : 'anonymous'

      // request.ip is derived from the socket unless Fastify was explicitly
      // constructed with trustProxy; raw forwarding headers are never read here.
      return `${request.ip}:${principal}`
    },
    onExceeded(request) {
      rejectedRequests.inc({ route: operationId(request) })
    },
    ...(app.redis ? { redis: app.redis.command } : {}),
  })
  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }

      callback(
        new AppError({
          code: 'CORS_ORIGIN_DENIED',
          message: 'Origin is not allowed',
          statusCode: 403,
        }),
        false,
      )
    },
  })

  app.addHook('onRequest', async (request, reply) => {
    reply.header('x-request-id', request.id)
    if (request.protocol === 'https') {
      reply.header(
        'strict-transport-security',
        'max-age=31536000; includeSubDomains',
      )
    }
  })
}

export default fp(httpPlugin, {
  dependencies: ['auth', 'observability', 'redis'],
  name: 'http',
})
