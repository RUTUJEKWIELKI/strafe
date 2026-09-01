import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { buildServer } from '../dist/server.js'

const databaseUrl = process.env.TEST_DATABASE_URL

describe.skipIf(!databaseUrl)('account security integration', () => {
  it('tracks devices and enforces one-time account security challenges', async () => {
    process.env.DATABASE_URL = databaseUrl
    process.env.AUTH_JWT_SECRET =
      process.env.AUTH_JWT_SECRET ?? 'integration-test-secret-at-least-32-chars'
    process.env.OUTBOX_ENABLED = 'false'
    process.env.NODE_ENV = 'test'

    const app = await buildServer({ logger: false })
    const suffix = uuidv7().replaceAll('-', '').slice(-12)
    const email = `security-${suffix}@example.test`
    const changedEmail = `changed-${suffix}@example.test`
    const firstPassword = 'correct horse battery staple'
    const secondPassword = 'a different strong password'
    const finalPassword = 'a final secure password'
    let userId: string | null = null

    const deviceHeaders = (name: string) => ({
      'user-agent': `StrafeIntegration/${name}`,
      'x-strafe-device-name': name,
      'x-strafe-device-platform': 'test',
    })
    const auth = (token: string) => ({ authorization: `Bearer ${token}` })

    try {
      const registration = await app.inject({
        headers: deviceHeaders('Laptop'),
        method: 'POST',
        payload: {
          displayName: 'Security Test',
          email,
          handle: `security_${suffix}`,
          password: firstPassword,
        },
        url: '/api/auth/register',
      })
      expect(registration.statusCode, registration.body).toBe(201)
      const registered = registration.json()
      userId = registered.user.id as string
      const firstToken = registered.tokens.accessToken as string

      const login = await app.inject({
        headers: deviceHeaders('Phone'),
        method: 'POST',
        payload: { email, password: firstPassword },
        url: '/api/auth/login',
      })
      expect(login.statusCode, login.body).toBe(200)
      const secondToken = login.json().tokens.accessToken as string

      const sessions = await app.inject({
        headers: auth(firstToken),
        method: 'GET',
        url: '/api/users/@me/sessions',
      })
      expect(sessions.statusCode, sessions.body).toBe(200)
      expect(sessions.json().sessions).toHaveLength(2)
      expect(
        sessions
          .json()
          .sessions.map(
            (session: { device: { name: string } }) => session.device.name,
          ),
      ).toEqual(expect.arrayContaining(['Laptop', 'Phone']))

      const phoneSession = sessions
        .json()
        .sessions.find(
          (session: { device: { name: string }; id: string }) =>
            session.device.name === 'Phone',
        ) as { id: string }
      const revoked = await app.inject({
        headers: auth(firstToken),
        method: 'DELETE',
        url: `/api/users/@me/sessions/${phoneSession.id}`,
      })
      expect(revoked.statusCode, revoked.body).toBe(200)

      const revokedDeviceRequest = await app.inject({
        headers: auth(secondToken),
        method: 'GET',
        url: '/api/users/@me',
      })
      expect(revokedDeviceRequest.statusCode).toBe(401)

      const changedPassword = await app.inject({
        headers: auth(firstToken),
        method: 'POST',
        payload: {
          currentPassword: firstPassword,
          newPassword: secondPassword,
        },
        url: '/api/users/@me/password',
      })
      expect(changedPassword.statusCode, changedPassword.body).toBe(200)

      const verificationRequest = await app.inject({
        headers: auth(firstToken),
        method: 'POST',
        url: '/api/users/@me/email/verification',
      })
      expect(verificationRequest.statusCode, verificationRequest.body).toBe(202)
      const verificationToken = verificationRequest.json().testToken as string
      const verification = await app.inject({
        method: 'POST',
        payload: { token: verificationToken },
        url: '/api/auth/email/verify',
      })
      expect(verification.statusCode, verification.body).toBe(200)

      const resetRequest = await app.inject({
        method: 'POST',
        payload: { email },
        url: '/api/auth/password/reset/request',
      })
      expect(resetRequest.statusCode, resetRequest.body).toBe(202)
      const resetToken = resetRequest.json().testToken as string
      const reset = await app.inject({
        method: 'POST',
        payload: { newPassword: finalPassword, token: resetToken },
        url: '/api/auth/password/reset/complete',
      })
      expect(reset.statusCode, reset.body).toBe(200)
      const replay = await app.inject({
        method: 'POST',
        payload: { newPassword: finalPassword, token: resetToken },
        url: '/api/auth/password/reset/complete',
      })
      expect(replay.statusCode).toBe(400)

      const finalLogin = await app.inject({
        headers: deviceHeaders('Recovery device'),
        method: 'POST',
        payload: { email, password: finalPassword },
        url: '/api/auth/login',
      })
      expect(finalLogin.statusCode, finalLogin.body).toBe(200)
      const finalToken = finalLogin.json().tokens.accessToken as string

      const emailChange = await app.inject({
        headers: auth(finalToken),
        method: 'POST',
        payload: { newEmail: changedEmail, password: finalPassword },
        url: '/api/users/@me/email/change',
      })
      expect(emailChange.statusCode, emailChange.body).toBe(202)
      const emailToken = emailChange.json().testToken as string
      const emailConfirmation = await app.inject({
        method: 'POST',
        payload: { token: emailToken },
        url: '/api/auth/email/change/confirm',
      })
      expect(emailConfirmation.statusCode, emailConfirmation.body).toBe(200)

      const changedEmailLogin = await app.inject({
        method: 'POST',
        payload: { email: changedEmail, password: finalPassword },
        url: '/api/auth/login',
      })
      expect(changedEmailLogin.statusCode, changedEmailLogin.body).toBe(200)
      const securityEvents = await app.inject({
        headers: auth(changedEmailLogin.json().tokens.accessToken as string),
        method: 'GET',
        url: '/api/users/@me/security-events',
      })
      expect(securityEvents.statusCode, securityEvents.body).toBe(200)
      expect(
        securityEvents
          .json()
          .events.map((entry: { action: string }) => entry.action),
      ).toEqual(
        expect.arrayContaining([
          'account.password_changed',
          'account.password_reset_completed',
          'account.email_verified',
          'account.email_changed',
          'account.session_created',
        ]),
      )
    } finally {
      if (app.database && userId) {
        const notificationIds = await app.database.pool.query<{ id: string }>(
          'select id from notifications where user_id = $1',
          [userId],
        )
        const aggregateIds = [
          userId,
          ...notificationIds.rows.map((row) => row.id),
        ]
        await app.database.pool.query(
          'delete from outbox_events where aggregate_id = any($1::uuid[]) or payload::text like $2',
          [aggregateIds, `%${userId}%`],
        )
        await app.database.pool.query(
          'delete from audit_log where actor_id = $1 or target_id = $1',
          [userId],
        )
        await app.database.pool.query('delete from users where id = $1', [
          userId,
        ])
      }
      await app.close()
    }
  }, 60_000)
})
