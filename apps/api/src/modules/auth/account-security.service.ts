import type {
  ChangePasswordBody,
  CompletePasswordResetBody,
  RequestEmailChangeBody,
} from '@strafe/shared'
import { argon2id, hash, verify } from 'argon2'
import { and, desc, eq, gt, isNull, lt, ne, or } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  auditLog,
  authChallenges,
  authIdentities,
  notifications,
  outboxEvents,
  userDevices,
  userSessions,
  users,
} from '../../db/schema.js'
import { decodeCursor, encodeCursor } from '../../lib/cursor.js'
import { isPostgresError, requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
} from '../../lib/errors.js'
import {
  createId,
  createOpaqueToken,
  hashSecret,
  normalizeEmail,
} from '../../lib/ids.js'
import type { AuthContext } from './auth.service.js'

type ChallengeType = 'email_change' | 'email_verification' | 'password_reset'
type DatabaseTransaction = Parameters<
  Parameters<ReturnType<typeof requireDatabase>['db']['transaction']>[0]
>[0]

const passwordHashOptions = {
  hashLength: 32,
  memoryCost: 65_536,
  parallelism: 1,
  timeCost: 3,
  type: argon2id,
} as const

export class AccountSecurityService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async listSessions(context: AuthContext) {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select({
        city: userSessions.city,
        countryCode: userSessions.countryCode,
        createdAt: userSessions.createdAt,
        deviceId: userDevices.id,
        deviceName: userDevices.name,
        expiresAt: userSessions.expiresAt,
        id: userSessions.id,
        ipAddress: userSessions.ipAddress,
        lastSeenAt: userSessions.lastUsedAt,
        platform: userDevices.platform,
        trustedAt: userDevices.trustedAt,
        userAgent: userSessions.userAgent,
      })
      .from(userSessions)
      .leftJoin(userDevices, eq(userDevices.id, userSessions.deviceId))
      .where(
        and(
          eq(userSessions.userId, context.userId),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(userSessions.lastUsedAt))

    return {
      sessions: rows.map((row) => ({
        city: row.city,
        countryCode: row.countryCode,
        createdAt: row.createdAt.toISOString(),
        current: row.id === context.sessionId,
        device: {
          id: row.deviceId ?? row.id,
          name: row.deviceName ?? 'Unknown device',
          platform: row.platform ?? 'unknown',
          trustedAt: row.trustedAt?.toISOString() ?? null,
        },
        expiresAt: row.expiresAt.toISOString(),
        id: row.id,
        ipAddress: row.ipAddress,
        lastSeenAt: row.lastSeenAt.toISOString(),
        userAgent: row.userAgent,
      })),
    }
  }

