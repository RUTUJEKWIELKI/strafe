import type {
  Notification,
  PushSubscriptionBody,
  UpsertNotificationPreferenceBody,
} from '@strafe/shared'
import { and, desc, eq, isNull, lt, or } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  notificationPreferences,
  notifications,
  pushSubscriptions,
} from '../../db/schema.js'
import { decodeCursor, encodeCursor } from '../../lib/cursor.js'
import { requireDatabase } from '../../lib/database.js'
import { BadRequestError } from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'
import { Permission } from '../../lib/permissions.js'
import {
  authorizeChannel,
  authorizeServer,
} from '../permissions/authorization.js'

function mapNotification(row: typeof notifications.$inferSelect): Notification {
  return {
    createdAt: row.createdAt.toISOString(),
    data: row.data,
    groupCount: row.groupCount,
    groupKey: row.groupKey,
    id: row.id,
    readAt: row.readAt?.toISOString() ?? null,
    seenAt: row.seenAt?.toISOString() ?? null,
    type: row.type,
    userId: row.userId,
  }
}

export class NotificationService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async list(
    userId: string,
    limit: number,
    before?: string,
    unreadOnly = false,
  ) {
    const { db } = requireDatabase(this.#app)
    const cursor = before ? decodeCursor(before) : null
    const conditions = [eq(notifications.userId, userId)]
    if (unreadOnly) conditions.push(isNull(notifications.readAt))
    if (cursor) {
      const cursorDate = new Date(cursor.createdAt)
      conditions.push(
        or(
          lt(notifications.createdAt, cursorDate),
          and(
            eq(notifications.createdAt, cursorDate),
            lt(notifications.id, cursor.id),
          ),
        )!,
      )
    }

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt), desc(notifications.id))
      .limit(limit + 1)
    const hasMore = rows.length > limit
    const page = rows.slice(0, limit)
    const last = page.at(-1)
    return {
      nextCursor:
        hasMore && last
          ? encodeCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
      notifications: page.map(mapNotification),
    }
  }

  async markRead(userId: string, notificationId?: string): Promise<number> {
    const { db } = requireDatabase(this.#app)
    const conditions = [
      eq(notifications.userId, userId),
      isNull(notifications.readAt),
    ]
    if (notificationId) {
      conditions.push(eq(notifications.id, notificationId))
    }
    const updated = await db
      .update(notifications)
      .set({ readAt: new Date(), seenAt: new Date() })
      .where(and(...conditions))
      .returning({ id: notifications.id })
    return updated.length
  }

  async listPreferences(userId: string) {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .orderBy(notificationPreferences.type)
    return { preferences: rows.map((row) => this.#preference(row)) }
  }

  async upsertPreference(
    userId: string,
    input: UpsertNotificationPreferenceBody,
  ) {
    if (input.channelId) {
      const authorization = await authorizeChannel(
        this.#app,
        userId,
        input.channelId,
        Permission.ViewChannel,
      )
      if (input.serverId && input.serverId !== authorization.channel.serverId) {
        throw new BadRequestError(
          'Notification preference server does not match its channel',
        )
      }
    } else if (input.serverId) {
      await authorizeServer(this.#app, userId, input.serverId)
    }
    const { db } = requireDatabase(this.#app)
    const scopeKey = `${input.type}:${input.serverId ?? '*'}:${input.channelId ?? '*'}`
    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.scopeKey, scopeKey),
        ),
      )
      .limit(1)
    const previous = this.#config(existing?.config)
    const config = { ...previous, ...input.config }
    const [preference] = await db
      .insert(notificationPreferences)
      .values({
        channelId: input.channelId ?? null,
        config,
        id: existing?.id ?? createId(),
        scopeKey,
        serverId: input.serverId ?? null,
        type: input.type,
        userId,
      })
      .onConflictDoUpdate({
        set: { config, updatedAt: new Date() },
        target: [
          notificationPreferences.userId,
          notificationPreferences.scopeKey,
        ],
      })
      .returning()
    if (!preference)
      throw new Error('Notification preference upsert returned no row')
    return this.#preference(preference)
  }

  async listPushSubscriptions(userId: string) {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, userId),
          isNull(pushSubscriptions.revokedAt),
        ),
      )
      .orderBy(desc(pushSubscriptions.createdAt))
    return {
      subscriptions: rows.map((row) => ({
        createdAt: row.createdAt.toISOString(),
        endpoint: row.endpoint,
        id: row.id,
        lastError: row.lastError,
        lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      })),
    }
  }

  async subscribePush(userId: string, input: PushSubscriptionBody) {
    let endpoint: URL
    try {
      endpoint = new URL(input.endpoint)
    } catch {
      throw new BadRequestError('Push endpoint must be a valid URL')
    }
    const localDevelopmentEndpoint =
      this.#app.config.NODE_ENV !== 'production' &&
      endpoint.protocol === 'http:' &&
      (endpoint.hostname === 'localhost' || endpoint.hostname === '127.0.0.1')
    if (endpoint.protocol !== 'https:' && !localDevelopmentEndpoint) {
      throw new BadRequestError('Push endpoint must use HTTPS')
    }
    const { db } = requireDatabase(this.#app)
    const [subscription] = await db
      .insert(pushSubscriptions)
      .values({
        endpoint: input.endpoint,
        id: createId(),
        keys: input.keys,
        userId,
      })
      .onConflictDoUpdate({
        set: {
          keys: input.keys,
          lastError: null,
          revokedAt: null,
          userId,
        },
        target: pushSubscriptions.endpoint,
      })
      .returning()
    if (!subscription)
      throw new Error('Push subscription upsert returned no row')
    return {
      createdAt: subscription.createdAt.toISOString(),
      endpoint: subscription.endpoint,
      id: subscription.id,
      lastError: subscription.lastError,
      lastUsedAt: subscription.lastUsedAt?.toISOString() ?? null,
    }
  }

  async unsubscribePush(userId: string, subscriptionId: string) {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .update(pushSubscriptions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(pushSubscriptions.id, subscriptionId),
          eq(pushSubscriptions.userId, userId),
          isNull(pushSubscriptions.revokedAt),
        ),
      )
      .returning({ id: pushSubscriptions.id })
    return { removed: rows.length > 0 }
  }

  #config(value: Record<string, unknown> | undefined) {
    return {
      digest:
        value?.digest === 'hourly' || value?.digest === 'daily'
          ? value.digest
          : ('off' as const),
      email: value?.email === true,
      muted: value?.muted === true,
      push: value?.push !== false,
    }
  }

  #preference(row: typeof notificationPreferences.$inferSelect) {
    return {
      channelId: row.channelId,
      config: this.#config(row.config),
      id: row.id,
      serverId: row.serverId,
      type: row.type,
      updatedAt: row.updatedAt.toISOString(),
      userId: row.userId,
    }
  }
}
