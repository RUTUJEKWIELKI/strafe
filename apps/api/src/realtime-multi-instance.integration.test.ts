import type { RealtimeEvent } from '@strafe/shared'
import { Redis } from 'ioredis'
import { describe, expect, it } from 'vitest'

import { RealtimeEventBus } from '../dist/modules/realtime/event-bus.js'

const redisUrl = process.env.TEST_REDIS_URL

function event(eventId: string): RealtimeEvent {
  return {
    aggregateId: eventId,
    data: { audience: { userIds: [eventId] }, value: eventId },
    eventId,
    occurredAt: new Date().toISOString(),
    streamId: null,
    type: 'test.multi_instance',
    version: 1,
  }
}

describe.skipIf(!redisUrl)('realtime across two API instances', () => {
  it('fans out events and resumes them from the shared Redis stream', async () => {
    const clients = Array.from(
      { length: 6 },
      () =>
        new Redis(redisUrl!, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        }),
    )
    await Promise.all(clients.map((client) => client.connect()))
    const firstBus = new RealtimeEventBus({
      command: clients[0]!,
      publisher: clients[1]!,
      subscriber: clients[2]!,
    })
    const secondBus = new RealtimeEventBus({
      command: clients[3]!,
      publisher: clients[4]!,
      subscriber: clients[5]!,
    })

    try {
      await Promise.all([firstBus.start(), secondBus.start()])
      const received = new Promise<RealtimeEvent>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('Cross-instance event timeout')),
          5_000,
        )
        secondBus.subscribe((value) => {
          if (value.type !== 'test.multi_instance') return
          clearTimeout(timeout)
          resolve(value)
        })
      })

      const first = await firstBus.publish(event(crypto.randomUUID()))
      await expect(received).resolves.toMatchObject({ eventId: first.eventId })
      expect(first.streamId).toMatch(/^\d+-\d+$/)

      const second = await firstBus.publish(event(crypto.randomUUID()))
      const replay = await secondBus.readAfter(first.streamId!, 10)
      expect(replay).not.toBeNull()
      expect(replay?.map((value) => value.eventId)).toContain(second.eventId)
    } finally {
      await Promise.allSettled([firstBus.close(), secondBus.close()])
      await Promise.allSettled(clients.map((client) => client.quit()))
    }
  }, 15_000)
})
