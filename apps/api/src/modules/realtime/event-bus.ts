import type { RealtimeEvent } from '@strafe/shared'
import { EventEmitter } from 'node:events'

import type { RedisService } from '../../plugins/redis.js'
import { createId } from '../../lib/ids.js'

const redisChannel = 'strafe:realtime'
const redisStream = 'stream:events'

interface DistributedEvent {
  event: RealtimeEvent
  nodeId: string
}

export type RealtimeListener = (event: RealtimeEvent) => void

export class RealtimeEventBus {
  readonly #emitter = new EventEmitter()
  readonly #nodeId = createId()
  readonly #redis: RedisService | null
  readonly #redisListener = (channel: string, raw: string) => {
    if (channel !== redisChannel) return
    try {
      const distributed = JSON.parse(raw) as DistributedEvent
      if (distributed.nodeId !== this.#nodeId) {
        this.#emitter.emit('event', distributed.event)
      }
    } catch {
      // Invalid events are ignored; the publisher records its own error.
    }
  }

  constructor(redis: RedisService | null) {
    this.#redis = redis
    this.#emitter.setMaxListeners(0)
  }

  async start(): Promise<void> {
    if (!this.#redis) return
    await this.#redis.subscriber.subscribe(redisChannel)
    this.#redis.subscriber.on('message', this.#redisListener)
  }

  async close(): Promise<void> {
    this.#emitter.removeAllListeners()
    if (!this.#redis) return
    this.#redis.subscriber.off('message', this.#redisListener)
    await this.#redis.subscriber.unsubscribe(redisChannel)
  }

  async publish(event: RealtimeEvent): Promise<RealtimeEvent> {
    let published = event
    if (this.#redis) {
      const streamId = await this.#redis.command.xadd(
        redisStream,
        'MAXLEN',
        '~',
        100_000,
        '*',
        'event',
        JSON.stringify(event),
      )
      published = { ...event, streamId }
      const distributed: DistributedEvent = {
        event: published,
        nodeId: this.#nodeId,
      }
      await this.#redis.publisher.publish(
        redisChannel,
        JSON.stringify(distributed),
      )
    }

    this.#emitter.emit('event', published)
    return published
  }

  subscribe(listener: RealtimeListener): () => void {
    this.#emitter.on('event', listener)
    return () => this.#emitter.off('event', listener)
  }

  async readAfter(
    streamId: string,
    count = 100,
  ): Promise<RealtimeEvent[] | null> {
    if (!this.#redis) return null
    if (!/^\d+-\d+$/.test(streamId)) return null
    const oldest = (await this.#redis.command.xrange(
      redisStream,
      '-',
      '+',
      'COUNT',
      1,
    )) as Array<[string, string[]]>
    const firstId = oldest[0]?.[0]
    if (
      firstId &&
      streamId !== '0-0' &&
      compareStreamIds(streamId, firstId) < 0
    ) {
      return null
    }
    const response = (await this.#redis.command.xread(
      'COUNT',
      count + 1,
      'STREAMS',
      redisStream,
      streamId,
    )) as Array<[string, Array<[string, string[]]>]> | null
    const entries = response?.[0]?.[1] ?? []
    if (entries.length > count) return null

    return entries.flatMap(([id, fields]) => {
      const rawIndex = fields.indexOf('event')
      const raw = rawIndex >= 0 ? fields[rawIndex + 1] : undefined
      if (!raw) return []
      try {
        return [{ ...(JSON.parse(raw) as RealtimeEvent), streamId: id }]
      } catch {
        return []
      }
    })
  }
}

function compareStreamIds(left: string, right: string): number {
  const [leftTime = '0', leftSequence = '0'] = left.split('-')
  const [rightTime = '0', rightSequence = '0'] = right.split('-')
  const timeDifference = BigInt(leftTime) - BigInt(rightTime)
  if (timeDifference !== 0n) return timeDifference < 0n ? -1 : 1
  const sequenceDifference = BigInt(leftSequence) - BigInt(rightSequence)
  return sequenceDifference === 0n ? 0 : sequenceDifference < 0n ? -1 : 1
}
