import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { buildServer } from '../dist/server.js'

const databaseUrl = process.env.TEST_DATABASE_URL

describe.skipIf(!databaseUrl)('authentication flow integration', () => {
  it('checks handles and lets the database resolve concurrent registrations', async () => {
    process.env.DATABASE_URL = databaseUrl
    process.env.OUTBOX_ENABLED = 'false'
    const app = await buildServer({ logger: false })
    const suffix = uuidv7().replaceAll('-', '').slice(-10)
    const handle = `Race_${suffix}`
    const payload = {
      birthDate: '2000-02-29',
      displayName: 'Race Tester',
      handle,
      locale: 'pl' as const,
      password: 'a long and memorable test password',
    }
    const createdIds: string[] = []

    try {
      const available = await app.inject({
        method: 'GET',
        url: `/api/auth/handle-availability?handle=${handle}`,
      })
      expect(available.json()).toMatchObject({ available: true })

      const results = await Promise.all([
        app.inject({
          method: 'POST',
          payload: { ...payload, email: `race-a-${suffix}@example.test` },
          url: '/api/auth/register',
        }),
        app.inject({
          method: 'POST',
          payload: {
            ...payload,
            email: `race-b-${suffix}@example.test`,
            handle: handle.toLowerCase(),
          },
          url: '/api/auth/register',
        }),
      ])
      expect(results.map((result) => result.statusCode).sort()).toEqual([
        201, 409,
      ])
      expect(
        results.find((result) => result.statusCode === 409)?.json(),
      ).toMatchObject({ error: { code: 'HANDLE_TAKEN' } })
      const successful = results.find((result) => result.statusCode === 201)!
      createdIds.push(successful.json().user.id as string)

      const taken = await app.inject({
        method: 'GET',
        url: `/api/auth/handle-availability?handle=${handle.toUpperCase()}`,
      })
      expect(taken.json()).toMatchObject({ available: false })
      const settings = await app.inject({
        headers: {
          authorization: `Bearer ${successful.json().tokens.accessToken}`,
        },
        method: 'GET',
        url: '/api/users/@me/settings',
      })
      expect(settings.json()).toMatchObject({ locale: 'pl' })
      const wrongPassword = await app.inject({
        method: 'POST',
        payload: {
          email: successful.json().user.email,
          password: 'definitely not the password',
        },
        url: '/api/auth/login',
      })
      expect(wrongPassword.statusCode).toBe(401)
      expect(wrongPassword.json()).toMatchObject({
        error: { message: 'Invalid email or password' },
      })
    } finally {
      if (createdIds.length)
        await app.database?.pool.query(
          'delete from users where id = any($1::uuid[])',
          [createdIds],
        )
      await app.close()
    }
  }, 30_000)
})
