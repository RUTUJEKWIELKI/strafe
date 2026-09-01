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
