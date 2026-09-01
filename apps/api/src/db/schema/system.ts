import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const systemMetadata = pgTable('system_metadata', {
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  key: text('key').primaryKey(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  value: jsonb('value').notNull(),
})
