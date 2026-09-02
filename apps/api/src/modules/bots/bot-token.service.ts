import type {
  BotToken,
  CreateBotTokenBody,
  RotateBotTokenBody,
} from '@strafe/shared'
import { and, eq, gt, isNull, lt, lte } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { timingSafeEqual } from 'node:crypto'

import {
  applications,
  auditLog,
  bots,
  botTokens,
  notifications,
  outboxEvents,
} from '../../db/schema.js'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../lib/errors.js'
import { createId, createOpaqueToken, hashSecret } from '../../lib/ids.js'

function mapToken(row: typeof botTokens.$inferSelect): BotToken {
  return {
    createdAt: row.createdAt.toISOString(),
    credentialPrefix: row.credentialPrefix,
    expiresAt: row.expiresAt.toISOString(),
    id: row.id,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    name: row.name,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    scopes: row.scopes,
  }
}

export class BotTokenService {
  constructor(private readonly app: FastifyInstance) {}

  async list(ownerId: string, applicationId: string): Promise<BotToken[]> {
    const db = this.#db()
    await this.#ownedBot(ownerId, applicationId)
    const rows = await db
      .select()
      .from(botTokens)
      .innerJoin(bots, eq(botTokens.botId, bots.id))
      .where(eq(bots.applicationId, applicationId))
    return rows.map(({ bot_tokens }) => mapToken(bot_tokens))
  }

