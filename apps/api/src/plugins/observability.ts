import * as Sentry from '@sentry/node'
import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client'

export type ObservabilityContext = Record<
  string,
  boolean | number | string | undefined
>

const requestStartedAt = new WeakMap<FastifyRequest, number>()

const observabilityPlugin: FastifyPluginAsync = async (app) => {
  const registry = new Registry()
  app.decorate('metrics', registry)

  if (app.config.METRICS_ENABLED) {
    collectDefaultMetrics({
      prefix: 'strafe_',
      register: registry,
    })
  }

  const requests = new Counter({
    help: 'Total API responses',
    labelNames: ['method', 'route', 'status_code'],
    name: 'strafe_http_requests_total',
    registers: [registry],
  })

  const duration = new Histogram({
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    help: 'API response duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    name: 'strafe_http_request_duration_seconds',
    registers: [registry],
  })

  if (app.config.SENTRY_DSN) {
    Sentry.init({
      dsn: app.config.SENTRY_DSN,
      environment: app.config.NODE_ENV,
      release: app.config.SERVICE_VERSION,
    })
  }

  app.decorate('reportError', (error, context = {}) => {
    if (!app.config.SENTRY_DSN) return

    Sentry.withScope((scope) => {
      scope.setContext('strafe', context)
      Sentry.captureException(error)
    })
  })

  app.addHook('onRequest', async (request) => {
    requestStartedAt.set(request, performance.now())
  })

  app.addHook('onResponse', async (request, reply) => {
    if (!app.config.METRICS_ENABLED) return

    const labels = {
      method: request.method,
      route: request.routeOptions.url ?? 'unmatched',
      status_code: String(reply.statusCode),
    }
    const startedAt = requestStartedAt.get(request)

    requests.inc(labels)
    if (startedAt !== undefined) {
      duration.observe(labels, (performance.now() - startedAt) / 1_000)
    }
  })

  app.addHook('onClose', async () => {
    registry.clear()
    if (app.config.SENTRY_DSN) {
      await Sentry.flush(2_000)
    }
  })
}

export default fp(observabilityPlugin, { name: 'observability' })
