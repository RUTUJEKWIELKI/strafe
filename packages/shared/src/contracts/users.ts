import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const UserStatusSchema = Type.Union([
  Type.Literal('active'),
  Type.Literal('disabled'),
  Type.Literal('pending_deletion'),
])

export const UserSchema = Type.Object(
  {
    avatarUrl: Type.Union([Type.String({ format: 'uri' }), Type.Null()]),
    createdAt: DateTimeSchema,
    displayName: Type.String(),
    handle: Type.String(),
    id: IdSchema,
    status: UserStatusSchema,
  },
  { $id: 'User' },
)

export const CurrentUserSchema = Type.Intersect(
  [
    UserSchema,
    Type.Object({
      email: Type.String({ format: 'email' }),
      emailVerified: Type.Boolean(),
    }),
  ],
  { $id: 'CurrentUser' },
)

export type CurrentUser = Static<typeof CurrentUserSchema>
export type User = Static<typeof UserSchema>


export const UpdateUserBodySchema = Type.Object(
  {
    displayName: Type.Optional(Type.String({ maxLength: 64, minLength: 1 })),
    bio: Type.Optional(Type.Union([Type.String({ maxLength: 500 }), Type.Null()])),
    pronouns: Type.Optional(Type.Union([Type.String({ maxLength: 32 }), Type.Null()])),
    avatarFileId: Type.Optional(Type.Union([IdSchema, Type.Null()])),
    bannerFileId: Type.Optional(Type.Union([IdSchema, Type.Null()])),
  },
  { $id: 'UpdateUserBody', additionalProperties: false }
)

export const UserSettingsSchema = Type.Object(
  {
    allowDmsFrom: Type.Union([Type.Literal('everyone'), Type.Literal('friends'), Type.Literal('server_members'), Type.Literal('nobody')]),
    customStatus: Type.Union([Type.String(), Type.Null()]),
    customStatusExpiresAt: Type.Union([DateTimeSchema, Type.Null()]),
    discoverability: Type.Union([Type.Literal('everyone'), Type.Literal('friends')]),
    locale: Type.String(),
    manualStatus: Type.Union([Type.Literal('online'), Type.Literal('idle'), Type.Literal('dnd'), Type.Literal('invisible')]),
    presenceVisibility: Type.Union([Type.Literal('everyone'), Type.Literal('friends'), Type.Literal('nobody')]),
    theme: Type.Union([Type.Literal('system'), Type.Literal('light'), Type.Literal('dark')]),
    timezone: Type.String(),
  },
  { $id: 'UserSettings' }
)

export const UpdateUserSettingsBodySchema = Type.Partial(UserSettingsSchema, { $id: 'UpdateUserSettingsBody', additionalProperties: false })

export const UserRelationshipSchema = Type.Object(
  {
    addresseeId: IdSchema,
    createdAt: DateTimeSchema,
    requesterId: IdSchema,
    status: Type.Union([Type.Literal('pending'), Type.Literal('accepted'), Type.Literal('declined')]),
  },
  { $id: 'UserRelationship' }
)

export const CreateRelationshipBodySchema = Type.Object(
  { targetId: IdSchema },
  { $id: 'CreateRelationshipBody', additionalProperties: false }
)

export const WebPushSubscriptionBodySchema = Type.Object(
  {
    endpoint: Type.String({ format: 'uri', maxLength: 1024 }),
    keys: Type.Record(Type.String(), Type.String()),
  },
  { $id: 'WebPushSubscriptionBody', additionalProperties: false }
)

export type UpdateUserBody = Static<typeof UpdateUserBodySchema>
export type UserSettings = Static<typeof UserSettingsSchema>
export type UpdateUserSettingsBody = Static<typeof UpdateUserSettingsBodySchema>
export type UserRelationship = Static<typeof UserRelationshipSchema>
export type CreateRelationshipBody = Static<typeof CreateRelationshipBodySchema>
export type WebPushSubscriptionBody = Static<typeof WebPushSubscriptionBodySchema>
