import type { Presence, PresenceStatus, RealtimeEvent } from '@strafe/shared'
import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { serverMembers, userSettings } from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import { createId } from '../../lib/ids.js'

const sessionTtlMs = 75_000

interface PresenceSession {
  expiresAt: number
  sessionId: string
  status: Exclude<PresenceStatus, 'offline'>
  userId: string
}

function publicStatus(
  sessions: PresenceSession[],
): Exclude<PresenceStatus, 'invisible'> {
  if (sessions.some((session) => session.status === 'invisible')) {
    return 'offline'
  }
  if (sessions.some((session) => session.status === 'dnd')) return 'dnd'
  if (sessions.some((session) => session.status === 'online')) return 'online'
  if (sessions.length > 0) return 'idle'
  return 'offline'
}

export class PresenceService {
  readonly #app: FastifyInstance
  readonly #localSessions = new Map<string, PresenceSession>()
  readonly #localStates = new Map<string, Presence>()
  readonly #nodeId = createId()
  readonly #cleanupTimer: NodeJS.Timeout

  constructor(app: FastifyInstance) {
    this.#app = app
    this.#cleanupTimer = setInterval(() => {
      void this.#cleanupExpired().catch((error: unknown) => {
        this.#app.log.error({ err: error }, 'Presence cleanup failed')
        this.#app.reportError(error, { component: 'presence' })
      })
    }, 10_000)
    this.#cleanupTimer.unref()
  }

  async close(): Promise<void> {
    clearInterval(this.#cleanupTimer)
    await Promise.allSettled(
      [...this.#localSessions.values()].map((session) =>
        this.disconnect(session.userId, session.sessionId),
      ),
    )
  }

  async connect(
    userId: string,
    sessionId: string,
    status: Exclude<PresenceStatus, 'offline'> = 'online',
  ): Promise<Presence> {
    return this.heartbeat(userId, sessionId, status)
  }

  async heartbeat(
    userId: string,
    sessionId: string,
    status?: Exclude<PresenceStatus, 'offline'>,
  ): Promise<Presence> {
    const now = Date.now()
    const previous = this.#localSessions.get(sessionId)
    const session: PresenceSession = {
      expiresAt: now + sessionTtlMs,
      sessionId,
      status: status ?? previous?.status ?? 'online',
      userId,
    }
    this.#localSessions.set(sessionId, session)

    if (this.#app.redis) {
      const sessionKey = `presence:session:${sessionId}`
      const userSessionsKey = `presence:user:${userId}:sessions`
      await this.#app.redis.command
        .multi()
        .hset(sessionKey, {
          expiresAt: String(session.expiresAt),
          status: session.status,
          userId,
        })
        .pexpire(sessionKey, sessionTtlMs)
        .zadd(userSessionsKey, now, sessionId)
        .zremrangebyscore(userSessionsKey, 0, now - sessionTtlMs)
        .pexpire(userSessionsKey, sessionTtlMs * 2)
        .exec()
    }

    return this.#aggregate(userId)
  }

  async disconnect(userId: string, sessionId: string): Promise<Presence> {
    this.#localSessions.delete(sessionId)
    if (this.#app.redis) {
      await this.#app.redis.command
        .multi()
        .del(`presence:session:${sessionId}`)
        .zrem(`presence:user:${userId}:sessions`, sessionId)
        .exec()
    }
    return this.#aggregate(userId)
  }

  async setStatus(
    userId: string,
    sessionId: string,
    status: Exclude<PresenceStatus, 'offline'>,
  ): Promise<Presence> {
    const { db } = requireDatabase(this.#app)
    await db
      .update(userSettings)
      .set({ manualStatus: status, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
    return this.heartbeat(userId, sessionId, status)
  }

  async get(userId: string): Promise<Presence> {
    if (this.#app.redis) {
      const raw = await this.#app.redis.command.get(
        `presence:user:${userId}:state`,
      )
      if (raw) {
        try {
          return JSON.parse(raw) as Presence
        } catch {
          // Recompute malformed cache entries.
        }
      }
    }
    return this.#aggregate(userId)
  }

  async #aggregate(userId: string): Promise<Presence> {
    const now = Date.now()
    let sessions = [...this.#localSessions.values()].filter(
      (session) => session.userId === userId && session.expiresAt > now,
    )

    if (this.#app.redis) {
      const userSessionsKey = `presence:user:${userId}:sessions`
      await this.#app.redis.command.zremrangebyscore(
        userSessionsKey,
        0,
        now - sessionTtlMs,
      )
      const sessionIds = await this.#app.redis.command.zrangebyscore(
        userSessionsKey,
        now - sessionTtlMs,
        '+inf',
      )
      if (sessionIds.length > 0) {
        const pipeline = this.#app.redis.command.pipeline()
        for (const sessionId of sessionIds) {
          pipeline.hgetall(`presence:session:${sessionId}`)
        }
        const rows = await pipeline.exec()
        sessions = (rows ?? []).flatMap(([, raw], index) => {
          const data = raw as Record<string, string> | null
          const sessionId = sessionIds[index]
          if (!data || !sessionId || data.userId !== userId) return []
          const expiresAt = Number(data.expiresAt)
          if (!Number.isFinite(expiresAt) || expiresAt <= now) return []
          return [
            {
              expiresAt,
              sessionId,
              status:
                (data.status as PresenceSession['status'] | undefined) ??
                'online',
              userId,
            },
          ]
        })
      } else {
        sessions = []
      }
    }

    const status = publicStatus(sessions)
    let previous = this.#localStates.get(userId)
    if (!previous && this.#app.redis) {
      const raw = await this.#app.redis.command.get(
        `presence:user:${userId}:state`,
      )
      if (raw) {
        try {
          previous = JSON.parse(raw) as Presence
        } catch {
          previous = undefined
        }
      }
    }
    if (previous?.status === status) return previous

    const version = this.#app.redis
      ? await this.#app.redis.command.incr(`presence:user:${userId}:version`)
      : (previous?.version ?? 0) + 1

    const presence: Presence = {
      lastChangedAt: new Date().toISOString(),
      status,
      userId,
      version,
    }
    this.#localStates.set(userId, presence)
    if (this.#app.redis) {
      await this.#app.redis.command.set(
        `presence:user:${userId}:state`,
        JSON.stringify(presence),
        'PX',
        90_000,
      )
    }
    await this.#publish(presence)
    return presence
  }

  async #publish(presence: Presence): Promise<void> {
    const { db } = requireDatabase(this.#app)
    const memberships = await db
      .select({ serverId: serverMembers.serverId })
      .from(serverMembers)
      .where(
        and(
          eq(serverMembers.userId, presence.userId),
          eq(serverMembers.state, 'active'),
        ),
      )
    const event: RealtimeEvent = {
      aggregateId: presence.userId,
      data: {
        audience: {
          serverIds: memberships.map((membership) => membership.serverId),
          userIds: [presence.userId],
        },
        presence,
      },
      eventId: createId(),
      occurredAt: new Date().toISOString(),
      streamId: null,
      type: 'presence.changed',
      version: presence.version,
    }
    await this.#app.eventBus.publish(event)
  }

  async #cleanupExpired(): Promise<void> {
    const now = Date.now()
    const affectedUsers = new Set<string>()
    for (const [sessionId, session] of this.#localSessions) {
      if (session.expiresAt <= now) {
        this.#localSessions.delete(sessionId)
        affectedUsers.add(session.userId)
      }
    }
    await Promise.all(
      [...affectedUsers].map((userId) => this.#aggregate(userId)),
    )
    if (!this.#app.redis) return
    const lease = await this.#app.redis.command.set(
      'presence:cleanup:lease',
      this.#nodeId,
      'PX',
      9_000,
      'NX',
    )
    if (lease !== 'OK') return
    let cursor = '0'
    do {
      const [nextCursor, keys] = await this.#app.redis.command.scan(
        cursor,
        'MATCH',
        'presence:user:*:sessions',
        'COUNT',
        100,
      )
      cursor = nextCursor
      for (const key of keys) {
        const removed = await this.#app.redis.command.zremrangebyscore(
          key,
          0,
          now - sessionTtlMs,
        )
        if (removed > 0) {
          const userId = key.split(':')[2]
          if (userId) await this.#aggregate(userId)
        }
      }
    } while (cursor !== '0')
  }
}
