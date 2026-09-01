import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const PresenceStatusSchema = Type.Union([
  Type.Literal('online'),
  Type.Literal('idle'),
  Type.Literal('dnd'),
  Type.Literal('invisible'),
  Type.Literal('offline'),
])

export const PresenceSchema = Type.Object({
  lastChangedAt: DateTimeSchema,
  status: PresenceStatusSchema,
  userId: IdSchema,
  version: Type.Integer({ minimum: 1 }),
})

export const RealtimeEventSchema = Type.Object(
  {
    aggregateId: Type.Union([IdSchema, Type.Null()]),
    data: Type.Record(Type.String(), Type.Unknown()),
    eventId: IdSchema,
    occurredAt: DateTimeSchema,
    streamId: Type.Union([Type.String(), Type.Null()]),
    type: Type.String(),
    version: Type.Integer({ minimum: 1 }),
  },
  { $id: 'RealtimeEvent' },
)

export type Presence = Static<typeof PresenceSchema>
export type PresenceStatus = Static<typeof PresenceStatusSchema>
export type RealtimeEvent = Static<typeof RealtimeEventSchema>
