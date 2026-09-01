import {
  HealthResponseSchema,
  type HealthResponse,
  type ServiceStatus,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'

async function getHealth(
  app: Parameters<FastifyPluginAsync>[0],
): Promise<HealthResponse> {
  let database: ServiceStatus = app.database ? 'available' : 'disabled'
  let redis: ServiceStatus = app.redis ? 'available' : 'disabled'

  if (app.database) {
    try {
      await app.database.pool.query('select 1')
    } catch (error) {
      database = 'unavailable'
      app.log.warn({ err: error }, 'Database readiness check failed')
    }
  }

  if (app.redis) {
    try {
      await app.redis.command.ping()
    } catch (error) {
      redis = 'unavailable'
      app.log.warn({ err: error }, 'Redis readiness check failed')
    }
  }

  return {
    services: { database, redis },
    status:
      database === 'unavailable' || redis === 'unavailable' ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
  }
}

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        operationId: 'getHealth',
        response: {
          200: HealthResponseSchema,
        },
        summary: 'Report service health',
        tags: ['system'],
      },
    },
    async () => getHealth(app),
  )

  app.get(
    '/health/ready',
    {
      schema: {
        operationId: 'getReadiness',
        response: {
          200: HealthResponseSchema,
          503: HealthResponseSchema,
        },
        summary: 'Report whether dependencies are ready',
        tags: ['system'],
      },
    },
    async (_request, reply) => {
      const health = await getHealth(app)
      return health.status === 'ok' ? health : reply.code(503).send(health)
    },
  )
}

export default healthRoutes
