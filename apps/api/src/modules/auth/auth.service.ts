import type {
  AuthResponse,
  CurrentUser,
  LoginBody,
  RegisterBody,
} from '@strafe/shared'
import { hash, verify, argon2id } from 'argon2'
import { and, eq, gt, isNull } from 'drizzle-orm'
import type { FastifyInstance, FastifyRequest } from 'fastify'

import {
  auditLog,
  authIdentities,
  notifications,
  outboxEvents,
  userDevices,
  userProfiles,
  userSessions,
  userSettings,
  users,
} from '../../db/schema.js'
import { requireDatabase, isPostgresError } from '../../lib/database.js'
import { ConflictError, UnauthorizedError } from '../../lib/errors.js'
import {
  createId,
  createOpaqueToken,
  hashSecret,
  normalizeEmail,
  normalizeHandle,
} from '../../lib/ids.js'

export interface AuthContext {
  actorType: 'bot' | 'user'
  botId?: string
  scopes?: string[]
  sessionId: string
  userId: string
}

interface AccessTokenPayload {
  sid: string
  sub: string
  typ: 'access'
}

interface UserProjection {
  avatarFileId: string | null
  createdAt: Date
  displayName: string
  email: string
  emailVerifiedAt: Date | null
  handle: string
  id: string
  status: string
}

interface SessionTokens {
  accessToken: string
  accessTokenExpiresAt: Date
  deviceId: string
  refreshToken: string
  refreshTokenExpiresAt: Date
  sessionId: string
}

export interface SessionMetadata {
  city?: string
  countryCode?: string
  deviceId?: string
  deviceName: string
  ipAddress: string
  platform: string
  userAgent?: string
}

function toCurrentUser(user: UserProjection): CurrentUser {
  return {
    avatarUrl: null,
    createdAt: user.createdAt.toISOString(),
    displayName: user.displayName,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    handle: user.handle,
    id: user.id,
    status: user.status as CurrentUser['status'],
  }
}

export class AuthService {
  readonly #app: FastifyInstance
  readonly #dummyPasswordHash: string

  constructor(app: FastifyInstance, dummyPasswordHash: string) {
    this.#app = app
    this.#dummyPasswordHash = dummyPasswordHash
  }