  async create(
    ownerId: string,
    applicationId: string,
    input: CreateBotTokenBody,
  ) {
    this.#validateTtl(input.expiresInSeconds)
    const db = this.#db()
    const bot = await this.#ownedBot(ownerId, applicationId)
    const issued = this.#issue()
    const row = {
      botId: bot.id,
      createdAt: new Date(),
      credentialPrefix: issued.prefix,
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1_000),
      id: createId(),
      name: input.name,
      scopes: input.scopes,
      tokenHash: hashSecret(issued.credential),
    }
    await db.transaction(async (tx) => {
      const duplicate = await tx
        .select({ id: botTokens.id })
        .from(botTokens)
        .where(
          and(
            eq(botTokens.botId, bot.id),
            eq(botTokens.name, input.name),
            isNull(botTokens.revokedAt),
            gt(botTokens.expiresAt, new Date()),
          ),
        )
      if (duplicate[0])
        throw new ConflictError('An active token with this name already exists')
      await tx.insert(botTokens).values(row)
      await this.#audit(tx, ownerId, row.id, 'bot_token.created', {
        applicationId,
        name: row.name,
        scopes: row.scopes,
      })
    })
    return {
      credential: issued.credential,
      token: mapToken({
        ...row,
        lastSourceHash: null,
        lastUsedAt: null,
        revokedAt: null,
      }),
    }
  }

  async rotate(
    ownerId: string,
    applicationId: string,
    tokenId: string,
    input: RotateBotTokenBody,
  ) {
    this.#validateTtl(input.expiresInSeconds)
    const db = this.#db()
    await this.#ownedBot(ownerId, applicationId)
    const [old] = await db
      .select({ token: botTokens })
      .from(botTokens)
      .innerJoin(bots, eq(botTokens.botId, bots.id))
      .where(
        and(
          eq(botTokens.id, tokenId),
          eq(bots.applicationId, applicationId),
          isNull(botTokens.revokedAt),
        ),
      )
    if (!old) throw new NotFoundError('Bot token not found')
    const issued = this.#issue()
    const now = new Date()
    const overlap = input.overlapInSeconds ?? 0
    const row = {
      botId: old.token.botId,
      createdAt: now,
      credentialPrefix: issued.prefix,
      expiresAt: new Date(now.getTime() + input.expiresInSeconds * 1_000),
      id: createId(),
      name: old.token.name,
      scopes: old.token.scopes,
      tokenHash: hashSecret(issued.credential),
    }
    await db.transaction(async (tx) => {
      await tx
        .update(botTokens)
        .set({
          expiresAt: new Date(now.getTime() + overlap * 1_000),
          revokedAt: overlap === 0 ? now : null,
        })
        .where(eq(botTokens.id, tokenId))
      await tx.insert(botTokens).values(row)
      await this.#audit(tx, ownerId, tokenId, 'bot_token.rotated', {
        applicationId,
        replacementTokenId: row.id,
        overlapInSeconds: overlap,
      })
    })
    return {
      credential: issued.credential,
      token: mapToken({
        ...row,
        lastSourceHash: null,
        lastUsedAt: null,
        revokedAt: null,
      }),
    }
  }

  async revoke(
    ownerId: string,
    applicationId: string,
    tokenId: string,
  ): Promise<boolean> {
    const db = this.#db()
    await this.#ownedBot(ownerId, applicationId)
    return db.transaction(async (tx) => {
      const rows = await tx
        .update(botTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(botTokens.id, tokenId), isNull(botTokens.revokedAt)))
        .returning()
      if (!rows[0]) return false
      await this.#audit(tx, ownerId, tokenId, 'bot_token.revoked', {
        applicationId,
      })
      return true
    })
  }

  async authenticate(credential: string, source: string) {
    const db = this.#db()
    const prefix = credential.split('_').slice(0, 3).join('_')
    const [row] = await db
      .select()
      .from(botTokens)
      .where(
        and(
          eq(botTokens.credentialPrefix, prefix),
          isNull(botTokens.revokedAt),
          gt(botTokens.expiresAt, new Date()),
        ),
      )
    const supplied = Buffer.from(hashSecret(credential), 'hex')
    const expected = Buffer.from(row?.tokenHash ?? '0'.repeat(64), 'hex')
    if (!row || !timingSafeEqual(supplied, expected))
      throw new UnauthorizedError('Bot credential is invalid or expired')
    const sourceHash = hashSecret(source)
    await db.transaction(async (tx) => {
      await tx
        .update(botTokens)
        .set({ lastSourceHash: sourceHash, lastUsedAt: new Date() })
        .where(eq(botTokens.id, row.id))
      if (row.lastSourceHash !== sourceHash)
        await this.#audit(tx, null, row.id, 'bot_token.used_from_new_source', {
          credentialPrefix: row.credentialPrefix,
          sourceHash,
        })
    })
    return { botId: row.botId, scopes: row.scopes, tokenId: row.id }
  }

  async maintain(): Promise<{ alerted: number; deleted: number }> {
    const db = this.#db()
    const now = new Date()
    const cutoff = new Date(
      now.getTime() + this.app.config.BOT_TOKEN_EXPIRY_ALERT_SECONDS * 1_000,
    )
    const expiring = await db
      .select({
        applicationId: bots.applicationId,
        ownerId: applications.ownerId,
        token: botTokens,
      })
      .from(botTokens)
      .innerJoin(bots, eq(botTokens.botId, bots.id))
      .innerJoin(applications, eq(bots.applicationId, applications.id))
      .where(
        and(
          isNull(botTokens.revokedAt),
          gt(botTokens.expiresAt, now),
          lte(botTokens.expiresAt, cutoff),
        ),
      )
    let alerted = 0
    for (const item of expiring) {
      const groupKey = `bot-token-expiry:${item.token.id}:${item.token.expiresAt.toISOString()}`
      const inserted = await db
        .insert(notifications)
        .values({
          id: createId(),
          userId: item.ownerId,
          type: 'bot_token.expiring',
          groupKey,
          data: {
            applicationId: item.applicationId,
            credentialPrefix: item.token.credentialPrefix,
            expiresAt: item.token.expiresAt.toISOString(),
            tokenId: item.token.id,
          },
        })
        .onConflictDoNothing()
        .returning({ id: notifications.id })
      alerted += inserted.length
      if (inserted[0])
        await db.insert(outboxEvents).values({
          aggregateId: inserted[0].id,
          aggregateType: 'notification',
          id: createId(),
          payload: {
            audience: { userIds: [item.ownerId] },
            data: { notificationId: inserted[0].id },
          },
          topic: 'notification.created',
        })
    }
    const deleted = await db
      .delete(botTokens)
      .where(lt(botTokens.expiresAt, now))
      .returning({ id: botTokens.id })
    return { alerted, deleted: deleted.length }
  }

  #validateTtl(seconds: number) {
    if (seconds > this.app.config.BOT_TOKEN_MAX_TTL_SECONDS)
      throw new BadRequestError(
        `expiresInSeconds cannot exceed ${this.app.config.BOT_TOKEN_MAX_TTL_SECONDS}`,
      )
  }
  #issue() {
    const visible = createOpaqueToken(6)
    const prefix = `st_bot_${visible}`
    return { credential: `${prefix}_${createOpaqueToken()}`, prefix }
  }
  #db() {
    if (!this.app.database) throw new Error('Database is not configured')
    return this.app.database.db
  }
  async #ownedBot(ownerId: string, applicationId: string) {
    const [row] = await this.#db()
      .select({ bot: bots })
      .from(bots)
      .innerJoin(applications, eq(bots.applicationId, applications.id))
      .where(
        and(
          eq(applications.id, applicationId),
          eq(applications.ownerId, ownerId),
        ),
      )
    if (!row) throw new NotFoundError('Bot application not found')
    return row.bot
  }
  async #audit(
    tx: any,
    actorId: string | null,
    tokenId: string,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    await tx
      .insert(auditLog)
      .values({
        action,
        actorId,
        id: createId(),
        metadata,
        targetId: tokenId,
        targetType: 'bot_token',
      })
  }
}
