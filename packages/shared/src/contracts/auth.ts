import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'
import { CurrentUserSchema } from './users.js'

export const RegisterBodySchema = Type.Object(
  {
    captchaToken: Type.Optional(Type.String()),
    displayName: Type.String({ maxLength: 64, minLength: 1 }),
    email: Type.String({ format: 'email', maxLength: 320 }),
    handle: Type.String({
      maxLength: 32,
      minLength: 3,
      pattern: '^[A-Za-z0-9_.]+$',
    }),
    password: Type.String({ maxLength: 128, minLength: 12 }),
  },
  { $id: 'RegisterBody' },
)

export const LoginBodySchema = Type.Object(
  {
    email: Type.String({ format: 'email', maxLength: 320 }),
    password: Type.String({ maxLength: 128, minLength: 1 }),
  },
  { $id: 'LoginBody' },
)

export const RefreshBodySchema = Type.Object(
  {
    refreshToken: Type.String({ maxLength: 512, minLength: 32 }),
  },
  { $id: 'RefreshBody' },
)

export const LogoutBodySchema = Type.Object(
  {
    refreshToken: Type.Optional(Type.String({ maxLength: 512, minLength: 32 })),
  },
  { $id: 'LogoutBody' },
)

export const AuthTokensSchema = Type.Object({
  accessToken: Type.String(),
  accessTokenExpiresAt: DateTimeSchema,
  refreshToken: Type.String(),
  refreshTokenExpiresAt: DateTimeSchema,
  deviceId: IdSchema,
  sessionId: IdSchema,
  tokenType: Type.Literal('Bearer'),
})

export const AuthResponseSchema = Type.Object(
  {
    tokens: AuthTokensSchema,
    user: CurrentUserSchema,
  },
  { $id: 'AuthResponse' },
)

export const LogoutResponseSchema = Type.Object({
  revoked: Type.Boolean(),
})

export const UserSessionSchema = Type.Object(
  {
    city: Type.Union([Type.String(), Type.Null()]),
    countryCode: Type.Union([Type.String(), Type.Null()]),
    createdAt: DateTimeSchema,
    current: Type.Boolean(),
    device: Type.Object({
      id: IdSchema,
      name: Type.String(),
      platform: Type.String(),
      trustedAt: Type.Union([DateTimeSchema, Type.Null()]),
    }),
    expiresAt: DateTimeSchema,
    id: IdSchema,
    ipAddress: Type.Union([Type.String(), Type.Null()]),
    lastSeenAt: DateTimeSchema,
    userAgent: Type.Union([Type.String(), Type.Null()]),
  },
  { $id: 'UserSession' },
)

export const UserSessionListResponseSchema = Type.Object({
  sessions: Type.Array(UserSessionSchema),
})

export const RevokeAllSessionsBodySchema = Type.Object(
  { keepCurrent: Type.Optional(Type.Boolean()) },
  { additionalProperties: false, $id: 'RevokeAllSessionsBody' },
)

export const RevokeSessionsResponseSchema = Type.Object({
  revoked: Type.Integer({ minimum: 0 }),
})

export const ChangePasswordBodySchema = Type.Object(
  {
    currentPassword: Type.String({ maxLength: 128, minLength: 1 }),
    newPassword: Type.String({ maxLength: 128, minLength: 12 }),
  },
  { additionalProperties: false, $id: 'ChangePasswordBody' },
)

export const ChangePasswordResponseSchema = Type.Object({
  revokedSessions: Type.Integer({ minimum: 0 }),
  updated: Type.Literal(true),
})

export const RequestPasswordResetBodySchema = Type.Object(
  { email: Type.String({ format: 'email', maxLength: 320 }) },
  { additionalProperties: false, $id: 'RequestPasswordResetBody' },
)

export const CompletePasswordResetBodySchema = Type.Object(
  {
    newPassword: Type.String({ maxLength: 128, minLength: 12 }),
    token: Type.String({ maxLength: 512, minLength: 32 }),
  },
  { additionalProperties: false, $id: 'CompletePasswordResetBody' },
)

export const RequestEmailChangeBodySchema = Type.Object(
  {
    newEmail: Type.String({ format: 'email', maxLength: 320 }),
    password: Type.String({ maxLength: 128, minLength: 1 }),
  },
  { additionalProperties: false, $id: 'RequestEmailChangeBody' },
)

export const ConsumeAuthChallengeBodySchema = Type.Object(
  { token: Type.String({ maxLength: 512, minLength: 32 }) },
  { additionalProperties: false, $id: 'ConsumeAuthChallengeBody' },
)

export const AuthChallengeResponseSchema = Type.Object({
  accepted: Type.Literal(true),
  testToken: Type.Optional(Type.String()),
})

export const AccountSecurityEventSchema = Type.Object(
  {
    action: Type.String(),
    createdAt: DateTimeSchema,
    id: IdSchema,
    metadata: Type.Record(Type.String(), Type.Unknown()),
  },
  { $id: 'AccountSecurityEvent' },
)

export const AccountSecurityEventListResponseSchema = Type.Object({
  events: Type.Array(AccountSecurityEventSchema),
  nextCursor: Type.Union([Type.String(), Type.Null()]),
})

export type AuthResponse = Static<typeof AuthResponseSchema>
export type ChangePasswordBody = Static<typeof ChangePasswordBodySchema>
export type CompletePasswordResetBody = Static<
  typeof CompletePasswordResetBodySchema
>
export type ConsumeAuthChallengeBody = Static<
  typeof ConsumeAuthChallengeBodySchema
>
export type LoginBody = Static<typeof LoginBodySchema>
export type LogoutBody = Static<typeof LogoutBodySchema>
export type RefreshBody = Static<typeof RefreshBodySchema>
export type RegisterBody = Static<typeof RegisterBodySchema>
export type RequestEmailChangeBody = Static<typeof RequestEmailChangeBodySchema>
export type RequestPasswordResetBody = Static<
  typeof RequestPasswordResetBodySchema
>
export type RevokeAllSessionsBody = Static<typeof RevokeAllSessionsBodySchema>
