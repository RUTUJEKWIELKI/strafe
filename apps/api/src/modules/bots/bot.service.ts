import type { BotScope, CreateBotBody } from '@strafe/shared'
import { and, eq, gt, isNull, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  auditLog,
  botApplications,
  botTokens,
  serverMemberProfiles,
  serverMembers,
  servers,
  userProfiles,
  userSettings,
  users,
} from '../../db/schema.js'
import { requireDatabase, isPostgresError } from '../../lib/database.js'
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/errors.js'
import {
  createId,
  createOpaqueToken,
  hashSecret,
  normalizeHandle,
} from '../../lib/ids.js'

const TOKEN_PREFIX = 'strafe_bot_'
const DEFAULT_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1_000

export class BotService {
  readonly #activityUpdates = new Set<Promise<void>>()
  #closing = false

  constructor(private readonly app: FastifyInstance) {}

  async close() {
    this.#closing = true
    await Promise.allSettled([...this.#activityUpdates])
  }

  async create(ownerId: string, input: CreateBotBody) {
    const { db } = requireDatabase(this.app)
    const botId = createId()
    const botUserId = createId()
    const rawToken = `${TOKEN_PREFIX}${createOpaqueToken()}`
    try {
      const bot = await db.transaction(async (tx) => {
        await tx.insert(users).values({
          email: `bot-${botId}@bots.strafe.invalid`,
          handle: input.handle.trim(),
          id: botUserId,
          normalizedHandle: normalizeHandle(input.handle),
        })
        await tx
          .insert(userProfiles)
          .values({ displayName: input.name.trim(), userId: botUserId })
        await tx.insert(userSettings).values({ userId: botUserId })
        const [created] = await tx
          .insert(botApplications)
          .values({
            botUserId,
            description: input.description?.trim() || null,
            id: botId,
            name: input.name.trim(),
            ownerId,
          })
          .returning()
        await tx.insert(botTokens).values({
          botId,
          expiresAt: new Date(Date.now() + DEFAULT_TOKEN_TTL_MS),
          id: createId(),
          name: 'default',
          scopes: input.scopes,
          tokenHash: hashSecret(rawToken),
        })
        await tx.insert(auditLog).values({
          action: 'bot.created',
          actorId: ownerId,
          id: createId(),
          metadata: { scopes: input.scopes },
          targetId: botId,
          targetType: 'bot',
        })
        return created!
      })
      return { bot: this.present(bot), token: rawToken }
    } catch (error) {
      if (isPostgresError(error) && error.code === '23505') {
        throw new ConflictError(
          'This bot handle is already in use',
          'HANDLE_TAKEN',
        )
      }
      throw error
    }
  }

  async list(ownerId: string) {
    const { db } = requireDatabase(this.app)
    const rows = await db
      .select()
      .from(botApplications)
      .where(eq(botApplications.ownerId, ownerId))
    return rows.map((row) => this.present(row))
  }

  async rotate(ownerId: string, botId: string, scopes: BotScope[]) {
    const { db } = requireDatabase(this.app)
    const rawToken = `${TOKEN_PREFIX}${createOpaqueToken()}`
    await db.transaction(async (tx) => {
      const [bot] = await tx
        .select({ id: botApplications.id })
        .from(botApplications)
        .where(
          and(
            eq(botApplications.id, botId),
            eq(botApplications.ownerId, ownerId),
          ),
        )
        .limit(1)
      if (!bot) throw new NotFoundError('Bot application not found')
      await tx
        .update(botTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(botTokens.botId, botId), isNull(botTokens.revokedAt)))
      await tx.insert(botTokens).values({
        botId,
        expiresAt: new Date(Date.now() + DEFAULT_TOKEN_TTL_MS),
        id: createId(),
        name: 'default',
        scopes,
        tokenHash: hashSecret(rawToken),
      })
    })
    return rawToken
  }

  async install(ownerId: string, botId: string, serverId: string) {
    const { db } = requireDatabase(this.app)
    return db.transaction(async (tx) => {
      const [bot] = await tx
        .select({ userId: botApplications.botUserId })
        .from(botApplications)
        .where(
          and(
            eq(botApplications.id, botId),
            eq(botApplications.ownerId, ownerId),
          ),
        )
        .limit(1)
      const [server] = await tx
        .select({ id: servers.id })
        .from(servers)
        .where(
          and(
            eq(servers.id, serverId),
            eq(servers.ownerId, ownerId),
            isNull(servers.deletedAt),
          ),
        )
        .limit(1)
      if (!bot || !server)
        throw new NotFoundError('Bot application or owned server not found')
      const [existing] = await tx
        .select({ id: serverMembers.id, state: serverMembers.state })
        .from(serverMembers)
        .where(
          and(
            eq(serverMembers.serverId, serverId),
            eq(serverMembers.userId, bot.userId),
          ),
        )
        .limit(1)
      if (existing?.state === 'active')
        return { installed: false, memberId: existing.id }
      if (existing) {
        await tx
          .update(serverMembers)
          .set({ leftAt: null, state: 'active' })
          .where(eq(serverMembers.id, existing.id))
        await tx
          .update(servers)
          .set({ memberCount: sql`${servers.memberCount} + 1` })
          .where(eq(servers.id, serverId))
        return { installed: true, memberId: existing.id }
      }
      const memberId = createId()
      await tx
        .insert(serverMembers)
        .values({ id: memberId, serverId, userId: bot.userId })
      await tx.insert(serverMemberProfiles).values({ memberId })
      await tx
        .update(servers)
        .set({ memberCount: sql`${servers.memberCount} + 1` })
        .where(eq(servers.id, serverId))
      await tx.insert(auditLog).values({
        action: 'bot.installed',
        actorId: ownerId,
        id: createId(),
        metadata: { botId },
        serverId,
        targetId: botId,
        targetType: 'bot',
      })
      return { installed: true, memberId }
    })
  }

  async revoke(ownerId: string, botId: string) {
    const { db } = requireDatabase(this.app)
    const [owned] = await db
      .select({ id: botApplications.id })
      .from(botApplications)
      .where(
        and(
          eq(botApplications.id, botId),
          eq(botApplications.ownerId, ownerId),
        ),
      )
      .limit(1)
    if (!owned) throw new NotFoundError('Bot application not found')
    const rows = await db
      .update(botTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(botTokens.botId, botId), isNull(botTokens.revokedAt)))
      .returning({ id: botTokens.id })
    return rows.length > 0
  }

