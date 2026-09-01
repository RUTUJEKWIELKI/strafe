import type { RealtimeEvent } from '@strafe/shared'
import { and, asc, eq, inArray, isNull, lte, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import webpush from 'web-push'

import {
  notificationDigests,
  notificationPreferences,
  notifications,
  pushSubscriptions,
  users,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import { createId } from '../../lib/ids.js'

interface DeliveryConfig {
  digest: 'daily' | 'hourly' | 'off'
  email: boolean
  muted: boolean
  push: boolean
}

function config(
  value: Record<string, unknown> | undefined,
  type: string,
): DeliveryConfig {
  return {
    digest:
      value?.digest === 'hourly' || value?.digest === 'daily'
        ? value.digest
        : 'off',
    email: value?.email === true || type.startsWith('security.'),
    muted: value?.muted === true,
    push: value?.push !== false,
  }
}

function scheduledFor(digest: DeliveryConfig['digest']): Date {
  const now = new Date()
  if (digest === 'off') return now
  if (digest === 'hourly') {
    now.setUTCMinutes(0, 0, 0)
    now.setUTCHours(now.getUTCHours() + 1)
    return now
  }
  now.setUTCDate(now.getUTCDate() + 1)
  now.setUTCHours(8, 0, 0, 0)
  return now
}

export class NotificationDeliveryService {
  readonly #app: FastifyInstance
  #running = false

  constructor(app: FastifyInstance) {
    this.#app = app
    if (app.config.WEB_PUSH_PUBLIC_KEY && app.config.WEB_PUSH_PRIVATE_KEY) {
      webpush.setVapidDetails(
        app.config.WEB_PUSH_SUBJECT,
        app.config.WEB_PUSH_PUBLIC_KEY,
        app.config.WEB_PUSH_PRIVATE_KEY,
      )
    }
  }

  async enqueue(event: RealtimeEvent): Promise<void> {
    if (event.type !== 'notification.created' || !event.aggregateId) return
    const { db } = requireDatabase(this.#app)
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, event.aggregateId))
      .limit(1)
    if (!notification) return
    const deliveryConfig = await this.#preference(
      notification.userId,
      notification.type,
      notification.data,
    )
    if (deliveryConfig.muted) return
    const digest = deliveryConfig.digest
    const schedule = scheduledFor(digest)
    const bucket =
      digest === 'off'
        ? `immediate:${notification.id}`
        : `${notification.userId}:${digest}:${schedule.toISOString()}`
    await db
      .insert(notificationDigests)
      .values({
        bucketKey: bucket,
        id: createId(),
        notificationIds: [notification.id],
        scheduledFor: schedule,
        type: digest === 'off' ? 'immediate' : digest,
        userId: notification.userId,
      })
      .onConflictDoUpdate({
        set: {
          notificationIds: sql`${notificationDigests.notificationIds} || ${JSON.stringify(
            [notification.id],
          )}::jsonb`,
        },
        target: notificationDigests.bucketKey,
      })
  }

  async tick(): Promise<void> {
    if (this.#running) return
    this.#running = true
    try {
      const { db } = requireDatabase(this.#app)
      const digest = await db.transaction(async (tx) => {
        const [digest] = await tx
          .select()
          .from(notificationDigests)
          .where(
            and(
              isNull(notificationDigests.sentAt),
              lte(notificationDigests.scheduledFor, new Date()),
            ),
          )
          .orderBy(asc(notificationDigests.scheduledFor))
          .limit(1)
          .for('update', { skipLocked: true })
        if (!digest) return null
        await tx
          .update(notificationDigests)
          .set({
            attempts: digest.attempts + 1,
            scheduledFor: new Date(Date.now() + 5 * 60_000),
          })
          .where(eq(notificationDigests.id, digest.id))
        return { ...digest, attempts: digest.attempts + 1 }
      })
      if (!digest) return
      try {
        const rows =
          digest.notificationIds.length === 0
            ? []
            : await db
                .select()
                .from(notifications)
                .where(inArray(notifications.id, digest.notificationIds))
        if (rows.length > 0) {
          const deliveryConfig = await this.#preference(
            digest.userId,
            rows[0]!.type,
            rows[0]!.data,
          )
          if (!deliveryConfig.muted) {
            await this.#deliver(
              digest.userId,
              rows,
              deliveryConfig,
              digest.type !== 'immediate',
            )
          }
        }
        await db
          .update(notificationDigests)
          .set({ lastError: null, sentAt: new Date() })
          .where(eq(notificationDigests.id, digest.id))
      } catch (error) {
        await db
          .update(notificationDigests)
          .set({
            lastError:
              error instanceof Error
                ? error.message.slice(0, 1_000)
                : 'Delivery failed',
            scheduledFor: new Date(
              Date.now() + Math.min(3_600, 2 ** digest.attempts * 30) * 1_000,
            ),
            ...(digest.attempts >= 10 ? { sentAt: new Date() } : {}),
          })
          .where(eq(notificationDigests.id, digest.id))
        this.#app.reportError(error, { component: 'notification-delivery' })
      }
    } finally {
      this.#running = false
    }
  }

  async #deliver(
    userId: string,
    rows: Array<typeof notifications.$inferSelect>,
    deliveryConfig: DeliveryConfig,
    grouped: boolean,
  ): Promise<void> {
    const first = rows[0]
    if (!first) return
    const title = grouped
      ? `Masz ${rows.length} nowych powiadomień Strafe`
      : 'Nowe powiadomienie Strafe'
    const body = grouped
      ? `Oczekuje ${rows.length} nowych zdarzeń.`
      : `Typ zdarzenia: ${first.type}`
    const { db } = requireDatabase(this.#app)
    if (deliveryConfig.email) {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      if (user)
        await this.#app.mailService.sendNotification(user.email, title, body)
    }
    if (
      deliveryConfig.push &&
      this.#app.config.WEB_PUSH_PUBLIC_KEY &&
      this.#app.config.WEB_PUSH_PRIVATE_KEY
    ) {
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(
          and(
            eq(pushSubscriptions.userId, userId),
            isNull(pushSubscriptions.revokedAt),
          ),
        )
      await Promise.all(
        subscriptions.map(async (subscription) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  auth: subscription.keys.auth ?? '',
                  p256dh: subscription.keys.p256dh ?? '',
                },
              },
              JSON.stringify({ body, title, url: '/inbox' }),
              { TTL: 300 },
            )
            await db
              .update(pushSubscriptions)
              .set({ lastError: null, lastUsedAt: new Date() })
              .where(eq(pushSubscriptions.id, subscription.id))
          } catch (error) {
            const statusCode =
              typeof error === 'object' && error && 'statusCode' in error
                ? Number(error.statusCode)
                : 0
            await db
              .update(pushSubscriptions)
              .set({
                lastError:
                  error instanceof Error
                    ? error.message.slice(0, 1_000)
                    : 'Push delivery failed',
                ...(statusCode === 404 || statusCode === 410
                  ? { revokedAt: new Date() }
                  : {}),
              })
              .where(eq(pushSubscriptions.id, subscription.id))
            if (statusCode !== 404 && statusCode !== 410) throw error
          }
        }),
      )
    }
  }

  async #preference(
    userId: string,
    type: string,
    data: Record<string, unknown>,
  ): Promise<DeliveryConfig> {
    const serverId = typeof data.serverId === 'string' ? data.serverId : null
    const channelId = typeof data.channelId === 'string' ? data.channelId : null
    const { db } = requireDatabase(this.#app)
    const preferences = await db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          inArray(notificationPreferences.type, [type, '*']),
          or(
            and(
              channelId
                ? eq(notificationPreferences.channelId, channelId)
                : isNull(notificationPreferences.channelId),
              serverId
                ? eq(notificationPreferences.serverId, serverId)
                : isNull(notificationPreferences.serverId),
            ),
            and(
              serverId
                ? eq(notificationPreferences.serverId, serverId)
                : isNull(notificationPreferences.serverId),
              isNull(notificationPreferences.channelId),
            ),
            and(
              isNull(notificationPreferences.serverId),
              isNull(notificationPreferences.channelId),
            ),
          )!,
        ),
      )
    const best = preferences.sort((left, right) => {
      const score = (row: typeof notificationPreferences.$inferSelect) =>
        (row.type === type ? 4 : 0) +
        (row.channelId === channelId && channelId ? 2 : 0) +
        (row.serverId === serverId && serverId ? 1 : 0)
      return score(right) - score(left)
    })[0]
    return config(best?.config, type)
  }
}