  async register(
    input: RegisterBody,
    metadata: SessionMetadata,
  ): Promise<AuthResponse> {
    const { db } = requireDatabase(this.#app)
    const email = normalizeEmail(input.email)
    const normalizedHandle = normalizeHandle(input.handle)
    const passwordHash = await hash(input.password, {
      hashLength: 32,
      memoryCost: 65_536,
      parallelism: 1,
      timeCost: 3,
      type: argon2id,
    })
    const userId = createId()
    const identityId = createId()
    const deviceId = createId()
    const session = this.#newSession(userId, deviceId)

    try {
      const user = await db.transaction(async (tx) => {
        const [createdUser] = await tx
          .insert(users)
          .values({
            email,
            handle: input.handle.trim(),
            id: userId,
            normalizedHandle,
          })
          .returning()

        if (!createdUser) {
          throw new Error('User insert returned no row')
        }

        const [profile] = await tx
          .insert(userProfiles)
          .values({
            displayName: input.displayName.trim(),
            userId,
          })
          .returning()

        if (!profile) {
          throw new Error('User profile insert returned no row')
        }

        await tx.insert(userSettings).values({ userId })
        await tx.insert(authIdentities).values({
          id: identityId,
          passwordHash,
          provider: 'local',
          providerSubject: email,
          userId,
        })
        await tx.insert(userDevices).values({
          city: metadata.city,
          countryCode: metadata.countryCode,
          id: deviceId,
          lastIpAddress: metadata.ipAddress,
          name: metadata.deviceName,
          platform: metadata.platform,
          userId,
        })
        await tx.insert(userSessions).values({
          city: metadata.city,
          countryCode: metadata.countryCode,
          deviceId,
          expiresAt: session.refreshTokenExpiresAt,
          id: session.sessionId,
          ipAddress: metadata.ipAddress,
          refreshTokenHash: hashSecret(session.refreshToken),
          ...(metadata.userAgent ? { userAgent: metadata.userAgent } : {}),
          userId,
        })
        await tx.insert(auditLog).values({
          action: 'account.registered',
          actorId: userId,
          id: createId(),
          metadata: { deviceId, ipAddress: metadata.ipAddress },
          targetId: userId,
          targetType: 'user',
        })
        await tx.insert(outboxEvents).values({
          aggregateId: userId,
          aggregateType: 'user',
          id: createId(),
          payload: {
            audience: { userIds: [userId] },
            data: { userId },
          },
          topic: 'user.created',
        })

        return {
          avatarFileId: profile.avatarFileId,
          createdAt: createdUser.createdAt,
          displayName: profile.displayName,
          email: createdUser.email,
          emailVerifiedAt: createdUser.emailVerifiedAt,
          handle: createdUser.handle,
          id: createdUser.id,
          status: createdUser.status,
        }
      })

      return this.#response(user, session)
    } catch (error) {
      if (isPostgresError(error) && error.code === '23505') {
        if (error.constraint === 'users_active_handle_unique') {
          throw new ConflictError(
            'This handle is already in use',
            'HANDLE_TAKEN',
          )
        }
        throw new ConflictError(
          'An account with this email already exists',
          'EMAIL_TAKEN',
        )
      }
      throw error
    }
  }

  async login(
    input: LoginBody,
    metadata: SessionMetadata,
  ): Promise<AuthResponse> {
    const { db } = requireDatabase(this.#app)
    const email = normalizeEmail(input.email)
    const [row] = await db
      .select({
        avatarFileId: userProfiles.avatarFileId,
        createdAt: users.createdAt,
        displayName: userProfiles.displayName,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        handle: users.handle,
        id: users.id,
        passwordHash: authIdentities.passwordHash,
        status: users.status,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .innerJoin(
        authIdentities,
        and(
          eq(authIdentities.userId, users.id),
          eq(authIdentities.provider, 'local'),
        ),
      )
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1)

    const passwordMatches = await verify(
      row?.passwordHash ?? this.#dummyPasswordHash,
      input.password,
    )

    if (!row || !passwordMatches || row.status !== 'active') {
      throw new UnauthorizedError('Invalid email or password')
    }

    const deviceId = await this.#resolveDevice(row.id, metadata)
    const session = this.#newSession(row.id, deviceId)
    await db.transaction(async (tx) => {
      await tx.insert(userSessions).values({
        city: metadata.city,
        countryCode: metadata.countryCode,
        deviceId,
        expiresAt: session.refreshTokenExpiresAt,
        id: session.sessionId,
        ipAddress: metadata.ipAddress,
        refreshTokenHash: hashSecret(session.refreshToken),
        ...(metadata.userAgent ? { userAgent: metadata.userAgent } : {}),
        userId: row.id,
      })
      const notificationId = createId()
      await tx.insert(notifications).values({
        data: {
          city: metadata.city ?? null,
          countryCode: metadata.countryCode ?? null,
          deviceId,
          ipAddress: metadata.ipAddress,
        },
        id: notificationId,
        type: 'security.new_login',
        userId: row.id,
      })
      await tx.insert(auditLog).values({
        action: 'account.session_created',
        actorId: row.id,
        id: createId(),
        metadata: { deviceId, ipAddress: metadata.ipAddress },
        targetId: session.sessionId,
        targetType: 'session',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: notificationId,
        aggregateType: 'notification',
        id: createId(),
        payload: {
          audience: { userIds: [row.id] },
          data: { notificationId },
        },
        topic: 'notification.created',
      })
    })

    return this.#response(row, session)
  }

  async refresh(
    refreshToken: string,
    metadata?: SessionMetadata,
  ): Promise<AuthResponse> {
    const { db } = requireDatabase(this.#app)
    const nextRefreshToken = createOpaqueToken()
    const now = new Date()
    const [session] = await db
      .update(userSessions)
      .set({
        ...(metadata
          ? {
              city: metadata.city,
              countryCode: metadata.countryCode,
              ipAddress: metadata.ipAddress,
              userAgent: metadata.userAgent,
            }
          : {}),
        lastUsedAt: now,
        previousRefreshTokenHash: hashSecret(refreshToken),
        refreshTokenHash: hashSecret(nextRefreshToken),
        rotatedAt: now,
      })
      .where(
        and(
          eq(userSessions.refreshTokenHash, hashSecret(refreshToken)),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, now),
        ),
      )
      .returning()

    if (!session) {
      const replayed = await db
        .update(userSessions)
        .set({ revokedAt: now })
        .where(
          and(
            eq(userSessions.previousRefreshTokenHash, hashSecret(refreshToken)),
            isNull(userSessions.revokedAt),
          ),
        )
        .returning({ id: userSessions.id })
      if (replayed.length > 0) {
        throw new UnauthorizedError(
          'Refresh token reuse was detected; the session was revoked',
        )
      }
      throw new UnauthorizedError('Refresh token is invalid or expired')
    }

    const user = await this.#getUser(session.userId)
    if (!user || user.status !== 'active') {
      await db
        .update(userSessions)
        .set({ revokedAt: now })
        .where(eq(userSessions.id, session.id))
      throw new UnauthorizedError('This session is no longer active')
    }

    if (session.deviceId) {
      await db
        .update(userDevices)
        .set({
          ...(metadata?.city ? { city: metadata.city } : {}),
          ...(metadata?.countryCode
            ? { countryCode: metadata.countryCode }
            : {}),
          ...(metadata?.ipAddress ? { lastIpAddress: metadata.ipAddress } : {}),
          lastSeenAt: now,
        })
        .where(eq(userDevices.id, session.deviceId))
    }

    return this.#response(user, {
      accessToken: this.#signAccessToken(session.userId, session.id),
      accessTokenExpiresAt: new Date(
        now.getTime() + this.#app.config.AUTH_ACCESS_TTL_SECONDS * 1_000,
      ),
      refreshToken: nextRefreshToken,
      refreshTokenExpiresAt: session.expiresAt,
      sessionId: session.id,
      deviceId: session.deviceId ?? session.id,
    })
  }

  async revoke(context: AuthContext, refreshToken?: string): Promise<boolean> {
    const { db } = requireDatabase(this.#app)
    const conditions = [eq(userSessions.id, context.sessionId)]
    if (refreshToken) {
      conditions.push(
        eq(userSessions.refreshTokenHash, hashSecret(refreshToken)),
      )
    }

    const revoked = await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(and(...conditions, isNull(userSessions.revokedAt)))
      .returning({ id: userSessions.id })

    return revoked.length > 0
  }

  async getCurrentUser(userId: string): Promise<CurrentUser> {
    const user = await this.#getUser(userId)
    if (!user) {
      throw new UnauthorizedError('The authenticated user no longer exists')
    }
    return toCurrentUser(user)
  }

  async authenticateRequest(request: FastifyRequest): Promise<AuthContext> {
    const authorization = request.headers.authorization
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : undefined
    if (token?.startsWith('strafe_bot_')) {
      const bot = await this.#app.botService.authenticate(token)
      return {
        actorType: 'bot',
        botId: bot.botId,
        scopes: bot.scopes,
        sessionId: bot.tokenId,
        userId: bot.userId,
      }
    }
    let payload: AccessTokenPayload
    try {
      payload = await request.jwtVerify<AccessTokenPayload>()
    } catch {
      throw new UnauthorizedError('Access token is invalid or expired')
    }

    return this.verifyAccessPayload(payload)
  }

  async verifyAccessToken(token: string): Promise<AuthContext> {
    if (token.startsWith('strafe_bot_')) {
      const bot = await this.#app.botService.authenticate(token)
      if (!bot.scopes.includes('servers:read')) {
        throw new UnauthorizedError(
          'Bot token requires the servers:read scope for gateway access',
        )
      }
      return {
        actorType: 'bot',
        botId: bot.botId,
        scopes: bot.scopes,
        sessionId: bot.tokenId,
        userId: bot.userId,
      }
    }
    let payload: AccessTokenPayload
    try {
      const decoded = this.#app.jwt.decode(token, { complete: true }) as {
        header?: { kid?: string }
      } | null
      const kid = decoded?.header?.kid
      const key = kid ? this.#app.jwtVerificationKeys.get(kid) : undefined
      if (!key) throw new Error('JWT signing key is not accepted')
      payload = this.#app.jwt.verify<AccessTokenPayload>(token, { key })
    } catch {
      throw new UnauthorizedError('Access token is invalid or expired')
    }
    return this.verifyAccessPayload(payload)
  }

  async verifyAccessPayload(payload: AccessTokenPayload): Promise<AuthContext> {
    if (
      payload.typ !== 'access' ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string'
    ) {
      throw new UnauthorizedError('Access token has an invalid payload')
    }

    const { db } = requireDatabase(this.#app)
    const [session] = await db
      .select({
        deviceId: userSessions.deviceId,
        id: userSessions.id,
        lastUsedAt: userSessions.lastUsedAt,
      })
      .from(userSessions)
      .innerJoin(users, eq(users.id, userSessions.userId))
      .where(
        and(
          eq(userSessions.id, payload.sid),
          eq(userSessions.userId, payload.sub),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
          eq(users.status, 'active'),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)

    if (!session) {
      throw new UnauthorizedError('This session is no longer active')
    }

    if (Date.now() - session.lastUsedAt.getTime() > 60_000) {
      const now = new Date()
      await db
        .update(userSessions)
        .set({ lastUsedAt: now })
        .where(eq(userSessions.id, session.id))
      if (session.deviceId) {
        await db
          .update(userDevices)
          .set({ lastSeenAt: now })
          .where(eq(userDevices.id, session.deviceId))
      }
    }

    return { actorType: 'user', sessionId: payload.sid, userId: payload.sub }
  }

  async #getUser(userId: string): Promise<UserProjection | null> {
    const { db } = requireDatabase(this.#app)
    const [row] = await db
      .select({
        avatarFileId: userProfiles.avatarFileId,
        createdAt: users.createdAt,
        displayName: userProfiles.displayName,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        handle: users.handle,
        id: users.id,
        status: users.status,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1)

    return row ?? null
  }

  async #resolveDevice(
    userId: string,
    metadata: SessionMetadata,
  ): Promise<string> {
    const { db } = requireDatabase(this.#app)
    if (metadata.deviceId) {
      const [existing] = await db
        .update(userDevices)
        .set({
          city: metadata.city,
          countryCode: metadata.countryCode,
          lastIpAddress: metadata.ipAddress,
          lastSeenAt: new Date(),
          name: metadata.deviceName,
          platform: metadata.platform,
        })
        .where(
          and(
            eq(userDevices.id, metadata.deviceId),
            eq(userDevices.userId, userId),
          ),
        )
        .returning({ id: userDevices.id })
      if (existing) return existing.id
    }

    const id = createId()
    await db.insert(userDevices).values({
      city: metadata.city,
      countryCode: metadata.countryCode,
      id,
      lastIpAddress: metadata.ipAddress,
      name: metadata.deviceName,
      platform: metadata.platform,
      userId,
    })
    return id
  }

  #newSession(userId: string, deviceId: string): SessionTokens {
    const now = Date.now()
    const sessionId = createId()
    return {
      accessToken: this.#signAccessToken(userId, sessionId),
      accessTokenExpiresAt: new Date(
        now + this.#app.config.AUTH_ACCESS_TTL_SECONDS * 1_000,
      ),
      deviceId,
      refreshToken: createOpaqueToken(),
      refreshTokenExpiresAt: new Date(
        now + this.#app.config.AUTH_REFRESH_TTL_SECONDS * 1_000,
      ),
      sessionId,
    }
  }

  #signAccessToken(userId: string, sessionId: string): string {
    return this.#app.jwt.sign(
      { sid: sessionId, sub: userId, typ: 'access' },
      {
        expiresIn: this.#app.config.AUTH_ACCESS_TTL_SECONDS,
        key: this.#app.jwtSigningKey.privateKey,
        kid: this.#app.jwtSigningKey.kid,
      },
    )
  }

  #response(user: UserProjection, session: SessionTokens): AuthResponse {
    return {
      tokens: {
        accessToken: session.accessToken,
        accessTokenExpiresAt: session.accessTokenExpiresAt.toISOString(),
        deviceId: session.deviceId,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt.toISOString(),
        sessionId: session.sessionId,
        tokenType: 'Bearer',
      },
      user: toCurrentUser(user),
    }
  }
}
