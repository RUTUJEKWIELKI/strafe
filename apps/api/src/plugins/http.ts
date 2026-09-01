import compress from '@fastify/compress'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { AppError } from '../lib/errors.js'

const httpPlugin: FastifyPluginAsync = async (app) => {
  const allowedOrigins = new Set(
    app.config.CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )

  await app.register(sensible)
  await app.register(helmet)
  await app.register(compress)
  await app.register(rateLimit, {
    global: false,
    max: 100,
    timeWindow: '1 minute',
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
  })
}

export default fp(httpPlugin, { name: 'http' })
