import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  type AnyPgColumn,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { channels } from './channels.js'
import { files } from './files.js'
import { users } from './identity.js'

export const messages = pgTable(
  'messages',
  {
    authorId: uuid('author_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    clientNonce: uuid('client_nonce'),
    content: text('content').default('').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    editedAt: timestamp('edited_at', { withTimezone: true }),
    flags: integer('flags').default(0).notNull(),
    id: uuid('id').primaryKey(),
    replyToMessageId: uuid('reply_to_message_id').references(
      (): AnyPgColumn => messages.id,
      { onDelete: 'set null' },
    ),
    type: text('type').default('default').notNull(),
  },
  (table) => [
    check(
      'messages_type_check',
      sql`${table.type} in ('default', 'system', 'reply', 'thread_starter')`,
    ),
    index('messages_channel_history_idx').on(
      table.channelId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index('messages_author_id_idx').on(table.authorId),
    index('messages_channel_author_time_idx').on(
      table.channelId,
      table.authorId,
      table.createdAt.desc(),
    ),
    index('messages_reply_to_id_idx').on(table.replyToMessageId),
    uniqueIndex('messages_author_nonce_unique')
      .on(table.authorId, table.clientNonce)
      .where(sql`${table.clientNonce} is not null`),
  ],
)

export const messageEdits = pgTable(
  'message_edits',
  {
    content: text('content').notNull(),
    editedAt: timestamp('edited_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    editorId: uuid('editor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    id: uuid('id').primaryKey(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('message_edits_message_time_idx').on(
      table.messageId,
      table.editedAt.desc(),
    ),
    index('message_edits_editor_id_idx').on(table.editorId),
  ],
)

export const messageAttachments = pgTable(
  'message_attachments',
  {
    altText: text('alt_text'),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'restrict' }),
    encryptedEnvelope: text('encrypted_envelope'),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    position: integer('position').default(0).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.messageId, table.fileId],
      name: 'message_attachments_pk',
    }),
    index('message_attachments_file_id_idx').on(table.fileId),
  ],
)

export const messageEmbeds = pgTable(
  'message_embeds',
  {
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    id: uuid('id').primaryKey(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    position: integer('position').default(0).notNull(),
    url: text('url'),
  },
  (table) => [index('message_embeds_message_id_idx').on(table.messageId)],
)

export const messageMentions = pgTable(
  'message_mentions',
  {
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    subjectId: uuid('subject_id').notNull(),
    subjectType: text('subject_type').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.messageId, table.subjectType, table.subjectId],
      name: 'message_mentions_pk',
    }),
    check(
      'message_mentions_subject_type_check',
      sql`${table.subjectType} in ('user', 'role', 'channel')`,
    ),
    index('message_mentions_subject_idx').on(
      table.subjectType,
      table.subjectId,
    ),
  ],
)

export const messageReactions = pgTable(
  'message_reactions',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    emojiKey: text('emoji_key').notNull(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.messageId, table.emojiKey, table.userId],
      name: 'message_reactions_pk',
    }),
    index('message_reactions_user_id_idx').on(table.userId),
  ],
)

export const messagePins = pgTable(
  'message_pins',
  {
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id')
      .primaryKey()
      .references(() => messages.id, { onDelete: 'cascade' }),
    pinnedAt: timestamp('pinned_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    pinnedBy: uuid('pinned_by').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('message_pins_channel_time_idx').on(
      table.channelId,
      table.pinnedAt.desc(),
    ),
    index('message_pins_pinned_by_idx').on(table.pinnedBy),
  ],
)

export const channelReadStates = pgTable(
  'channel_read_states',
  {
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    lastReadAt: timestamp('last_read_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastReadMessageId: uuid('last_read_message_id').references(
      () => messages.id,
      { onDelete: 'set null' },
    ),
    mentionCount: integer('mention_count').default(0).notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.channelId, table.userId],
      name: 'channel_read_states_pk',
    }),
    check(
      'channel_read_states_mention_count_check',
      sql`${table.mentionCount} >= 0`,
    ),
    index('channel_read_states_user_id_idx').on(table.userId),
    index('channel_read_states_last_message_idx').on(table.lastReadMessageId),
  ],
)

export const userMessageBookmarks = pgTable(
  'user_message_bookmarks',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    messageId: uuid('message_id')
      .notNull()
      .references(() => messages.id, { onDelete: 'cascade' }),
    note: text('note'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.messageId],
      name: 'user_message_bookmarks_pk',
    }),
    index('user_message_bookmarks_message_id_idx').on(table.messageId),
  ],
)
