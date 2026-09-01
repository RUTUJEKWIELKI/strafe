import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  type AnyPgColumn,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { users } from './identity.js'
import { servers } from './servers.js'

export const channels = pgTable(
  'channels',
  {
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    flags: integer('flags').default(0).notNull(),
    id: uuid('id').primaryKey(),
    lastMessageId: uuid('last_message_id'),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    name: text('name').notNull(),
    ownerId: uuid('owner_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    parentId: uuid('parent_id').references((): AnyPgColumn => channels.id, {
      onDelete: 'cascade',
    }),
    positionKey: text('position_key').notNull(),
    serverId: uuid('server_id').references(() => servers.id, {
      onDelete: 'cascade',
    }),
    slowmodeSeconds: integer('slowmode_seconds').default(0).notNull(),
    topic: text('topic'),
    type: text('type').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'channels_type_check',
      sql`${table.type} in ('category', 'text', 'announcement', 'forum', 'voice', 'stage', 'thread_public', 'thread_private', 'dm', 'group_dm')`,
    ),
    check(
      'channels_scope_check',
      sql`((${table.type} in ('dm', 'group_dm')) and ${table.serverId} is null) or ((${table.type} not in ('dm', 'group_dm')) and ${table.serverId} is not null)`,
    ),
    check(
      'channels_slowmode_check',
      sql`${table.slowmodeSeconds} between 0 and 21600`,
    ),
    index('channels_server_tree_idx')
      .on(table.serverId, table.parentId, table.positionKey)
      .where(sql`${table.deletedAt} is null`),
    index('channels_parent_id_idx').on(table.parentId),
    index('channels_owner_id_idx').on(table.ownerId),
  ],
)

export const channelMembers = pgTable(
  'channel_members',
  {
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.channelId, table.userId],
      name: 'channel_members_pk',
    }),
    index('channel_members_user_id_idx').on(table.userId),
  ],
)

export const directConversations = pgTable(
  'direct_conversations',
  {
    channelId: uuid('channel_id')
      .primaryKey()
      .references(() => channels.id, { onDelete: 'cascade' }),
    higherUserId: uuid('higher_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lowerUserId: uuid('lower_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    check(
      'direct_conversations_user_order_check',
      sql`${table.lowerUserId} < ${table.higherUserId}`,
    ),
    uniqueIndex('direct_conversations_pair_unique').on(
      table.lowerUserId,
      table.higherUserId,
    ),
    index('direct_conversations_higher_user_idx').on(table.higherUserId),
  ],
)

export const channelVoiceSettings = pgTable('channel_voice_settings', {
  bitrate: integer('bitrate').default(64_000).notNull(),
  channelId: uuid('channel_id')
    .primaryKey()
    .references(() => channels.id, { onDelete: 'cascade' }),
  region: text('region'),
  userLimit: integer('user_limit').default(0).notNull(),
  waitingRoomEnabled: boolean('waiting_room_enabled').default(false).notNull(),
})

export const forumTags = pgTable(
  'forum_tags',
  {
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    emojiKey: text('emoji_key'),
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    positionKey: text('position_key').notNull(),
  },
  (table) => [
    uniqueIndex('forum_tags_channel_name_unique').on(
      table.channelId,
      table.name,
    ),
  ],
)

export const forumPostTags = pgTable(
  'forum_post_tags',
  {
    tagId: uuid('tag_id')
      .notNull()
      .references(() => forumTags.id, { onDelete: 'cascade' }),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.threadId, table.tagId],
      name: 'forum_post_tags_pk',
    }),
    index('forum_post_tags_tag_id_idx').on(table.tagId),
  ],
)

export const channelPermissionOverwrites = pgTable(
  'channel_permission_overwrites',
  {
    allowBits: bigint('allow_bits', { mode: 'bigint' })
      .default(sql`0`)
      .notNull(),
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    denyBits: bigint('deny_bits', { mode: 'bigint' })
      .default(sql`0`)
      .notNull(),
    subjectId: uuid('subject_id').notNull(),
    subjectType: text('subject_type').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.channelId, table.subjectType, table.subjectId],
      name: 'channel_permission_overwrites_pk',
    }),
    check(
      'channel_permission_overwrites_subject_type_check',
      sql`${table.subjectType} in ('role', 'member')`,
    ),
    check(
      'channel_permission_overwrites_bits_check',
      sql`${table.allowBits} >= 0 and ${table.denyBits} >= 0`,
    ),
    index('channel_permission_overwrites_subject_idx').on(
      table.subjectType,
      table.subjectId,
    ),
  ],
)

export const channelWebhooks = pgTable(
  'channel_webhooks',
  {
    channelId: uuid('channel_id')
      .notNull()
      .references(() => channels.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    creatorId: uuid('creator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    secretHash: text('secret_hash').notNull(),
  },
  (table) => [
    index('channel_webhooks_channel_id_idx').on(table.channelId),
    index('channel_webhooks_creator_id_idx').on(table.creatorId),
  ],
)
