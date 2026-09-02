import { sql } from 'drizzle-orm'
import {
  bigint,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { userDevices, users } from './identity.js'

// This schema deliberately has no private-key column. Secret identity and prekey
// material is generated and retained by clients only.
export const deviceIdentityKeys = pgTable('device_identity_keys', {
  algorithm: text('algorithm').default('ed25519').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  deviceId: uuid('device_id')
    .primaryKey()
    .references(() => userDevices.id, { onDelete: 'cascade' }),
  publicKey: text('public_key').notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const keyBundleVersions = pgTable(
  'key_bundle_versions',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deviceId: uuid('device_id')
      .primaryKey()
      .references(() => userDevices.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [check('key_bundle_version_positive', sql`${table.version} > 0`)],
)

export const signedPrekeys = pgTable(
  'signed_prekeys',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => userDevices.id, { onDelete: 'cascade' }),
    keyId: integer('key_id').notNull(),
    publicKey: text('public_key').notNull(),
    signature: text('signature').notNull(),
    version: integer('version').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.deviceId, table.keyId],
      name: 'signed_prekeys_pk',
    }),
    uniqueIndex('signed_prekeys_device_version_unique').on(
      table.deviceId,
      table.version,
    ),
  ],
)

export const oneTimePrekeys = pgTable(
  'one_time_prekeys',
  {
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deviceId: uuid('device_id')
      .notNull()
      .references(() => userDevices.id, { onDelete: 'cascade' }),
    keyId: integer('key_id').notNull(),
    publicKey: text('public_key').notNull(),
    version: integer('version').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.deviceId, table.keyId],
      name: 'one_time_prekeys_pk',
    }),
    index('one_time_prekeys_available_idx').on(
      table.deviceId,
      table.consumedAt,
    ),
  ],
)

export const keyRevocations = pgTable(
  'key_revocations',
  {
    deviceId: uuid('device_id').notNull(),
    id: uuid('id').primaryKey(),
    keyFingerprint: text('key_fingerprint').notNull(),
    reason: text('reason').notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('key_revocations_user_idx').on(table.userId, table.revokedAt),
  ],
)

export const keyTransparencyLeaves = pgTable(
  'key_transparency_leaves',
  {
    body: text('body').notNull(),
    hash: text('hash').notNull(),
    index: bigint('leaf_index', { mode: 'number' }).primaryKey(),
    recordedAt: timestamp('recorded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex('key_transparency_leaf_hash_unique').on(table.hash)],
)

export const keyTransparencyCheckpoints = pgTable(
  'key_transparency_checkpoints',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    rootHash: text('root_hash').notNull(),
    signature: text('signature').notNull(),
    size: bigint('tree_size', { mode: 'number' }).primaryKey(),
  },
)

export const encryptionSessionEpochs = pgTable('encryption_session_epochs', {
  conversationId: uuid('conversation_id').primaryKey(),
  epoch: integer('epoch').default(1).notNull(),
  reason: text('reason').notNull(),
  rotatedAt: timestamp('rotated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
