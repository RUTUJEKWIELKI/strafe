import type { FastifyInstance } from 'fastify'
import { describe, expect, it, vi } from 'vitest'

import { BotService } from './bot.service.js'

describe('BotService', () => {
  it('writes activity at most once for a burst of authentication requests', async () => {
    let lastUsedAt: Date | null = null
    let activityWrites = 0

    const selectBuilder = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      limit: vi.fn(async () => [
        {
          applicationId: '3ad662a8-abf8-43ec-b196-9b8205f5bddd',
          botId: '7543379d-a695-40fd-8bc9-331daf72ed49',
          userId: 'a9022ec1-8dc8-46e1-ab86-aef84cfbf7c8',
        },
      ]),
      where: vi.fn().mockReturnThis(),
    }
    const db = {
      select: vi.fn(() => selectBuilder),
      update: vi.fn(() => ({
        set: vi.fn().mockReturnValue({
          where: vi.fn(async () => {
            // Model PostgreSQL serializing the conditional UPDATE. Only the
            // first statement can modify the row inside the throttle window.
            if (lastUsedAt === null) {
              lastUsedAt = new Date()
              activityWrites += 1
            }
          }),
        }),
      })),
    }
    const app = {
      database: { db },
      log: { warn: vi.fn() },
      reportError: vi.fn(),
    } as unknown as FastifyInstance
    const service = new BotService(app)

    const contexts = await Promise.all(
      Array.from({ length: 20 }, () => service.authenticateToken('token')),
    )
    await service.close()

    expect(contexts).toHaveLength(20)
    expect(db.update).toHaveBeenCalledTimes(20)
    expect(activityWrites).toBe(1)
  })
})
