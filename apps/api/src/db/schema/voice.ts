import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { channels } from './channels.js'
import { users } from './identity.js'

export const voiceSessions = pgTable(
  'voice_sessions',
  {
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    id: uuid('id').primaryKey(),
    region: text('region'),
    startedAt: timestamp('started_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('voice_sessions_channel_time_idx').on(
      table.channelId,
      table.startedAt.desc(),
    ),
  ],
)

export const voiceSessionParticipants = pgTable(
  'voice_session_participants',
  {
    disconnectReason: text('disconnect_reason'),
    id: uuid('id').primaryKey(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => voiceSessions.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('voice_participants_session_idx').on(table.sessionId, table.joinedAt),
    index('voice_participants_user_id_idx').on(table.userId),
  ],
)
