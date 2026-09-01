import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const NotificationSchema = Type.Object(
  {
    createdAt: DateTimeSchema,
    data: Type.Record(Type.String(), Type.Unknown()),
    groupCount: Type.Integer({ minimum: 1 }),
    groupKey: Type.Union([Type.String(), Type.Null()]),
    id: IdSchema,
    readAt: Type.Union([DateTimeSchema, Type.Null()]),
    seenAt: Type.Union([DateTimeSchema, Type.Null()]),
    type: Type.String(),
    userId: IdSchema,
  },
  { $id: 'Notification' },
)

export const ListNotificationsQuerySchema = Type.Object({
  before: Type.Optional(Type.String({ maxLength: 512 })),
  limit: Type.Optional(Type.Integer({ maximum: 100, minimum: 1 })),
  unreadOnly: Type.Optional(Type.Boolean()),
})

export const NotificationListResponseSchema = Type.Object(
  {
    nextCursor: Type.Union([Type.String(), Type.Null()]),
    notifications: Type.Array(NotificationSchema),
  },
  { $id: 'NotificationListResponse' },
)

export const MarkNotificationsReadResponseSchema = Type.Object({
  updated: Type.Integer({ minimum: 0 }),
})

export const NotificationPreferenceSchema = Type.Object({
  channelId: Type.Union([IdSchema, Type.Null()]),
  config: Type.Object({
    digest: Type.Union([
      Type.Literal('off'),
      Type.Literal('hourly'),
      Type.Literal('daily'),
    ]),
    email: Type.Boolean(),
    muted: Type.Boolean(),
    push: Type.Boolean(),
  }),
  id: IdSchema,
  serverId: Type.Union([IdSchema, Type.Null()]),
  type: Type.String(),
  updatedAt: DateTimeSchema,
  userId: IdSchema,
})

export const NotificationPreferenceListResponseSchema = Type.Object({
  preferences: Type.Array(NotificationPreferenceSchema),
})

export const UpsertNotificationPreferenceBodySchema = Type.Object(
  {
    channelId: Type.Optional(Type.Union([IdSchema, Type.Null()])),
    config: Type.Object({
      digest: Type.Optional(
        Type.Union([
          Type.Literal('off'),
          Type.Literal('hourly'),
          Type.Literal('daily'),
        ]),
      ),
      email: Type.Optional(Type.Boolean()),
      muted: Type.Optional(Type.Boolean()),
      push: Type.Optional(Type.Boolean()),
    }),
    serverId: Type.Optional(Type.Union([IdSchema, Type.Null()])),
    type: Type.String({ maxLength: 100, minLength: 1 }),
  },
  { additionalProperties: false, $id: 'UpsertNotificationPreferenceBody' },
)

export const PushSubscriptionBodySchema = Type.Object(
  {
    endpoint: Type.String({ maxLength: 2_048, minLength: 10 }),
    keys: Type.Object({
      auth: Type.String({ maxLength: 512, minLength: 1 }),
      p256dh: Type.String({ maxLength: 512, minLength: 1 }),
    }),
  },
  { additionalProperties: false, $id: 'PushSubscriptionBody' },
)

export const PushSubscriptionSchema = Type.Object({
  createdAt: DateTimeSchema,
  endpoint: Type.String(),
  id: IdSchema,
  lastError: Type.Union([Type.String(), Type.Null()]),
  lastUsedAt: Type.Union([DateTimeSchema, Type.Null()]),
})

export const PushSubscriptionListResponseSchema = Type.Object({
  subscriptions: Type.Array(PushSubscriptionSchema),
})

export type ListNotificationsQuery = Static<typeof ListNotificationsQuerySchema>
export type Notification = Static<typeof NotificationSchema>
export type PushSubscriptionBody = Static<typeof PushSubscriptionBodySchema>
export type UpsertNotificationPreferenceBody = Static<
  typeof UpsertNotificationPreferenceBodySchema
>
