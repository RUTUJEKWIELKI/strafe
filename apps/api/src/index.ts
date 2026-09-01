import { buildServer } from './server.js'

const app = await buildServer()

const shutdown = async (signal: NodeJS.Signals) => {
  app.log.info({ signal }, 'Shutting down')
  await app.close()
  process.exit(0)
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

try {
  await app.listen({ host: app.config.HOST, port: app.config.PORT })

  const address = app.server.address()
  const port =
    typeof address === 'object' && address ? address.port : app.config.PORT
  const httpBaseUrl = `http://localhost:${port}`
  const websocketBaseUrl = `ws://localhost:${port}`

  app.log.info(
    {
      dependencies: {
        postgres: app.database ? 'connected' : 'disabled',
        redis: app.redis ? 'connected' : 'disabled',
      },
      environment: app.config.NODE_ENV,
      realtime: app.config.REALTIME_ENABLED
        ? app.redis
          ? 'redis'
          : 'local'
        : 'disabled',
    },
    'Strafe API ready',
  )
  app.log.info({ url: `${httpBaseUrl}/api` }, 'REST API prefix')
  app.log.info({ url: `${httpBaseUrl}/docs` }, 'Swagger UI')
  app.log.info({ url: `${httpBaseUrl}/docs/json` }, 'OpenAPI JSON')
  app.log.info({ url: `${httpBaseUrl}/api/health` }, 'Health check')
  app.log.info({ url: `${httpBaseUrl}/api/health/ready` }, 'Readiness check')

  if (app.config.METRICS_ENABLED) {
    app.log.info({ url: `${httpBaseUrl}/api/metrics` }, 'Prometheus metrics')
  }
  if (app.config.REALTIME_ENABLED) {
    app.log.info(
      { url: `${websocketBaseUrl}/api/gateway` },
      'WebSocket gateway',
    )
  }
} catch (error) {
  app.log.fatal(error)
  process.exit(1)
}
