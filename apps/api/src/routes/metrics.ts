import { Type } from 'typebox'
import type { FastifyPluginAsync } from 'fastify'
import { timingSafeEqual } from 'node:crypto'
import { readSecretFile } from '../lib/production-security.js'

const metricsRoutes: FastifyPluginAsync = async (app) => {
  const metricsToken = app.config.METRICS_BEARER_TOKEN_FILE
    ? await readSecretFile(app.config.METRICS_BEARER_TOKEN_FILE)
    : undefined
  app.get(
    '/metrics',
    {
      schema: {
        hide: true,
        response: {
          200: Type.String(),
          404: Type.String(),
        },
      },
    },
    async (request, reply) => {
      if (!app.config.METRICS_ENABLED) {
        return reply.code(404).type('text/plain').send('Metrics are disabled')
      }
      if (metricsToken) {
        const supplied =
          request.headers.authorization?.replace(/^Bearer /, '') ?? ''
        const expected = Buffer.from(metricsToken)
        const actual = Buffer.from(supplied)
        if (
          actual.length !== expected.length ||
          !timingSafeEqual(actual, expected)
        ) {
          return reply.code(404).type('text/plain').send('Not found')
        }
      }

      return reply
        .type(app.metrics.contentType)
        .send(await app.metrics.metrics())
    },
  )
}

export default metricsRoutes
