import fastify, { type FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { Registry } from 'prom-client'
import { afterEach, describe, expect, it } from 'vitest'

import { httpPlugin } from './plugins/http.js'

type RedisCallback = (error: Error | null, result: [number, number]) => void

class SharedRedis {
  readonly counters = new Map<string, { count: number; expiresAt: number }>()

  defineCommand(name: string) {
    if (name === 'rateLimit') {
      Object.assign(this, {
        rateLimit: (
          key: string,
          window: number,
          _max: number,
          _continueExceeding: boolean,
          _exponentialBackoff: boolean,
          callback: RedisCallback,
        ) => {
          const now = Date.now()
          const previous = this.counters.get(key)
          const current =
            !previous || previous.expiresAt <= now
              ? { count: 1, expiresAt: now + Number(window) }
              : { ...previous, count: previous.count + 1 }
          this.counters.set(key, current)
          callback(null, [current.count, current.expiresAt - now])
        },
      })
      return
    }

    Object.assign(this, {
      rateLimitRead: (key: string, callback: RedisCallback) => {
        const current = this.counters.get(key)
        callback(
          null,
          current
            ? [current.count, Math.max(0, current.expiresAt - Date.now())]
            : [0, 0],
        )
      },
    })
  }
}

const servers: FastifyInstance[] = []

async function buildTestServer(redis: SharedRedis | null = null) {
  const app = fastify({ logger: false })
  app.decorate('config', { CORS_ORIGINS: '' })
  app.decorate('metrics', new Registry())
  app.decorate('redis', redis ? { command: redis } : null)
  app.decorateRequest('auth')
  app.decorate('authenticate', async (request) => {
    if (request.auth) return
    const userId = request.headers.authorization?.replace('Bearer ', '')
    request.auth = { sessionId: `session-${userId}`, userId: userId! }
  })
  for (const name of ['auth', 'observability', 'redis']) {
    await app.register(fp(async () => {}, { name }))
  }
  await app.register(httpPlugin)
  app.get('/public', async () => ({ ok: true }))
  app.get(
    '/private',
    { schema: { operationId: 'privateTest', security: [{ bearer: [] }] } },
    async () => ({ ok: true }),
  )
  await app.ready()
  servers.push(app)
  return app
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()))
})

describe('HTTP rate limiting', () => {
  it('enforces the global limit and returns standard 429 headers', async () => {
    const app = await buildTestServer()
    for (let index = 0; index < 300; index += 1) {
      expect((await app.inject('/public')).statusCode).toBe(200)
    }

    const rejected = await app.inject('/public')
    expect(rejected.statusCode).toBe(429)
    expect(rejected.headers).toMatchObject({
      'retry-after': expect.any(String),
      'x-ratelimit-limit': '300',
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': expect.any(String),
    })
  })

  it('isolates authenticated users behind the same client address', async () => {
    const app = await buildTestServer()
    for (let index = 0; index < 300; index += 1) {
      await app.inject({
        headers: { authorization: 'Bearer alice' },
        url: '/private',
      })
    }

    const alice = await app.inject({
      headers: { authorization: 'Bearer alice' },
      url: '/private',
    })
    const bob = await app.inject({
      headers: { authorization: 'Bearer bob' },
      url: '/private',
    })
    expect(alice.statusCode).toBe(429)
    expect(bob.statusCode).toBe(200)
  })

  it('shares counters between API instances through Redis', async () => {
    const redis = new SharedRedis()
    const first = await buildTestServer(redis)
    const second = await buildTestServer(redis)
    for (let index = 0; index < 150; index += 1) {
      await first.inject('/public')
      await second.inject('/public')
    }

    expect((await first.inject('/public')).statusCode).toBe(429)
    expect((await second.inject('/public')).statusCode).toBe(429)
  })
})
