import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { users } from './identity.js'
import { servers } from './servers.js'

export const moderationCases = pgTable(
  'moderation_cases',
  {
    closedAt: timestamp('closed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    assignedTo: uuid('assigned_to').references(() => users.id, {
      onDelete: 'set null',
    }),
    openedBy: uuid('opened_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    status: text('status').default('open').notNull(),
    subjectId: uuid('subject_id').notNull(),
    subjectType: text('subject_type').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'moderation_cases_status_check',
      sql`${table.status} in ('open', 'resolved', 'dismissed', 'appealed')`,
    ),
    check(
      'moderation_cases_subject_type_check',
      sql`${table.subjectType} in ('user', 'message', 'server', 'channel')`,
    ),
    index('moderation_cases_server_status_idx').on(
      table.serverId,
      table.status,
      table.createdAt.desc(),
    ),
    index('moderation_cases_opened_by_idx').on(table.openedBy),
  ],
)

export const moderationActions = pgTable(
  'moderation_actions',
  {
    action: text('action').notNull(),
    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    caseId: uuid('case_id')
      .notNull()
      .references(() => moderationCases.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    id: uuid('id').primaryKey(),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    reason: text('reason'),
  },
  (table) => [
    check(
      'moderation_actions_action_check',
      sql`${table.action} in ('warn', 'delete_content', 'timeout', 'kick', 'ban', 'unban', 'note')`,
    ),
    index('moderation_actions_case_time_idx').on(
      table.caseId,
      table.createdAt.desc(),
    ),
    index('moderation_actions_actor_id_idx').on(table.actorId),
  ],
)

export const userReports = pgTable(
  'user_reports',
  {
    category: text('category').notNull(),
    assignedTo: uuid('assigned_to').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    description: text('description'),
    id: uuid('id').primaryKey(),
    reporterId: uuid('reporter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNote: text('resolution_note'),
    serverId: uuid('server_id').references(() => servers.id, {
      onDelete: 'cascade',
    }),
    status: text('status').default('open').notNull(),
    targetId: uuid('target_id').notNull(),
    targetType: text('target_type').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'user_reports_status_check',
      sql`${table.status} in ('open', 'reviewing', 'resolved', 'dismissed')`,
    ),
    check(
      'user_reports_target_type_check',
      sql`${table.targetType} in ('user', 'message', 'server', 'channel')`,
    ),
    index('user_reports_status_time_idx').on(
      table.status,
      table.createdAt.desc(),
    ),
    index('user_reports_reporter_id_idx').on(table.reporterId),
    index('user_reports_server_id_idx').on(table.serverId),
  ],
)

export const moderationAppeals = pgTable(
  'moderation_appeals',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    decidedBy: uuid('decided_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    decisionNote: text('decision_note'),
    id: uuid('id').primaryKey(),
    reason: text('reason').notNull(),
    status: text('status').default('pending').notNull(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => moderationCases.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    check(
      'moderation_appeals_status_check',
      sql`${table.status} in ('pending', 'accepted', 'rejected')`,
    ),
    uniqueIndex('moderation_appeals_pending_case_user_unique')
      .on(table.caseId, table.userId)
      .where(sql`${table.status} = 'pending'`),
    index('moderation_appeals_case_time_idx').on(
      table.caseId,
      table.createdAt.desc(),
    ),
  ],
)

export const automodRules = pgTable(
  'automod_rules',
  {
    action: text('action').notNull(),
    config: jsonb('config').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdBy: uuid('created_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    enabled: boolean('enabled').default(true).notNull(),
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    serverId: uuid('server_id')
      .notNull()
      .references(() => servers.id, { onDelete: 'cascade' }),
    triggerType: text('trigger_type').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('automod_rules_server_id_idx').on(table.serverId),
    index('automod_rules_created_by_idx').on(table.createdBy),
  ],
)

export const automodEvents = pgTable(
  'automod_events',
  {
    actionTaken: text('action_taken').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => automodRules.id, { onDelete: 'cascade' }),
    targetId: uuid('target_id').notNull(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('automod_events_rule_time_idx').on(
      table.ruleId,
      table.createdAt.desc(),
    ),
    index('automod_events_user_id_idx').on(table.userId),
  ],
)

export const auditLog = pgTable(
  'audit_log',
  {
    action: text('action').notNull(),
    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    id: uuid('id').primaryKey(),
    metadata: jsonb('metadata')
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    reason: text('reason'),
    serverId: uuid('server_id').references(() => servers.id, {
      onDelete: 'cascade',
    }),
    targetId: uuid('target_id'),
    targetType: text('target_type'),
  },
  (table) => [
    index('audit_log_server_time_idx').on(
      table.serverId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
    index('audit_log_actor_id_idx').on(table.actorId),
  ],
)