  async revokeSession(
    context: AuthContext,
    sessionId: string,
  ): Promise<number> {
    const { db } = requireDatabase(this.#app)
    const revoked = await db.transaction(async (tx) => {
      const rows = await tx
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(userSessions.id, sessionId),
            eq(userSessions.userId, context.userId),
            isNull(userSessions.revokedAt),
          ),
        )
        .returning({ id: userSessions.id })
      if (rows.length > 0) {
        await this.#securityEvent(
          tx,
          context.userId,
          'account.session_revoked',
          {
            sessionId,
          },
        )
      }
      return rows.length
    })
    if (revoked === 0) throw new NotFoundError('Active session not found')
    return revoked
  }

  async revokeAll(context: AuthContext, keepCurrent: boolean): Promise<number> {
    const { db } = requireDatabase(this.#app)
    return db.transaction(async (tx) => {
      const conditions = [
        eq(userSessions.userId, context.userId),
        isNull(userSessions.revokedAt),
      ]
      if (keepCurrent) conditions.push(ne(userSessions.id, context.sessionId))
      const revoked = await tx
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(and(...conditions))
        .returning({ id: userSessions.id })
      await this.#securityEvent(
        tx,
        context.userId,
        'account.sessions_revoked',
        { count: revoked.length, keepCurrent },
      )
      return revoked.length
    })
  }

  async changePassword(context: AuthContext, input: ChangePasswordBody) {
    const { db } = requireDatabase(this.#app)
    const [identity] = await db
      .select({ passwordHash: authIdentities.passwordHash })
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.userId, context.userId),
          eq(authIdentities.provider, 'local'),
        ),
      )
      .limit(1)
    if (
      !identity?.passwordHash ||
      !(await verify(identity.passwordHash, input.currentPassword))
    ) {
      throw new UnauthorizedError('Current password is incorrect')
    }
    if (await verify(identity.passwordHash, input.newPassword)) {
      throw new BadRequestError(
        'New password must differ from the current password',
        'PASSWORD_UNCHANGED',
      )
    }
    const passwordHash = await hash(input.newPassword, passwordHashOptions)
    const revoked = await db.transaction(async (tx) => {
      await tx
        .update(authIdentities)
        .set({ passwordHash, updatedAt: new Date() })
        .where(
          and(
            eq(authIdentities.userId, context.userId),
            eq(authIdentities.provider, 'local'),
          ),
        )
      const rows = await tx
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(userSessions.userId, context.userId),
            ne(userSessions.id, context.sessionId),
            isNull(userSessions.revokedAt),
          ),
        )
        .returning({ id: userSessions.id })
      await this.#securityEvent(
        tx,
        context.userId,
        'account.password_changed',
        { revokedSessions: rows.length },
        true,
      )
      return rows.length
    })
    return { revokedSessions: revoked, updated: true as const }
  }

  async requestPasswordReset(emailInput: string) {
    const email = normalizeEmail(emailInput)
    const { db } = requireDatabase(this.#app)
    const [user] = await db
      .select({ email: users.email, id: users.id })
      .from(users)
      .innerJoin(
        authIdentities,
        and(
          eq(authIdentities.userId, users.id),
          eq(authIdentities.provider, 'local'),
        ),
      )
      .where(
        and(
          eq(users.email, email),
          eq(users.status, 'active'),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)
    if (!user) return { accepted: true as const }
    if (
      !this.#app.mailService.configured &&
      this.#app.config.NODE_ENV !== 'test'
    ) {
      this.#app.log.warn('Password reset requested while SMTP is unavailable')
      return { accepted: true as const }
    }
    const token = await this.#createChallenge(user.id, 'password_reset')
    await this.#app.mailService.sendChallenge(
      'password_reset',
      user.email,
      token,
    )
    return {
      accepted: true as const,
      ...(this.#app.config.NODE_ENV === 'test' ? { testToken: token } : {}),
    }
  }

  async completePasswordReset(input: CompletePasswordResetBody) {
    const passwordHash = await hash(input.newPassword, passwordHashOptions)
    await this.#consumeChallenge(
      input.token,
      'password_reset',
      async (tx, challenge) => {
        await tx
          .update(authIdentities)
          .set({ passwordHash, updatedAt: new Date() })
          .where(
            and(
              eq(authIdentities.userId, challenge.userId),
              eq(authIdentities.provider, 'local'),
            ),
          )
        await tx
          .update(userSessions)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(userSessions.userId, challenge.userId),
              isNull(userSessions.revokedAt),
            ),
          )
        await this.#securityEvent(
          tx,
          challenge.userId,
          'account.password_reset_completed',
          {},
          true,
        )
      },
    )
    return { accepted: true as const }
  }

  async requestEmailVerification(userId: string) {
    const { db } = requireDatabase(this.#app)
    const [user] = await db
      .select({ email: users.email, verifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user) throw new NotFoundError('User not found')
    if (user.verifiedAt) return { accepted: true as const }
    this.#requireMail()
    const token = await this.#createChallenge(userId, 'email_verification')
    await this.#app.mailService.sendChallenge(
      'email_verification',
      user.email,
      token,
    )
    return {
      accepted: true as const,
      ...(this.#app.config.NODE_ENV === 'test' ? { testToken: token } : {}),
    }
  }

  async verifyEmail(token: string) {
    await this.#consumeChallenge(
      token,
      'email_verification',
      async (tx, challenge) => {
        await tx
          .update(users)
          .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, challenge.userId))
        await this.#securityEvent(
          tx,
          challenge.userId,
          'account.email_verified',
          {},
          true,
        )
      },
    )
    return { accepted: true as const }
  }

  async requestEmailChange(
    context: AuthContext,
    input: RequestEmailChangeBody,
  ) {
    const { db } = requireDatabase(this.#app)
    const [identity] = await db
      .select({
        currentEmail: users.email,
        passwordHash: authIdentities.passwordHash,
      })
      .from(authIdentities)
      .innerJoin(users, eq(users.id, authIdentities.userId))
      .where(
        and(
          eq(authIdentities.userId, context.userId),
          eq(authIdentities.provider, 'local'),
        ),
      )
      .limit(1)
    if (
      !identity?.passwordHash ||
      !(await verify(identity.passwordHash, input.password))
    ) {
      throw new UnauthorizedError('Password is incorrect')
    }
    const newEmail = normalizeEmail(input.newEmail)
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, newEmail), ne(users.id, context.userId)))
      .limit(1)
    if (taken)
      throw new ConflictError('This email is already in use', 'EMAIL_TAKEN')
    this.#requireMail()
    const token = await this.#createChallenge(
      context.userId,
      'email_change',
      newEmail,
    )
    await this.#app.mailService.sendChallenge('email_change', newEmail, token)
    await this.#app.mailService
      .sendNotification(
        identity.currentEmail,
        'Zażądano zmiany adresu e-mail Strafe',
        `Na koncie rozpoczęto zmianę adresu e-mail na ${newEmail}. Jeśli to nie Ty, natychmiast zmień hasło i wyloguj pozostałe sesje.`,
      )
      .catch((error: unknown) => {
        this.#app.log.warn(
          { err: error, userId: context.userId },
          'Old-address email change alert failed',
        )
      })
    return {
      accepted: true as const,
      ...(this.#app.config.NODE_ENV === 'test' ? { testToken: token } : {}),
    }
  }

  async confirmEmailChange(token: string) {
    try {
      await this.#consumeChallenge(
        token,
        'email_change',
        async (tx, challenge) => {
          if (!challenge.pendingValue) {
            throw new BadRequestError('Email change challenge is invalid')
          }
          await tx
            .update(users)
            .set({
              email: challenge.pendingValue,
              emailVerifiedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(users.id, challenge.userId))
          await tx
            .update(authIdentities)
            .set({
              providerSubject: challenge.pendingValue,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(authIdentities.userId, challenge.userId),
                eq(authIdentities.provider, 'local'),
              ),
            )
          await tx
            .update(userSessions)
            .set({ revokedAt: new Date() })
            .where(
              and(
                eq(userSessions.userId, challenge.userId),
                isNull(userSessions.revokedAt),
              ),
            )
          await this.#securityEvent(
            tx,
            challenge.userId,
            'account.email_changed',
            {},
            true,
          )
        },
      )
    } catch (error) {
      if (isPostgresError(error) && error.code === '23505') {
        throw new ConflictError('This email is already in use', 'EMAIL_TAKEN')
      }
      throw error
    }
    return { accepted: true as const }
  }

  async listSecurityEvents(userId: string, limit: number, before?: string) {
    const { db } = requireDatabase(this.#app)
    const cursor = before ? decodeCursor(before) : null
    const conditions = [
      isNull(auditLog.serverId),
      or(eq(auditLog.actorId, userId), eq(auditLog.targetId, userId))!,
    ]
    if (cursor) {
      const cursorDate = new Date(cursor.createdAt)
      conditions.push(
        or(
          lt(auditLog.createdAt, cursorDate),
          and(eq(auditLog.createdAt, cursorDate), lt(auditLog.id, cursor.id)),
        )!,
      )
    }
    const rows = await db
      .select()
      .from(auditLog)
      .where(and(...conditions))
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(limit + 1)
    const page = rows.slice(0, limit)
    const last = page.at(-1)
    return {
      events: page.map((event) => ({
        action: event.action,
        createdAt: event.createdAt.toISOString(),
        id: event.id,
        metadata: event.metadata,
      })),
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    }
  }

  async #createChallenge(
    userId: string,
    type: ChallengeType,
    pendingValue?: string,
  ): Promise<string> {
    const { db } = requireDatabase(this.#app)
    const token = createOpaqueToken()
    const now = new Date()
    await db.transaction(async (tx) => {
      await tx
        .update(authChallenges)
        .set({ usedAt: now })
        .where(
          and(
            eq(authChallenges.userId, userId),
            eq(authChallenges.type, type),
            isNull(authChallenges.usedAt),
          ),
        )
      await tx.insert(authChallenges).values({
        expiresAt: new Date(
          now.getTime() + this.#app.config.AUTH_CHALLENGE_TTL_SECONDS * 1_000,
        ),
        id: createId(),
        pendingValue,
        tokenHash: hashSecret(token),
        type,
        userId,
      })
    })
    return token
  }

  async #consumeChallenge(
    token: string,
    type: ChallengeType,
    mutate: (
      tx: DatabaseTransaction,
      challenge: typeof authChallenges.$inferSelect,
    ) => Promise<void>,
  ) {
    const { db } = requireDatabase(this.#app)
    return db.transaction(async (tx) => {
      const [challenge] = await tx
        .select()
        .from(authChallenges)
        .where(
          and(
            eq(authChallenges.tokenHash, hashSecret(token)),
            eq(authChallenges.type, type),
            isNull(authChallenges.usedAt),
            gt(authChallenges.expiresAt, new Date()),
          ),
        )
        .limit(1)
        .for('update')
      if (!challenge) {
        throw new BadRequestError(
          'The confirmation token is invalid or expired',
          'INVALID_AUTH_CHALLENGE',
        )
      }
      await mutate(tx, challenge)
      await tx
        .update(authChallenges)
        .set({ attempts: challenge.attempts + 1, usedAt: new Date() })
        .where(eq(authChallenges.id, challenge.id))
      return challenge
    })
  }

  async #securityEvent(
    tx: DatabaseTransaction,
    userId: string,
    action: string,
    metadata: Record<string, unknown>,
    notify = false,
  ) {
    await tx.insert(auditLog).values({
      action,
      actorId: userId,
      id: createId(),
      metadata,
      targetId: userId,
      targetType: 'user',
    })
    if (!notify) return
    const notificationId = createId()
    await tx.insert(notifications).values({
      data: metadata,
      id: notificationId,
      type: action,
      userId,
    })
    await tx.insert(outboxEvents).values({
      aggregateId: notificationId,
      aggregateType: 'notification',
      id: createId(),
      payload: {
        audience: { userIds: [userId] },
        data: { notificationId },
      },
      topic: 'notification.created',
    })
  }

  #requireMail(): void {
    if (
      !this.#app.mailService.configured &&
      this.#app.config.NODE_ENV !== 'test'
    ) {
      throw new ServiceUnavailableError('Email delivery is not configured')
    }
  }
}
