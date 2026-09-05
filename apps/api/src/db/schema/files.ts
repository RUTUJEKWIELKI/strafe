import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { users } from './identity.js'
import { servers } from './servers.js'

export const files = pgTable(
  'files',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    durationMs: integer('duration_ms'),
    encryptionMode: text('encryption_mode').default('none').notNull(),
    encryptionChunkSizeBytes: integer('encryption_chunk_size_bytes'),
    height: integer('height'),
    id: uuid('id').primaryKey(),
    mimeType: text('mime_type').notNull(),
    objectKey: text('object_key').notNull(),
    originalName: text('original_name').notNull(),
    ownerId: uuid('owner_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    purpose: text('purpose').notNull(),
    rejectionReason: text('rejection_reason'),
    scanStatus: text('scan_status').default('pending').notNull(),
    serverId: uuid('server_id').references(() => servers.id, {
      onDelete: 'cascade',
    }),
    sha256: text('sha256'),
    sizeBytes: integer('size_bytes').notNull(),
    status: text('status').default('pending').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    width: integer('width'),
  },
  (table) => [
    check(
      'files_status_check',
      sql`${table.status} in ('pending', 'processing', 'ready', 'quarantined', 'rejected', 'deleted')`,
    ),
    check(
      'files_scan_status_check',
      sql`${table.scanStatus} in ('pending', 'clean', 'skipped', 'blocked', 'failed')`,
    ),
    check('files_size_bytes_check', sql`${table.sizeBytes} >= 0`),
    uniqueIndex('files_object_key_unique').on(table.objectKey),
    index('files_owner_id_idx').on(table.ownerId),
    index('files_server_id_idx').on(table.serverId),
    index('files_pending_cleanup_idx')
      .on(table.createdAt)
      .where(sql`${table.status} = 'pending'`),
  ],
)

export const fileUploads = pgTable(
  'file_uploads',
  {
    abortedAt: timestamp('aborted_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    id: uuid('id').primaryKey(),
    multipart: boolean('multipart').default(true).notNull(),
    partSizeBytes: integer('part_size_bytes').notNull(),
    providerUploadId: text('provider_upload_id').notNull(),
    status: text('status').default('pending').notNull(),
  },
  (table) => [
    check(
      'file_uploads_status_check',
      sql`${table.status} in ('pending', 'completed', 'aborted', 'expired')`,
    ),
    check(
      'file_uploads_part_size_check',
      sql`${table.partSizeBytes} >= 5242880`,
    ),
    uniqueIndex('file_uploads_active_file_unique')
      .on(table.fileId)
      .where(sql`${table.status} = 'pending'`),
    index('file_uploads_expiry_idx')
      .on(table.expiresAt)
      .where(sql`${table.status} = 'pending'`),
  ],
)

export const fileVariants = pgTable(
  'file_variants',
  {
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    height: integer('height'),
    id: uuid('id').primaryKey(),
    mimeType: text('mime_type').notNull(),
    objectKey: text('object_key').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    type: text('type').notNull(),
    width: integer('width'),
  },
  (table) => [
    uniqueIndex('file_variants_file_type_unique').on(table.fileId, table.type),
    uniqueIndex('file_variants_object_key_unique').on(table.objectKey),
  ],
)
