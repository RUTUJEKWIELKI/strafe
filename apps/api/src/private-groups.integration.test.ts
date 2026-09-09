import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'
import { buildServer } from '../dist/server.js'

const databaseUrl = process.env.TEST_DATABASE_URL

describe.skipIf(!databaseUrl)('private group management integration', () => {
  it('enforces ownership and rotates E2EE epochs for membership changes', async () => {
    process.env.DATABASE_URL = databaseUrl
    process.env.OUTBOX_ENABLED = 'false'
    const app = await buildServer({ logger: false })
    const suffix = uuidv7().replaceAll('-', '').slice(-8)
    const users = await Promise.all(
      ['owner', 'member', 'other'].map(async (name) => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/auth/register',
          payload: {
            birthDate: '1990-01-01',
            displayName: name,
            email: `${name}-${suffix}@example.test`,
            handle: `${name}_${suffix}`,
            locale: 'en',
            password: 'correct horse battery staple',
          },
        })
        expect(response.statusCode).toBe(201)
        return response.json()
      }),
    )
    const auth = (index: number) => ({
      authorization: `Bearer ${users[index].tokens.accessToken}`,
    })
    try {
      const created = await app.inject({
        headers: auth(0),
        method: 'POST',
        url: '/api/users/@me/groups',
        payload: { name: 'Private team', memberIds: [users[1].user.id] },
      })
      expect(created.statusCode).toBe(201)
      const groupId = created.json().id as string
      const forbidden = await app.inject({
        headers: auth(1),
        method: 'PATCH',
        url: `/api/conversations/${groupId}`,
        payload: { name: 'Hijacked' },
      })
      expect(forbidden.statusCode).toBe(403)
      const added = await app.inject({
        headers: auth(0),
        method: 'POST',
        url: `/api/conversations/${groupId}/members`,
        payload: { userId: users[2].user.id },
      })
      expect(added.json()).toMatchObject({ encryptionEpoch: 2 })
      const transferred = await app.inject({
        headers: auth(0),
        method: 'POST',
        url: `/api/conversations/${groupId}/ownership`,
        payload: { userId: users[1].user.id },
      })
      expect(transferred.json()).toMatchObject({ encryptionEpoch: 3 })
      const removed = await app.inject({
        headers: auth(1),
        method: 'DELETE',
        url: `/api/conversations/${groupId}/members/${users[2].user.id}`,
      })
      expect(removed.json()).toMatchObject({ encryptionEpoch: 4 })
      const access = await app.inject({
        headers: auth(2),
        method: 'GET',
        url: `/api/channels/${groupId}/messages?limit=10`,
      })
      expect(access.statusCode).toBe(403)
    } finally {
      await app.database?.pool.query(
        'delete from users where id = any($1::uuid[])',
        [users.map((user) => user.user.id)],
      )
      await app.close()
    }
  }, 30_000)
})
