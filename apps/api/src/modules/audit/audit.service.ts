import type { AuditLogEntry } from '@strafe/shared'
import { and, desc, eq, lt, or } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { auditLog } from '../../db/schema.js'
import { decodeCursor, encodeCursor } from '../../lib/cursor.js'
import { requireDatabase } from '../../lib/database.js'
import { Permission } from '../../lib/permissions.js'
import { authorizeServer } from '../permissions/authorization.js'

function mapAuditEntry(row: typeof auditLog.$inferSelect): AuditLogEntry {
  if (!row.serverId) throw new Error('Server audit entry has no server ID')
  return {
    action: row.action,
    actorId: row.actorId,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    metadata: row.metadata,
    reason: row.reason,
    serverId: row.serverId,
    targetId: row.targetId,
    targetType: row.targetType,
  }
}

export class AuditService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async list(
    actorId: string,
    serverId: string,
    limit: number,
    before?: string,
  ) {
    await authorizeServer(this.#app, actorId, serverId, Permission.ViewAuditLog)
    const { db } = requireDatabase(this.#app)
    const cursor = before ? decodeCursor(before) : null
    const conditions = [eq(auditLog.serverId, serverId)]
    if (cursor) {
      const cursorDate = new Date(cursor.createdAt)
      conditions.push(
        or(
          lt(auditLog.createdAt, cursorDate),
          and(eq(auditLog.createdAt, cursorDate), lt(auditLog.id, cursor.id)),
        )!,
      )
    }

    const rows = await db
      .select()
      .from(auditLog)
      .where(and(...conditions))
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(limit + 1)
    const hasMore = rows.length > limit
    const page = rows.slice(0, limit)
    const last = page.at(-1)

    return {
      entries: page.map(mapAuditEntry),
      nextCursor:
        hasMore && last
          ? encodeCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    }
  }
}
