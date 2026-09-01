import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const SearchMessagesQuerySchema = Type.Object({
  channelId: Type.Optional(IdSchema),
  limit: Type.Optional(Type.Integer({ maximum: 50, minimum: 1 })),
  offset: Type.Optional(Type.Integer({ maximum: 5_000, minimum: 0 })),
  q: Type.String({ maxLength: 200, minLength: 1 }),
  serverId: Type.Optional(IdSchema),
})

export const SearchMessageHitSchema = Type.Object({
  authorId: Type.Union([IdSchema, Type.Null()]),
  channelId: IdSchema,
  content: Type.String(),
  createdAt: DateTimeSchema,
  id: IdSchema,
  serverId: Type.Union([IdSchema, Type.Null()]),
})

export const SearchMessagesResponseSchema = Type.Object({
  estimatedTotalHits: Type.Integer({ minimum: 0 }),
  hits: Type.Array(SearchMessageHitSchema),
  limit: Type.Integer({ minimum: 1 }),
  offset: Type.Integer({ minimum: 0 }),
})

export type SearchMessagesQuery = Static<typeof SearchMessagesQuerySchema>

export const SearchServersQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ maximum: 50, minimum: 1 })),
  offset: Type.Optional(Type.Integer({ maximum: 5_000, minimum: 0 })),
  q: Type.String({ maxLength: 200, minLength: 1 }),
})

export const SearchServerHitSchema = Type.Object({
  description: Type.Union([Type.String(), Type.Null()]),
  id: IdSchema,
  memberCount: Type.Integer({ minimum: 0 }),
  name: Type.String(),
  slug: Type.String(),
})

export const SearchServersResponseSchema = Type.Object({
  estimatedTotalHits: Type.Integer({ minimum: 0 }),
  hits: Type.Array(SearchServerHitSchema),
  limit: Type.Integer({ minimum: 1 }),
  offset: Type.Integer({ minimum: 0 }),
})

export type SearchServersQuery = Static<typeof SearchServersQuerySchema>
