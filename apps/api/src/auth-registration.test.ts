import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildServer } from '../dist/server.js'
import { isAtLeastThirteen } from './modules/auth/auth.service.js'

let server: Awaited<ReturnType<typeof buildServer>>

beforeAll(async () => {
  server = await buildServer({ logger: false })
}, 30_000)
afterAll(async () => server.close())

describe('registration age validation', () => {
  const now = new Date('2026-09-07T12:00:00.000Z')

  it('rejects a user who has not reached their thirteenth birthday', () => {
    expect(isAtLeastThirteen('2013-09-08', now)).toBe(false)
  })

  it('accepts a user on their thirteenth birthday', () => {
    expect(isAtLeastThirteen('2013-09-07', now)).toBe(true)
  })

  it('rejects invalid and future dates', () => {
    expect(isAtLeastThirteen('2013-02-31', now)).toBe(false)
    expect(isAtLeastThirteen('2030-01-01', now)).toBe(false)
  })

  it('rejects an underage registration before database access', async () => {
    const response = await server.inject({
      method: 'POST',
      payload: {
        birthDate: '2015-01-01',
        displayName: 'Young User',
        email: 'young@example.test',
        handle: 'young_user',
        locale: 'en',
        password: 'a sufficiently long password',
      },
      url: '/api/auth/register',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      error: { code: 'MINIMUM_AGE_REQUIRED' },
    })
  })

  it('rejects an impossible birth date at request validation', async () => {
    const response = await server.inject({
      method: 'POST',
      payload: {
        birthDate: '2013-02-31',
        displayName: 'Invalid Date',
        email: 'invalid-date@example.test',
        handle: 'invalid_date',
        locale: 'en',
        password: 'a sufficiently long password',
      },
      url: '/api/auth/register',
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    })
  })
})
