import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const BOT_TOKEN_MAX_EXPIRES_IN_SECONDS = 31_536_000

export const BotTokenSchema = Type.Object(
  {
    createdAt: DateTimeSchema,
    credentialPrefix: Type.String({ maxLength: 32, minLength: 8 }),
    expiresAt: DateTimeSchema,
    id: IdSchema,
    lastUsedAt: Type.Union([DateTimeSchema, Type.Null()]),
    name: Type.String({ maxLength: 100, minLength: 1 }),
    revokedAt: Type.Union([DateTimeSchema, Type.Null()]),
    scopes: Type.Array(Type.String({ maxLength: 100, minLength: 1 }), {
      maxItems: 100,
      uniqueItems: true,
    }),
  },
  { $id: 'BotToken' },
)

const TokenProperties = {
  expiresInSeconds: Type.Integer({
    maximum: BOT_TOKEN_MAX_EXPIRES_IN_SECONDS,
    minimum: 300,
  }),
  name: Type.String({ maxLength: 100, minLength: 1 }),
  scopes: Type.Array(Type.String({ maxLength: 100, minLength: 1 }), {
    maxItems: 100,
    uniqueItems: true,
  }),
}

export const CreateBotTokenBodySchema = Type.Object(TokenProperties, {
  additionalProperties: false,
  $id: 'CreateBotTokenBody',
})

export const RotateBotTokenBodySchema = Type.Object(
  {
    expiresInSeconds: TokenProperties.expiresInSeconds,
    overlapInSeconds: Type.Optional(
      Type.Integer({ maximum: 3_600, minimum: 0 }),
    ),
  },
  { additionalProperties: false, $id: 'RotateBotTokenBody' },
)

export const BotTokenCredentialResponseSchema = Type.Object(
  {
    credential: Type.String({ minLength: 32 }),
    token: BotTokenSchema,
  },
  { $id: 'BotTokenCredentialResponse' },
)

export const BotTokenListResponseSchema = Type.Object({
  tokens: Type.Array(BotTokenSchema),
})

export const RevokeBotTokenResponseSchema = Type.Object({
  revoked: Type.Boolean(),
})

export type BotToken = Static<typeof BotTokenSchema>
export type CreateBotTokenBody = Static<typeof CreateBotTokenBodySchema>
export type RotateBotTokenBody = Static<typeof RotateBotTokenBodySchema>
