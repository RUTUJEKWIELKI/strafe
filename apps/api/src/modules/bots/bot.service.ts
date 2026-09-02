import { and, eq, isNull, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { bots, users } from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import { UnauthorizedError } from '../../lib/errors.js'
import { hashSecret } from '../../lib/ids.js'

export interface BotAuthContext {
  applicationId: string
  botId: string
  userId: string
}

/** Authenticates bot tokens and persists best-effort activity out of band. */
export class BotService {
  readonly #app: FastifyInstance
  readonly #activityUpdates = new Set<Promise<void>>()
  #closing = false

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async authenticateToken(token: string): Promise<BotAuthContext> {
    const { db } = requireDatabase(this.#app)
    const [bot] = await db
      .select({
        applicationId: bots.applicationId,
        botId: bots.id,
        userId: bots.userId,
      })
      .from(bots)
      .innerJoin(users, eq(users.id, bots.userId))
      .where(
        and(
          eq(bots.tokenHash, hashSecret(token)),
          eq(users.status, 'active'),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)

    if (!bot?.userId) {
      throw new UnauthorizedError('Bot token is invalid')
    }

    this.#recordActivity(bot.botId)
    return {
      applicationId: bot.applicationId,
      botId: bot.botId,
      userId: bot.userId,
    }
  }

  async close(): Promise<void> {
    this.#closing = true
    await Promise.allSettled([...this.#activityUpdates])
  }

  #recordActivity(botId: string): void {
    if (this.#closing) return

    const { db } = requireDatabase(this.#app)
    // The predicate, rather than an in-memory timer, keeps throttling atomic
    // when requests for the same bot reach different API instances.
    const update = db
      .update(bots)
      .set({ lastUsedAt: sql`now()` })
      .where(
        and(
          eq(bots.id, botId),
          or(
            isNull(bots.lastUsedAt),
            sql`${bots.lastUsedAt} < now() - interval '1 minute'`,
          ),
        ),
      )
      .then(() => undefined)

    this.#activityUpdates.add(update)
    void update
      .catch((error: unknown) => {
        this.#app.log.warn(
          { botId, err: error },
          'Could not update bot activity',
        )
        this.#app.reportError(error, {
          botId,
          component: 'bot-activity',
        })
      })
      .finally(() => this.#activityUpdates.delete(update))
  }
}
