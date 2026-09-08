import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { buildServer } from '../dist/server.js'

const databaseUrl = process.env.TEST_DATABASE_URL

describe.skipIf(!databaseUrl)('bot API integration', () => {
  it('creates, installs, scopes, rotates, and revokes a bot credential', async () => {
    process.env.DATABASE_URL = databaseUrl
    process.env.OUTBOX_ENABLED = 'false'
    const app = await buildServer({ logger: false })
    const suffix = uuidv7().replaceAll('-', '').slice(-10)
    const userIds: string[] = []

    try {
      const registration = await app.inject({
        method: 'POST',
        payload: {
          birthDate: '1990-01-01',
          displayName: 'Bot Owner',
          email: `bot-owner-${suffix}@example.test`,
          handle: `bot_owner_${suffix}`,
          locale: 'en',
          password: 'correct horse battery staple',
        },
        url: '/api/auth/register',
      })
      expect(registration.statusCode, registration.body).toBe(201)
      const owner = registration.json()
      userIds.push(owner.user.id as string)
      const authorization = {
        authorization: `Bearer ${owner.tokens.accessToken}`,
      }

      const server = await app.inject({
        headers: authorization,
        method: 'POST',
        payload: { name: 'Bot integration server' },
        url: '/api/servers',
      })
      expect(server.statusCode, server.body).toBe(201)

      const created = await app.inject({
        headers: authorization,
        method: 'POST',
        payload: {
          description: 'Integration test bot',
          handle: `release_bot_${suffix}`,
          name: 'Release Bot',
          scopes: ['servers:read'],
        },
        url: '/api/bots',
      })
      expect(created.statusCode, created.body).toBe(201)
      expect(created.json().bot).toMatchObject({
        isPublic: false,
        name: 'Release Bot',
      })
      const bot = created.json()
      userIds.push(bot.bot.botUserId as string)

      const installed = await app.inject({
        headers: authorization,
        method: 'POST',
        url: `/api/servers/${server.json().server.id}/bots/${bot.bot.id}`,
      })
      expect(installed.statusCode, installed.body).toBe(200)
      expect(installed.json()).toMatchObject({ installed: true })

      const botAuthorization = { authorization: `Bearer ${bot.token}` }
      const botServers = await app.inject({
        headers: botAuthorization,
        method: 'GET',
        url: '/api/users/@me/servers',
      })
      expect(botServers.statusCode, botServers.body).toBe(200)
      const forbidden = await app.inject({
        headers: botAuthorization,
        method: 'GET',
        url: `/api/servers/${server.json().server.id}/channels`,
      })
      expect(forbidden.statusCode).toBe(403)

      const rotated = await app.inject({
        headers: authorization,
        method: 'POST',
        payload: { scopes: ['servers:read', 'channels:read'] },
        url: `/api/bots/${bot.bot.id}/token`,
      })
      expect(rotated.statusCode, rotated.body).toBe(200)
      expect(rotated.json().token).toMatch(/^strafe_bot_/u)
      expect(
        (
          await app.inject({
            headers: botAuthorization,
            method: 'GET',
            url: '/api/users/@me',
          })
        ).statusCode,
      ).toBe(401)

      const revoked = await app.inject({
        headers: authorization,
        method: 'DELETE',
        url: `/api/bots/${bot.bot.id}/token`,
      })
      expect(revoked.json()).toEqual({ revoked: true })
      expect(
        (
          await app.inject({
            headers: { authorization: `Bearer ${rotated.json().token}` },
            method: 'GET',
            url: '/api/users/@me',
          })
        ).statusCode,
      ).toBe(401)
    } finally {
      if (userIds.length > 0) {
        await app.database?.pool.query(
          'delete from users where id = any($1::uuid[])',
          [userIds],
        )
      }
      await app.close()
    }
  }, 30_000)
})
