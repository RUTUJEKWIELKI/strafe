import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export interface OutboxPayload {
  audience?: {
    channelId?: string
    serverId?: string
    serverIds?: string[]
    userIds?: string[]
  }
  data: Record<string, unknown>
}

export const outboxEvents = pgTable(
  'outbox_events',
  {
    aggregateId: uuid('aggregate_id'),
    aggregateType: text('aggregate_type').notNull(),
    aggregateVersion: integer('aggregate_version').default(1).notNull(),
    attempts: integer('attempts').default(0).notNull(),
    availableAt: timestamp('available_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    lastError: text('last_error'),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lockedBy: text('locked_by'),
    payload: jsonb('payload').$type<OutboxPayload>().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    topic: text('topic').notNull(),
  },
  (table) => [
    check('outbox_events_attempts_check', sql`${table.attempts} >= 0`),
    check(
      'outbox_events_aggregate_version_check',
      sql`${table.aggregateVersion} >= 1`,
    ),
    index('outbox_events_pending_idx')
      .on(table.availableAt, table.id)
      .where(sql`${table.processedAt} is null`),
    index('outbox_events_aggregate_idx').on(
      table.aggregateType,
      table.aggregateId,
    ),
  ],
)
