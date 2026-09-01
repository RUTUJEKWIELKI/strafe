import { Type } from 'typebox'
import type { FastifyPluginAsync } from 'fastify'

const metricsRoutes: FastifyPluginAsync = async (app) => {
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
    async (_request, reply) => {
      if (!app.config.METRICS_ENABLED) {
        return reply.code(404).type('text/plain').send('Metrics are disabled')
      }

      return reply
        .type(app.metrics.contentType)
        .send(await app.metrics.metrics())
    },
  )
}

export default metricsRoutes
