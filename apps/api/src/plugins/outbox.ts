import type { RealtimeEvent } from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import type { OutboxPayload } from '../db/schema.js'
import { createId } from '../lib/ids.js'

interface ClaimedEvent {
  aggregate_id: string | null
  aggregate_version: number
  attempts: number
  id: string
  payload: OutboxPayload
  topic: string
}

const outboxPlugin: FastifyPluginAsync = async (app) => {
  if (!app.database || !app.config.OUTBOX_ENABLED) return

  const workerId = `api:${process.pid}:${createId()}`
  let running = false

  const dispatch = async () => {
    if (running || !app.database) return
    running = true
    try {
      const claimed = await app.database.pool.query<ClaimedEvent>(
        `
          with candidates as (
            select id
            from outbox_events
            where processed_at is null
              and available_at <= now()
              and attempts < 10
              and (locked_at is null or locked_at < now() - interval '30 seconds')
            order by available_at, id
            limit $1
            for update skip locked
          )
          update outbox_events as event
          set locked_at = now(),
              locked_by = $2,
              attempts = event.attempts + 1
          from candidates
          where event.id = candidates.id
          returning event.id, event.topic, event.aggregate_id,
                    event.aggregate_version, event.payload, event.attempts
        `,
        [app.config.OUTBOX_BATCH_SIZE, workerId],
      )

      for (const row of claimed.rows) {
        try {
          const event: RealtimeEvent = {
            aggregateId: row.aggregate_id,
            data: {
              ...row.payload.data,
              ...(row.payload.audience
                ? { audience: row.payload.audience }
                : {}),
            },
            eventId: row.id,
            occurredAt: new Date().toISOString(),
            streamId: null,
            type: row.topic,
            version: row.aggregate_version,
          }
          await app.eventBus.publish(event)
          await app.searchService.handleEvent(event)
          await app.notificationDeliveryService.enqueue(event)
          await app.database.pool.query(
            `
              update outbox_events
              set processed_at = now(), locked_at = null, locked_by = null
              where id = $1 and locked_by = $2
            `,
            [row.id, workerId],
          )
        } catch (error) {
          const message =
            error instanceof Error ? error.message.slice(0, 2_000) : 'Unknown'
          const retrySeconds = Math.min(300, 2 ** row.attempts)
          await app.database.pool.query(
            `
              update outbox_events
              set last_error = $1,
                  available_at = now() + make_interval(secs => $2),
                  locked_at = null,
                  locked_by = null
              where id = $3 and locked_by = $4
            `,
            [message, retrySeconds, row.id, workerId],
          )
          app.log.error(
            { err: error, eventId: row.id, topic: row.topic },
            'Outbox event dispatch failed',
          )
        }
      }
    } catch (error) {
      app.log.error({ err: error }, 'Outbox batch failed')
      app.reportError(error, { component: 'outbox' })
    } finally {
      running = false
    }
  }

  const timer = setInterval(
    () => void dispatch(),
    app.config.OUTBOX_POLL_INTERVAL_MS,
  )
  timer.unref()
  void dispatch()

  app.addHook('onClose', async () => {
    clearInterval(timer)
    const deadline = Date.now() + 2_000
    while (running && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
  })
}

export default fp(outboxPlugin, {
  dependencies: [
    'database',
    'events',
    'notification-delivery',
    'search-service',
  ],
  name: 'outbox',
})