  async authenticate(token: string) {
    if (!token.startsWith(TOKEN_PREFIX))
      throw new UnauthorizedError('Bot token is invalid')
    const { db } = requireDatabase(this.app)
    const now = new Date()
    const [row] = await db
      .select({
        botId: botApplications.id,
        scopes: botTokens.scopes,
        tokenId: botTokens.id,
        userId: botApplications.botUserId,
      })
      .from(botTokens)
      .innerJoin(botApplications, eq(botApplications.id, botTokens.botId))
      .innerJoin(users, eq(users.id, botApplications.botUserId))
      .where(
        and(
          eq(botTokens.tokenHash, hashSecret(token)),
          isNull(botTokens.revokedAt),
          or(isNull(botTokens.expiresAt), gt(botTokens.expiresAt, now)),
          eq(users.status, 'active'),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)
    if (!row) throw new UnauthorizedError('Bot token is invalid or revoked')
    this.#recordActivity(row.tokenId)
    return row
  }

  #recordActivity(tokenId: string) {
    if (this.#closing) return
    const { db } = requireDatabase(this.app)
    const update = db
      .update(botTokens)
      .set({ lastUsedAt: sql`now()` })
      .where(
        and(
          eq(botTokens.id, tokenId),
          or(
            isNull(botTokens.lastUsedAt),
            sql`${botTokens.lastUsedAt} < now() - interval '1 minute'`,
          ),
        ),
      )
      .then(() => undefined)
    this.#activityUpdates.add(update)
    void update
      .catch((error: unknown) => {
        this.app.log.warn(
          { err: error, tokenId },
          'Could not update bot token activity',
        )
        this.app.reportError(error, { component: 'bot-activity', tokenId })
      })
      .finally(() => this.#activityUpdates.delete(update))
  }

  private present(bot: typeof botApplications.$inferSelect) {
    return {
      botUserId: bot.botUserId,
      createdAt: bot.createdAt.toISOString(),
      description: bot.description,
      id: bot.id,
      name: bot.name,
    }
  }
}
