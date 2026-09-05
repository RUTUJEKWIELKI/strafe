import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    disabledAt: timestamp('disabled_at', { withTimezone: true }),
    email: text('email').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    handle: text('handle').notNull(),
    id: uuid('id').primaryKey(),
    normalizedHandle: text('normalized_handle').notNull(),
    status: text('status').default('active').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'users_status_check',
      sql`${table.status} in ('active', 'disabled', 'pending_deletion')`,
    ),
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_active_handle_unique')
      .on(table.normalizedHandle)
      .where(sql`${table.deletedAt} is null`),
  ],
)

export const botApplications = pgTable(
  'bot_applications',
  {
    botUserId: uuid('bot_user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    description: text('description'),
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('bot_applications_owner_id_idx').on(table.ownerId)],
)

export const botTokens = pgTable(
  'bot_tokens',
  {
    botId: uuid('bot_id')
      .notNull()
      .references(() => botApplications.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    id: uuid('id').primaryKey(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    name: text('name').notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    scopes: text('scopes').array().notNull(),
    tokenHash: text('token_hash').notNull(),
  },
  (table) => [
    uniqueIndex('bot_tokens_token_hash_unique').on(table.tokenHash),
    index('bot_tokens_active_bot_idx')
      .on(table.botId, table.createdAt)
      .where(sql`${table.revokedAt} is null`),
  ],
)

export const userProfiles = pgTable('user_profiles', {
  avatarFileId: uuid('avatar_file_id'),
  bannerFileId: uuid('banner_file_id'),
  bio: text('bio'),
  displayName: text('display_name').notNull(),
  pronouns: text('pronouns'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
})

export const userSettings = pgTable(
  'user_settings',
  {
    allowDmsFrom: text('allow_dms_from').default('server_members').notNull(),
    customStatus: text('custom_status'),
    customStatusExpiresAt: timestamp('custom_status_expires_at', {
      withTimezone: true,
    }),
    discoverability: text('discoverability').default('everyone').notNull(),
    locale: text('locale').default('pl-PL').notNull(),
    manualStatus: text('manual_status').default('online').notNull(),
    presenceVisibility: text('presence_visibility')
      .default('everyone')
      .notNull(),
    theme: text('theme').default('system').notNull(),
    timezone: text('timezone').default('Europe/Warsaw').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    check(
      'user_settings_manual_status_check',
      sql`${table.manualStatus} in ('online', 'idle', 'dnd', 'invisible')`,
    ),
    check(
      'user_settings_presence_visibility_check',
      sql`${table.presenceVisibility} in ('everyone', 'friends', 'nobody')`,
    ),
    check(
      'user_settings_allow_dms_check',
      sql`${table.allowDmsFrom} in ('everyone', 'friends', 'server_members', 'nobody')`,
    ),
  ],
)

export const authIdentities = pgTable(
  'auth_identities',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    credentialData: jsonb('credential_data')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    id: uuid('id').primaryKey(),
    passwordHash: text('password_hash'),
    provider: text('provider').notNull(),
    providerSubject: text('provider_subject').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('auth_identities_user_id_idx').on(table.userId),
    uniqueIndex('auth_identities_provider_subject_unique').on(
      table.provider,
      table.providerSubject,
    ),
  ],
)

export const userDevices = pgTable(
  'user_devices',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    city: text('city'),
    countryCode: text('country_code'),
    lastIpAddress: text('last_ip_address'),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    name: text('name').notNull(),
    platform: text('platform').notNull(),
    trustedAt: timestamp('trusted_at', { withTimezone: true }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [index('user_devices_user_id_idx').on(table.userId)],
)

export const encryptedKeyBackups = pgTable(
  'encrypted_key_backups',
  {
    aead: text('aead').notNull(),
    ciphertext: text('ciphertext').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    deviceId: uuid('device_id').notNull(),
    identityKeyFingerprint: text('identity_key_fingerprint').notNull(),
    kdf: jsonb('kdf')
      .$type<{
        algorithm: 'argon2id'
        iterations: number
        memoryKiB: number
        parallelism: number
        salt: string
      }>()
      .notNull(),
    nonce: text('nonce').notNull(),
    previousDigest: text('previous_digest'),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.version] }),
    index('encrypted_key_backups_latest_idx').on(
      table.userId,
      table.version.desc(),
    ),
    check('encrypted_key_backups_version_check', sql`${table.version} > 0`),
  ],
)

export const userSessions = pgTable(
  'user_sessions',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deviceId: uuid('device_id').references(() => userDevices.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: uuid('id').primaryKey(),
    city: text('city'),
    countryCode: text('country_code'),
    ipAddress: text('ip_address'),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    previousRefreshTokenHash: text('previous_refresh_token_hash'),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    rotatedAt: timestamp('rotated_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('user_sessions_active_user_idx')
      .on(table.userId, table.expiresAt)
      .where(sql`${table.revokedAt} is null`),
    index('user_sessions_previous_refresh_idx')
      .on(table.previousRefreshTokenHash)
      .where(
        sql`${table.previousRefreshTokenHash} is not null and ${table.revokedAt} is null`,
      ),
    uniqueIndex('user_sessions_refresh_token_hash_unique').on(
      table.refreshTokenHash,
    ),
  ],
)

export const authChallenges = pgTable(
  'auth_challenges',
  {
    attempts: integer('attempts').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    id: uuid('id').primaryKey(),
    pendingValue: text('pending_value'),
    tokenHash: text('token_hash').notNull(),
    type: text('type').notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    check(
      'auth_challenges_type_check',
      sql`${table.type} in ('password_reset', 'email_verification', 'email_change')`,
    ),
    uniqueIndex('auth_challenges_token_hash_unique').on(table.tokenHash),
    index('auth_challenges_user_type_idx').on(
      table.userId,
      table.type,
      table.createdAt.desc(),
    ),
    index('auth_challenges_expiry_idx').on(table.expiresAt),
  ],
)

export const userRelationships = pgTable(
  'user_relationships',
  {
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    addresseeId: uuid('addressee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').default('pending').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.requesterId, table.addresseeId],
      name: 'user_relationships_pk',
    }),
    check(
      'user_relationships_distinct_users_check',
      sql`${table.requesterId} <> ${table.addresseeId}`,
    ),
    check(
      'user_relationships_status_check',
      sql`${table.status} in ('pending', 'accepted', 'declined')`,
    ),
    index('user_relationships_addressee_idx').on(
      table.addresseeId,
      table.status,
    ),
  ],
)

export const userBlocks = pgTable(
  'user_blocks',
  {
    blockedId: uuid('blocked_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blockerId: uuid('blocker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    reason: text('reason'),
  },
  (table) => [
    primaryKey({
      columns: [table.blockerId, table.blockedId],
      name: 'user_blocks_pk',
    }),
    check(
      'user_blocks_distinct_users_check',
      sql`${table.blockerId} <> ${table.blockedId}`,
    ),
    index('user_blocks_blocked_id_idx').on(table.blockedId),
  ],
)
