import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { buildServer } from '../dist/server.js'

const databaseUrl = process.env.TEST_DATABASE_URL

describe.skipIf(!databaseUrl)('community API integration', () => {
  it('registers users and moves a message through a joined server', async () => {
    process.env.DATABASE_URL = databaseUrl
    process.env.AUTH_JWT_SECRET =
      process.env.AUTH_JWT_SECRET ?? 'integration-test-secret-at-least-32-chars'
    process.env.OUTBOX_ENABLED = 'false'
    process.env.REALTIME_ENABLED = 'true'

    const server = await buildServer({ logger: false })
    const suffix = uuidv7().replaceAll('-', '').slice(-12)
    let createdServerId: string | null = null
    const createdUserIds: string[] = []

    try {
      const ownerRegistration = await server.inject({
        method: 'POST',
        payload: {
          displayName: 'Owner',
          email: `owner-${suffix}@example.test`,
          handle: `owner_${suffix}`,
          password: 'correct horse battery staple',
        },
        url: '/api/auth/register',
      })
      expect(ownerRegistration.statusCode).toBe(201)
      const owner = ownerRegistration.json()
      createdUserIds.push(owner.user.id as string)
      const ownerToken = owner.tokens.accessToken as string

      const createdServer = await server.inject({
        headers: { authorization: `Bearer ${ownerToken}` },
        method: 'POST',
        payload: { name: 'Integration Community' },
        url: '/api/servers',
      })
      expect(createdServer.statusCode).toBe(201)
      const community = createdServer.json()
      createdServerId = community.server.id as string

      const inviteResponse = await server.inject({
        headers: { authorization: `Bearer ${ownerToken}` },
        method: 'POST',
        payload: { maxUses: 1 },
        url: `/api/servers/${community.server.id}/invites`,
      })
      expect(inviteResponse.statusCode).toBe(201)
      const invite = inviteResponse.json()

      const memberRegistration = await server.inject({
        method: 'POST',
        payload: {
          displayName: 'Member',
          email: `member-${suffix}@example.test`,
          handle: `member_${suffix}`,
          password: 'correct horse battery staple',
        },
        url: '/api/auth/register',
      })
      expect(memberRegistration.statusCode).toBe(201)
      createdUserIds.push(memberRegistration.json().user.id as string)
      const memberToken = memberRegistration.json().tokens.accessToken as string

      const gateway = await server.injectWS('/api/gateway')
      const readyFrame = new Promise<Record<string, unknown>>(
        (resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('Gateway ready timeout')),
            5_000,
          )
          gateway.on('message', (raw) => {
            const frame = JSON.parse(String(raw)) as {
              d?: Record<string, unknown>
              op?: string
            }
            if (frame.op === 'ready') {
              clearTimeout(timeout)
              resolve(frame.d ?? {})
            }
          })
        },
      )
      gateway.send(
        JSON.stringify({
          d: { token: memberToken },
          op: 'identify',
        }),
      )
      await expect(readyFrame).resolves.toMatchObject({
        userId: memberRegistration.json().user.id,
      })
      gateway.close()

      const joined = await server.inject({
        headers: { authorization: `Bearer ${memberToken}` },
        method: 'POST',
        url: `/api/invites/${invite.code}/join`,
      })
      expect(joined.statusCode).toBe(200)
      expect(joined.json()).toMatchObject({ joined: true })

      const messageResponse = await server.inject({
        headers: { authorization: `Bearer ${memberToken}` },
        method: 'POST',
        payload: {
          clientNonce: uuidv7(),
          content: 'Hello from the integration test',
        },
        url: `/api/channels/${community.defaultChannelId}/messages`,
      })
      expect(messageResponse.statusCode).toBe(201)
      const firstMessage = messageResponse.json()

      const reaction = await server.inject({
        headers: { authorization: `Bearer ${memberToken}` },
        method: 'PUT',
        payload: { emojiKey: '🔥' },
        url: `/api/messages/${firstMessage.id}/reactions`,
      })
      expect(reaction.statusCode).toBe(200)
      expect(reaction.json()).toEqual({ active: true })

      const reply = await server.inject({
        headers: { authorization: `Bearer ${ownerToken}` },
        method: 'POST',
        payload: {
          clientNonce: uuidv7(),
          content: 'Welcome to the server',
          replyToMessageId: firstMessage.id,
        },
        url: `/api/channels/${community.defaultChannelId}/messages`,
      })
      expect(reply.statusCode).toBe(201)
      const replyMessage = reply.json()

      const readState = await server.inject({
        headers: { authorization: `Bearer ${memberToken}` },
        method: 'PUT',
        payload: { lastReadMessageId: replyMessage.id },
        url: `/api/channels/${community.defaultChannelId}/read-state`,
      })
      expect(readState.statusCode).toBe(200)

      const notificationInbox = await server.inject({
        headers: { authorization: `Bearer ${memberToken}` },
        method: 'GET',
        url: '/api/users/@me/notifications?unreadOnly=true',
      })
      expect(notificationInbox.statusCode).toBe(200)
      expect(notificationInbox.json()).toMatchObject({
        notifications: [{ type: 'message.reply' }],
      })

      const directMessage = await server.inject({
        headers: { authorization: `Bearer ${memberToken}` },
        method: 'POST',
        payload: { recipientId: owner.user.id },
        url: '/api/users/@me/dms',
      })
      expect(directMessage.statusCode).toBe(201)
      expect(directMessage.json()).toMatchObject({ type: 'dm' })

      const history = await server.inject({
        headers: { authorization: `Bearer ${ownerToken}` },
        method: 'GET',
        url: `/api/channels/${community.defaultChannelId}/messages?limit=25`,
      })
      expect(history.statusCode).toBe(200)
      expect(history.json()).toMatchObject({
        messages: [
          {
            content: 'Welcome to the server',
          },
          {
            content: 'Hello from the integration test',
          },
        ],
      })

      const timeout = await server.inject({
        headers: { authorization: `Bearer ${ownerToken}` },
        method: 'POST',
        payload: { durationSeconds: 60, reason: 'Integration verification' },
        url: `/api/servers/${community.server.id}/members/${
          memberRegistration.json().user.id
        }/timeout`,
      })
      expect(timeout.statusCode).toBe(200)

      const rotatedSession = await server.inject({
        method: 'POST',
        payload: { refreshToken: owner.tokens.refreshToken },
        url: '/api/auth/refresh',
      })
      expect(rotatedSession.statusCode).toBe(200)

      const replayedSession = await server.inject({
        method: 'POST',
        payload: { refreshToken: owner.tokens.refreshToken },
        url: '/api/auth/refresh',
      })
      expect(replayedSession.statusCode, replayedSession.body).toBe(401)
      expect(replayedSession.json()).toMatchObject({
        error: { code: 'UNAUTHORIZED' },
      })
    } finally {
      if (server.database) {
        const cleanupIds = [
          ...createdUserIds,
          ...(createdServerId ? [createdServerId] : []),
        ]
        if (cleanupIds.length > 0) {
          await server.database.pool.query(
            'delete from outbox_events where payload::text like any($1::text[])',
            [cleanupIds.map((id) => `%${id}%`)],
          )
        }
        if (createdServerId) {
          await server.database.pool.query(
            'delete from servers where id = $1',
            [createdServerId],
          )
        }
        if (createdUserIds.length > 0) {
          await server.database.pool.query(
            'delete from users where id = any($1::uuid[])',
            [createdUserIds],
          )
        }
      }
      await server.close()
    }
  }, 30_000)
})
