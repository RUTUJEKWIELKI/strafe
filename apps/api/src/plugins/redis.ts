import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { Redis } from 'ioredis'

export interface RedisService {
  command: Redis
  publisher: Redis
  subscriber: Redis
}

function observeRedisErrors(
  app: Parameters<FastifyPluginAsync>[0],
  client: Redis,
  role: keyof RedisService,
) {
  client.on('error', (error) => {
    app.log.debug({ err: error, redisClient: role }, 'Redis client error')
  })
}

function disconnectRedis(...clients: Redis[]) {
  for (const client of clients) {
    if (client.status !== 'end') client.disconnect(false)
  }
}

const redisPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('redis', null)
  if (!app.config.REDIS_URL) {
    if (app.config.NODE_ENV === 'production' && app.config.REALTIME_ENABLED) {
      throw new Error('REDIS_URL is required for realtime in production')
    }
    app.log.warn('Redis disabled: REDIS_URL is not configured')
    return
  }

  const command = new Redis(app.config.REDIS_URL, {
    enableReadyCheck: true,
    lazyConnect: true,
    maxRetriesPerRequest: 2,
  })
  observeRedisErrors(app, command, 'command')

  try {
    await command.connect()
    await command.ping()
  } catch (error) {
    disconnectRedis(command)
    if (app.config.NODE_ENV === 'production') throw error
    app.log.warn({ err: error }, 'Redis unavailable; using local realtime')
    return
  }

  const publisher = command.duplicate()
  const subscriber = command.duplicate()
  observeRedisErrors(app, publisher, 'publisher')
  observeRedisErrors(app, subscriber, 'subscriber')

  try {
    await Promise.all([publisher.connect(), subscriber.connect()])
  } catch (error) {
    disconnectRedis(command, publisher, subscriber)
    if (app.config.NODE_ENV === 'production') throw error
    app.log.warn({ err: error }, 'Redis unavailable; using local realtime')
    return
  }

  app.redis = { command, publisher, subscriber }
  app.addHook('onClose', async () => {
    const clients = [command, publisher, subscriber]
    await Promise.allSettled(
      clients.map(async (client) => {
        if (client.status === 'end') return
        try {
          await client.quit()
        } catch {
          client.disconnect(false)
        }
      }),
    )
  })
}

export default fp(redisPlugin, { name: 'redis' })
