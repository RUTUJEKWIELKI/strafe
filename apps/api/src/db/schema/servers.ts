import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
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

import { users } from './identity.js'

export const servers = pgTable(
  'servers',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletionScheduledAt: timestamp('deletion_scheduled_at', {
      withTimezone: true,
    }),
    description: text('description'),
    iconFileId: uuid('icon_file_id'),
    id: uuid('id').primaryKey(),
    memberCount: integer('member_count').default(1).notNull(),
    name: text('name').notNull(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    slug: text('slug').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    version: integer('version').default(1).notNull(),
    visibility: text('visibility').default('private').notNull(),
  },
  (table) => [
    check(
      'servers_visibility_check',
      sql`${table.visibility} in ('private', 'unlisted', 'public')`,
    ),
    check('servers_member_count_check', sql`${table.memberCount} >= 0`),
    check('servers_version_check', sql`${table.version} >= 1`),
    index('servers_owner_id_idx').on(table.ownerId),
    uniqueIndex('servers_slug_unique').on(table.slug),
  ],
)

export const serverMembers = pgTable(
  'server_members',
  {
    id: uuid('id').primaryKey(),
    joinedAt: timestamp('joined_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    leftAt: timestamp('left_at', { withTimezone: true }),
    membershipVersion: integer('membership_version').default(1).notNull(),
    permissionsVersion: integer('permissions_version').default(1).notNull(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    state: text('state').default('active').notNull(),
    timeoutUntil: timestamp('timeout_until', { withTimezone: true }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    check(
      'server_members_state_check',
      sql`${table.state} in ('active', 'pending', 'left')`,
    ),
    uniqueIndex('server_members_server_user_unique').on(
      table.serverId,
      table.userId,
    ),
    index('server_members_active_user_idx')
      .on(table.userId, table.joinedAt)
      .where(sql`${table.state} = 'active'`),
    index('server_members_server_state_idx').on(table.serverId, table.state),
  ],
)

export const serverMemberProfiles = pgTable('server_member_profiles', {
  avatarFileId: uuid('avatar_file_id'),
  bio: text('bio'),
  memberId: uuid('member_id')
    .primaryKey()
    .references(() => serverMembers.id, { onDelete: 'cascade' }),
  nickname: text('nickname'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const serverRoles = pgTable(
  'server_roles',
  {
    color: text('color'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    isDefault: boolean('is_default').default(false).notNull(),
    isManaged: boolean('is_managed').default(false).notNull(),
    name: text('name').notNull(),
    permissions: bigint('permissions', { mode: 'bigint' })
      .default(sql`0`)
      .notNull(),
    positionKey: text('position_key').notNull(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check('server_roles_permissions_check', sql`${table.permissions} >= 0`),
    index('server_roles_server_position_idx').on(
      table.serverId,
      table.positionKey,
    ),
    uniqueIndex('server_roles_default_unique')
      .on(table.serverId)
      .where(sql`${table.isDefault} = true`),
  ],
)

export const serverMemberRoles = pgTable(
  'server_member_roles',
  {
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    assignedBy: uuid('assigned_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    memberId: uuid('member_id')
      .notNull()
      .references(() => serverMembers.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => serverRoles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.memberId, table.roleId],
      name: 'server_member_roles_pk',
    }),
    index('server_member_roles_role_id_idx').on(table.roleId),
  ],
)

export const serverInvites = pgTable(
  'server_invites',
  {
    channelId: uuid('channel_id'),
    codeHash: text('code_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    creatorId: uuid('creator_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    id: uuid('id').primaryKey(),
    maxUses: integer('max_uses'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    uses: integer('uses').default(0).notNull(),
  },
  (table) => [
    check(
      'server_invites_max_uses_check',
      sql`${table.maxUses} is null or ${table.maxUses} > 0`,
    ),
    check('server_invites_uses_check', sql`${table.uses} >= 0`),
    uniqueIndex('server_invites_code_hash_unique').on(table.codeHash),
    index('server_invites_server_id_idx').on(table.serverId),
    index('server_invites_creator_id_idx').on(table.creatorId),
  ],
)

export const serverBans = pgTable(
  'server_bans',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    moderatorId: uuid('moderator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.serverId, table.userId],
      name: 'server_bans_pk',
    }),
    index('server_bans_user_id_idx').on(table.userId),
  ],
)

export const serverEmojis = pgTable(
  'server_emojis',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    creatorId: uuid('creator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    fileId: uuid('file_id').notNull(),
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('server_emojis_server_name_unique').on(
      table.serverId,
      table.name,
    ),
    index('server_emojis_creator_id_idx').on(table.creatorId),
  ],
)
