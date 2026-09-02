import { createHash } from 'node:crypto'

import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { auditLog, bots } from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import { AppError, ConflictError, ServiceUnavailableError } from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'

export type LimitedAction =
  | 'dm.create'
  | 'message.create'
  | 'message.edit'
  | 'message.mention'
  | 'notification.fanout'
  | 'reaction.change'

interface Limit {
  burst: number
  sustained: number
}

const userLimits: Record<LimitedAction, Limit> = {
  'dm.create': { burst: 4, sustained: 20 },
  'message.create': { burst: 10, sustained: 120 },
  'message.edit': { burst: 8, sustained: 60 },
  'message.mention': { burst: 8, sustained: 40 },
  'notification.fanout': { burst: 30, sustained: 300 },
  'reaction.change': { burst: 15, sustained: 180 },
}

const botLimits: Record<LimitedAction, Limit> = {
  'dm.create': { burst: 1, sustained: 5 },
  'message.create': { burst: 5, sustained: 60 },
  'message.edit': { burst: 3, sustained: 30 },
  'message.mention': { burst: 3, sustained: 15 },
  'notification.fanout': { burst: 15, sustained: 120 },
  'reaction.change': { burst: 8, sustained: 90 },
}

// Every bucket is inspected before any bucket is changed. This prevents a
// rejected request from partially consuming another dimension's allowance.
export const MULTI_DIMENSION_RATE_LIMIT_SCRIPT = `
local now = tonumber(ARGV[1])
local burstWindow = tonumber(ARGV[2])
local sustainedWindow = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local burstLimit = tonumber(ARGV[5])
local sustainedLimit = tonumber(ARGV[6])
local nonce = ARGV[7]
local nonceLimit = tonumber(ARGV[8])
local nonceTtl = tonumber(ARGV[9])
local bucketCount = tonumber(ARGV[10])

if nonce ~= '' then
  local known = redis.call('ZSCORE', KEYS[bucketCount + 1], nonce)
  if known then return { 2, 0, 'nonce' } end
  redis.call('ZREMRANGEBYSCORE', KEYS[bucketCount + 1], '-inf', now - nonceTtl)
  if redis.call('ZCARD', KEYS[bucketCount + 1]) >= nonceLimit then
    return { 0, nonceTtl, 'idempotency' }
  end
end

for i = 1, bucketCount do
  local b = tonumber(redis.call('GET', KEYS[i] .. ':b') or '0')
  local s = tonumber(redis.call('GET', KEYS[i] .. ':s') or '0')
  if b + cost > burstLimit then return { 0, redis.call('PTTL', KEYS[i] .. ':b'), KEYS[i] } end
  if s + cost > sustainedLimit then return { 0, redis.call('PTTL', KEYS[i] .. ':s'), KEYS[i] } end
end

for i = 1, bucketCount do
  local b = redis.call('INCRBY', KEYS[i] .. ':b', cost)
  if b == cost then redis.call('PEXPIRE', KEYS[i] .. ':b', burstWindow) end
  local s = redis.call('INCRBY', KEYS[i] .. ':s', cost)
  if s == cost then redis.call('PEXPIRE', KEYS[i] .. ':s', sustainedWindow) end
end
if nonce ~= '' then
  redis.call('ZADD', KEYS[bucketCount + 1], now, nonce)
  redis.call('PEXPIRE', KEYS[bucketCount + 1], nonceTtl)
end
return { 1, 0, '' }
`

export interface RateLimitInput {
  action: LimitedAction
  actorId: string
  channelId?: string
  clientNonce?: string
  cost?: number
  ip: string
  serverId?: string | null
}

export class AbusePreventionService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async check(input: RateLimitInput): Promise<'allowed' | 'replayed'> {
    if (!this.#app.redis) {
      if (this.#app.config.NODE_ENV === 'production') {
        throw new ServiceUnavailableError('Abuse prevention is unavailable')
      }
      return 'allowed'
    }

    const { db } = requireDatabase(this.#app)
    const [bot] = await db
      .select({ id: bots.id })
      .from(bots)
      .where(eq(bots.userId, input.actorId))
      .limit(1)
    const limit = (bot ? botLimits : userLimits)[input.action]
    const prefix = `rl:${input.action}`
    const keys = [
      `${prefix}:actor:${bot?.id ?? input.actorId}`,
      ...(input.channelId ? [`${prefix}:channel:${input.channelId}`] : []),
      ...(input.serverId ? [`${prefix}:server:${input.serverId}`] : []),
      `${prefix}:ip:${createHash('sha256').update(input.ip).digest('hex')}`,
    ]
    const nonceKey = `rl:nonce:${input.actorId}`
    const result = (await this.#app.redis.command.eval(
      MULTI_DIMENSION_RATE_LIMIT_SCRIPT,
      keys.length + 1,
      ...keys,
      nonceKey,
      Date.now(),
      10_000,
      60_000,
      input.cost ?? 1,
      limit.burst,
      limit.sustained,
      input.clientNonce ?? '',
      100,
      900_000,
      keys.length,
    )) as [number, number, string]

    if (result[0] === 2) return 'replayed'
    if (result[0] === 1) return 'allowed'

    await db.insert(auditLog).values({
      action: 'abuse.rate_limited',
      actorId: input.actorId,
      id: createId(),
      metadata: {
        action: input.action,
        botId: bot?.id ?? null,
        dimension: result[2],
        ipHash: createHash('sha256').update(input.ip).digest('hex'),
        retryAfterMs: Math.max(0, Number(result[1])),
      },
      serverId: input.serverId ?? null,
      targetId: input.actorId,
      targetType: bot ? 'bot' : 'user',
    })
    throw new AppError({
      code:
        result[2] === 'idempotency'
          ? 'TOO_MANY_IDEMPOTENCY_KEYS'
          : 'RATE_LIMITED',
      message: 'The actor is temporarily rate limited',
      statusCode: 429,
    })
  }

  assertSameNonce(
    existing: { channelId: string; content: string; replyToMessageId: string | null },
    requested: {
      channelId: string
      content: string
      replyToMessageId: string | undefined
    },
  ) {
    if (
      existing.channelId !== requested.channelId ||
      existing.content !== requested.content ||
      existing.replyToMessageId !== (requested.replyToMessageId ?? null)
    ) {
      throw new ConflictError(
        'clientNonce was already used for a different message',
        'CLIENT_NONCE_REUSED',
      )
    }
  }
}
