import type { PresenceStatus, RealtimeEvent } from '@strafe/shared'
import { and, eq } from 'drizzle-orm'
import type { FastifyPluginAsync } from 'fastify'

import { serverMembers } from '../db/schema.js'
import { requireDatabase } from '../lib/database.js'
import { createId } from '../lib/ids.js'
import { parseGatewayFrame } from '../lib/gateway-frame.js'
import { Permission } from '../lib/permissions.js'
import { authorizeChannel } from '../modules/permissions/authorization.js'

type JsonRecord = Record<string, unknown>

const presenceStatuses = new Set<PresenceStatus>([
  'online',
  'idle',
  'dnd',
  'invisible',
])

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function eventAudience(event: RealtimeEvent): {
  channelId?: string
  serverId?: string
  serverIds?: string[]
  userIds?: string[]
} {
  const audience = event.data.audience
  return isRecord(audience)
    ? (audience as ReturnType<typeof eventAudience>)
    : {}
}

function publicEvent(event: RealtimeEvent): RealtimeEvent {
  const data = { ...event.data }
  delete data.audience
  return { ...event, data }
}

const gatewayRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/gateway',
    {
      schema: { hide: true },
      websocket: true,
    },
    (socket, request) => {
      if (!app.config.REALTIME_ENABLED) {
        socket.close(1013, 'Realtime is disabled')
        return
      }

      const gatewaySessionId = createId()
      const rooms = new Set<string>()
      const subscriptions = new Set<string>()
      const typingAt = new Map<string, number>()
      const commandTimestamps: number[] = []
      const pendingEvents = new Map<string, RealtimeEvent>()
      const sentEventIds = new Set<string>()
      let userId: string | null = null
      let failedFrames = 0
      let frameChain = Promise.resolve()
      let lastHeartbeatAt = Date.now()
      let resuming = false

      const send = (op: string, data: unknown): boolean => {
        if (socket.readyState !== 1) return false
        if (socket.bufferedAmount > app.config.GATEWAY_MAX_BUFFERED_BYTES) {
          socket.close(4008, 'Outbound backpressure limit exceeded')
          return false
        }
        socket.send(JSON.stringify({ d: data, op }))
        return true
      }

      const sendEvent = (event: RealtimeEvent) => {
        if (sentEventIds.has(event.eventId)) return
        if (!send('event', publicEvent(event))) return
        sentEventIds.add(event.eventId)
        if (sentEventIds.size > 2_000) {
          const oldest = sentEventIds.values().next().value as
            string | undefined
          if (oldest) sentEventIds.delete(oldest)
        }
      }

      const visible = (event: RealtimeEvent): boolean => {
        if (!userId) return false
        const audience = eventAudience(event)
        return (
          audience.userIds?.includes(userId) === true ||
          (audience.serverId
            ? rooms.has(`server:${audience.serverId}`)
            : false) ||
          audience.serverIds?.some((id) => rooms.has(`server:${id}`)) ===
            true ||
          (audience.channelId
            ? rooms.has(`channel:${audience.channelId}`)
            : false)
        )
      }

      const unsubscribe = app.eventBus.subscribe((event) => {
        if (!visible(event)) return
        if (resuming) pendingEvents.set(event.eventId, event)
        else sendEvent(event)
      })

      const identifyTimeout = setTimeout(() => {
        if (!userId) socket.close(4001, 'Identification timeout')
      }, 10_000)
      identifyTimeout.unref()

      const heartbeatWatchdog = setInterval(() => {
        if (
          userId &&
          Date.now() - lastHeartbeatAt >
            25_000 + app.config.GATEWAY_HEARTBEAT_GRACE_MS
        ) {
          socket.close(4009, 'Heartbeat timeout')
        }
      }, 5_000)
      heartbeatWatchdog.unref()

      send('hello', {
        gatewaySessionId,
        heartbeatIntervalMs: 25_000,
        resumeWindow: app.redis ? 'redis-stream' : 'current-process',
      })

      const identify = async (data: JsonRecord) => {
        if (userId) throw new Error('Already identified')
        if (typeof data.token !== 'string') {
          throw new Error('Identify token is required')
        }
        const lastStreamId =
          typeof data.lastStreamId === 'string' ? data.lastStreamId : null
        if (lastStreamId && !/^\d+-\d+$/.test(lastStreamId)) {
          throw new Error('lastStreamId is invalid')
        }
        resuming = lastStreamId !== null

        try {
          const auth = await app.authService.verifyAccessToken(data.token)
          userId = auth.userId
          lastHeartbeatAt = Date.now()
          rooms.add(`user:${userId}`)
          const { db } = requireDatabase(app)
          const memberships = await db
            .select({ serverId: serverMembers.serverId })
            .from(serverMembers)
            .where(
              and(
                eq(serverMembers.userId, userId),
                eq(serverMembers.state, 'active'),
              ),
            )
          for (const membership of memberships) {
            rooms.add(`server:${membership.serverId}`)
          }
          clearTimeout(identifyTimeout)
          const presence = await app.presence.connect(
            userId,
            gatewaySessionId,
            'online',
          )
          send('ready', {
            gatewaySessionId,
            presence,
            serverIds: memberships.map((membership) => membership.serverId),
            userId,
          })

          if (lastStreamId) {
            const missed = await app.eventBus.readAfter(lastStreamId)
            if (!missed) {
              send('resync_required', { reason: 'resume_window_unavailable' })
            } else {
              for (const event of missed) {
                if (visible(event)) sendEvent(event)
              }
              send('resumed', { events: missed.length })
            }
          }
        } finally {
          resuming = false
          for (const event of pendingEvents.values()) sendEvent(event)
          pendingEvents.clear()
        }
      }

      const handleFrame = async (raw: unknown) => {
        const frameBytes = Buffer.isBuffer(raw)
          ? raw.byteLength
          : Buffer.byteLength(String(raw))
        if (frameBytes > app.config.GATEWAY_MAX_FRAME_BYTES) {
          socket.close(1009, 'Frame exceeds the configured limit')
          return
        }
        const now = Date.now()
        while (
          commandTimestamps.length > 0 &&
          (commandTimestamps[0] ?? now) <= now - 60_000
        ) {
          commandTimestamps.shift()
        }
        if (
          commandTimestamps.length >= app.config.GATEWAY_COMMANDS_PER_MINUTE
        ) {
          socket.close(4008, 'Gateway command rate exceeded')
          return
        }
        commandTimestamps.push(now)
        const frame = parseGatewayFrame(raw, app.config.GATEWAY_MAX_FRAME_BYTES)
        const data = frame.d

        if (frame.op === 'identify') {
          await identify(data)
          failedFrames = 0
          return
        }
        if (!userId) throw new Error('Identify before sending commands')

        switch (frame.op) {
          case 'heartbeat': {
            lastHeartbeatAt = Date.now()
            const presence = await app.presence.heartbeat(
              userId,
              gatewaySessionId,
            )
            send('heartbeat_ack', { presence, timestamp: Date.now() })
            break
          }
          case 'presence_update': {
            if (
              typeof data.status !== 'string' ||
              !presenceStatuses.has(data.status as PresenceStatus)
            ) {
              throw new Error('Unsupported presence status')
            }
            const presence = await app.presence.setStatus(
              userId,
              gatewaySessionId,
              data.status as Exclude<PresenceStatus, 'offline'>,
            )
            send('presence_ack', presence)
            break
          }
          case 'subscribe': {
            if (typeof data.channelId !== 'string') {
              throw new Error('channelId is required')
            }
            if (
              !subscriptions.has(data.channelId) &&
              subscriptions.size >= app.config.GATEWAY_MAX_SUBSCRIPTIONS
            ) {
              throw new Error('Channel subscription limit exceeded')
            }
            await authorizeChannel(
              app,
              userId,
              data.channelId,
              Permission.ViewChannel,
            )
            rooms.add(`channel:${data.channelId}`)
            subscriptions.add(data.channelId)
            send('subscribed', { channelId: data.channelId })
            break
          }
          case 'unsubscribe': {
            if (typeof data.channelId === 'string') {
              rooms.delete(`channel:${data.channelId}`)
              subscriptions.delete(data.channelId)
            }
            break
          }
          case 'typing': {
            if (typeof data.channelId !== 'string') {
              throw new Error('channelId is required')
            }
            const lastSentAt = typingAt.get(data.channelId) ?? 0
            if (Date.now() - lastSentAt < 4_000) return
            const authorization = await authorizeChannel(
              app,
              userId,
              data.channelId,
              Permission.SendMessages,
            )
            typingAt.set(data.channelId, Date.now())
            await app.eventBus.publish({
              aggregateId: data.channelId,
              data: {
                audience: {
                  channelId: data.channelId,
                  ...(authorization.channel.serverId
                    ? { serverId: authorization.channel.serverId }
                    : {}),
                },
                channelId: data.channelId,
                expiresInMs: 10_000,
                userId,
              },
              eventId: createId(),
              occurredAt: new Date().toISOString(),
              streamId: null,
              type: 'typing.started',
              version: 1,
            })
            break
          }
          default:
            throw new Error('Unsupported gateway operation')
        }
        failedFrames = 0
      }

      socket.on('message', (raw: unknown) => {
        frameChain = frameChain
          .then(() => handleFrame(raw))
          .catch((error: unknown) => {
            failedFrames += 1
            send('error', {
              code: 'INVALID_FRAME',
              message: error instanceof Error ? error.message : 'Invalid frame',
            })
            if (failedFrames >= 5) socket.close(4002, 'Too many invalid frames')
          })
      })

      socket.on('close', () => {
        clearTimeout(identifyTimeout)
        clearInterval(heartbeatWatchdog)
        unsubscribe()
        if (userId) {
          void app.presence
            .disconnect(userId, gatewaySessionId)
            .catch((error: unknown) => {
              request.log.warn({ err: error }, 'Presence disconnect failed')
            })
        }
      })
      socket.on('error', (error: unknown) => {
        request.log.debug({ err: error }, 'WebSocket connection error')
      })
    },
  )
}

export default gatewayRoutes
