import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { channels, channelWebhooks } from './channels.js'
import { users } from './identity.js'
import { servers } from './servers.js'

export const notifications = pgTable(
  'notifications',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().default({}).notNull(),
    groupCount: integer('group_count').default(1).notNull(),
    groupKey: text('group_key'),
    id: uuid('id').primaryKey(),
    readAt: timestamp('read_at', { withTimezone: true }),
    seenAt: timestamp('seen_at', { withTimezone: true }),
    type: text('type').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('notifications_user_time_idx').on(
      table.userId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index('notifications_unread_user_idx')
      .on(table.userId, table.createdAt.desc())
      .where(sql`${table.readAt} is null`),
    uniqueIndex('notifications_user_group_unique')
      .on(table.userId, table.groupKey)
      .where(sql`${table.groupKey} is not null`),
  ],
)

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    channelId: uuid('channel_id').references(() => channels.id, {
      onDelete: 'cascade',
    }),
    config: jsonb('config')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    id: uuid('id').primaryKey(),
    serverId: uuid('server_id').references(() => servers.id, {
      onDelete: 'cascade',
    }),
    scopeKey: text('scope_key').notNull(),
    type: text('type').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('notification_preferences_user_id_idx').on(table.userId),
    index('notification_preferences_server_id_idx').on(table.serverId),
    index('notification_preferences_channel_id_idx').on(table.channelId),
    uniqueIndex('notification_preferences_user_scope_unique').on(
      table.userId,
      table.scopeKey,
    ),
  ],
)

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    endpoint: text('endpoint').notNull(),
    id: uuid('id').primaryKey(),
    keys: jsonb('keys').$type<Record<string, string>>().notNull(),
    lastError: text('last_error'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('push_subscriptions_endpoint_unique').on(table.endpoint),
    index('push_subscriptions_user_id_idx').on(table.userId),
  ],
)

export const notificationDigests = pgTable(
  'notification_digests',
  {
    attempts: integer('attempts').default(0).notNull(),
    bucketKey: text('bucket_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    lastError: text('last_error'),
    notificationIds: jsonb('notification_ids')
      .$type<string[]>()
      .default([])
      .notNull(),
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    type: text('type').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    check(
      'notification_digests_type_check',
      sql`${table.type} in ('immediate', 'hourly', 'daily')`,
    ),
    index('notification_digests_pending_idx')
      .on(table.scheduledFor, table.id)
      .where(sql`${table.sentAt} is null`),
    uniqueIndex('notification_digests_bucket_unique').on(table.bucketKey),
  ],
)

export const applications = pgTable(
  'applications',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    publicKey: text('public_key'),
    secretHash: text('secret_hash').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('applications_owner_id_idx').on(table.ownerId)],
)

export const bots = pgTable(
  'bots',
  {
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    tokenHash: text('token_hash').notNull(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    uniqueIndex('bots_application_unique').on(table.applicationId),
    uniqueIndex('bots_token_hash_unique').on(table.tokenHash),
    index('bots_user_id_idx').on(table.userId),
  ],
)

export const integrationInstallations = pgTable(
  'integration_installations',
  {
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    config: jsonb('config')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    id: uuid('id').primaryKey(),
    installedAt: timestamp('installed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    installedBy: uuid('installed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    scopes: jsonb('scopes').$type<string[]>().default([]).notNull(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('integration_installations_server_app_unique').on(
      table.serverId,
      table.applicationId,
    ),
    index('integration_installations_application_id_idx').on(
      table.applicationId,
    ),
    index('integration_installations_installed_by_idx').on(table.installedBy),
  ],
)

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    attempts: integer('attempts').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    lastError: text('last_error'),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),
    responseCode: integer('response_code'),
    status: text('status').default('pending').notNull(),
    webhookId: uuid('webhook_id')
      .notNull()
      .references(() => channelWebhooks.id, { onDelete: 'cascade' }),
  },
  (table) => [
    check(
      'webhook_deliveries_status_check',
      sql`${table.status} in ('pending', 'processing', 'delivered', 'failed', 'dead_letter')`,
    ),
    index('webhook_deliveries_pending_idx')
      .on(table.nextAttemptAt, table.id)
      .where(sql`${table.status} in ('pending', 'failed')`),
    index('webhook_deliveries_webhook_id_idx').on(table.webhookId),
  ],
)
