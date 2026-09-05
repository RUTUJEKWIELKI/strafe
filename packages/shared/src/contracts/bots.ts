import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const BotScopeSchema = Type.Union([
  Type.Literal('messages:read'),
  Type.Literal('messages:write'),
  Type.Literal('servers:read'),
  Type.Literal('members:read'),
])

export const BotApplicationSchema = Type.Object({
  botUserId: IdSchema,
  createdAt: DateTimeSchema,
  description: Type.Union([Type.String(), Type.Null()]),
  id: IdSchema,
  name: Type.String(),
})

export const CreateBotBodySchema = Type.Object(
  {
    description: Type.Optional(Type.String({ maxLength: 500 })),
    handle: Type.String({
      maxLength: 32,
      minLength: 3,
      pattern: '^[A-Za-z0-9_.]+$',
    }),
    name: Type.String({ maxLength: 64, minLength: 1 }),
    scopes: Type.Array(BotScopeSchema, {
      maxItems: 4,
      minItems: 1,
      uniqueItems: true,
    }),
  },
  { additionalProperties: false },
)

export const BotCredentialSchema = Type.Object({
  bot: BotApplicationSchema,
  token: Type.String({
    description: 'Shown once. Store this credential securely.',
  }),
})

export const BotListResponseSchema = Type.Object({
  bots: Type.Array(BotApplicationSchema),
})
export const RotateBotTokenBodySchema = Type.Object({
  scopes: Type.Array(BotScopeSchema, {
    maxItems: 4,
    minItems: 1,
    uniqueItems: true,
  }),
})
export const BotTokenResponseSchema = Type.Object({ token: Type.String() })
export const RevokeBotResponseSchema = Type.Object({ revoked: Type.Boolean() })

export type BotScope = Static<typeof BotScopeSchema>
export type CreateBotBody = Static<typeof CreateBotBodySchema>
export type RotateBotTokenBody = Static<typeof RotateBotTokenBodySchema>
