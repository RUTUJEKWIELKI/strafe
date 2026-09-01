import { Type, type Static } from 'typebox'

import { CursorPageSchema, DateTimeSchema, IdSchema } from './common.js'
import { UserSchema } from './users.js'

export const PermissionBitsSchema = Type.String({ pattern: '^[0-9]+$' })

export const ServerVisibilitySchema = Type.Union([
  Type.Literal('private'),
  Type.Literal('unlisted'),
  Type.Literal('public'),
])

export const ServerSchema = Type.Object(
  {
    createdAt: DateTimeSchema,
    description: Type.Union([Type.String(), Type.Null()]),
    id: IdSchema,
    memberCount: Type.Integer({ minimum: 0 }),
    name: Type.String(),
    ownerId: IdSchema,
    slug: Type.String(),
    version: Type.Integer({ minimum: 1 }),
    visibility: ServerVisibilitySchema,
  },
  { $id: 'Server' },
)

export const CreateServerBodySchema = Type.Object(
  {
    description: Type.Optional(Type.String({ maxLength: 1_024 })),
    name: Type.String({ maxLength: 100, minLength: 1 }),
    visibility: Type.Optional(ServerVisibilitySchema),
  },
  { $id: 'CreateServerBody' },
)

export const CreateServerResponseSchema = Type.Object(
  {
    defaultChannelId: IdSchema,
    server: ServerSchema,
  },
  { $id: 'CreateServerResponse' },
)

export const UpdateServerBodySchema = Type.Object(
  {
    description: Type.Optional(
      Type.Union([Type.String({ maxLength: 1_024 }), Type.Null()]),
    ),
    name: Type.Optional(Type.String({ maxLength: 100, minLength: 1 })),
    visibility: Type.Optional(ServerVisibilitySchema),
  },
  {
    $id: 'UpdateServerBody',
    additionalProperties: false,
    minProperties: 1,
  },
)

export const TransferServerOwnershipBodySchema = Type.Object(
  { newOwnerId: IdSchema },
  { $id: 'TransferServerOwnershipBody', additionalProperties: false },
)

export const DeleteServerResponseSchema = Type.Object({
  deleted: Type.Literal(true),
  serverId: IdSchema,
})

export const ServerListResponseSchema = Type.Object({
  servers: Type.Array(ServerSchema),
})

export const RoleSchema = Type.Object(
  {
    color: Type.Union([Type.String(), Type.Null()]),
    id: IdSchema,
    isDefault: Type.Boolean(),
    name: Type.String(),
    permissions: PermissionBitsSchema,
    positionKey: Type.String(),
    serverId: IdSchema,
  },
  { $id: 'Role' },
)

export const CreateRoleBodySchema = Type.Object(
  {
    color: Type.Optional(Type.String({ pattern: '^#[0-9A-Fa-f]{6}$' })),
    name: Type.String({ maxLength: 100, minLength: 1 }),
    permissions: Type.Optional(PermissionBitsSchema),
  },
  { $id: 'CreateRoleBody' },
)

export const UpdateRoleBodySchema = Type.Object(
  {
    color: Type.Optional(
      Type.Union([Type.String({ pattern: '^#[0-9A-Fa-f]{6}$' }), Type.Null()]),
    ),
    name: Type.Optional(Type.String({ maxLength: 100, minLength: 1 })),
    permissions: Type.Optional(PermissionBitsSchema),
  },
  {
    $id: 'UpdateRoleBody',
    additionalProperties: false,
    minProperties: 1,
  },
)

export const ReorderRolesBodySchema = Type.Object(
  {
    roleIds: Type.Array(IdSchema, {
      description: 'Every non-default role ID, ordered from highest to lowest.',
      maxItems: 250,
      uniqueItems: true,
    }),
  },
  { $id: 'ReorderRolesBody', additionalProperties: false },
)

export const RoleListResponseSchema = Type.Object({
  roles: Type.Array(RoleSchema),
})

export const DeleteRoleResponseSchema = Type.Object({
  deleted: Type.Literal(true),
  roleId: IdSchema,
})

export const InviteSchema = Type.Object(
  {
    code: Type.String(),
    expiresAt: Type.Union([DateTimeSchema, Type.Null()]),
    id: IdSchema,
    maxUses: Type.Union([Type.Integer({ minimum: 1 }), Type.Null()]),
    serverId: IdSchema,
    uses: Type.Integer({ minimum: 0 }),
  },
  { $id: 'Invite' },
)

export const CreateInviteBodySchema = Type.Object(
  {
    channelId: Type.Optional(IdSchema),
    expiresInSeconds: Type.Optional(
      Type.Integer({ maximum: 2_592_000, minimum: 60 }),
    ),
    maxUses: Type.Optional(Type.Integer({ maximum: 10_000, minimum: 1 })),
  },
  { $id: 'CreateInviteBody' },
)

export const JoinInviteResponseSchema = Type.Object({
  joined: Type.Boolean(),
  server: ServerSchema,
})

export const UpdateMemberRolesBodySchema = Type.Object(
  {
    roleIds: Type.Array(IdSchema, { maxItems: 100, uniqueItems: true }),
  },
  { $id: 'UpdateMemberRolesBody' },
)

export const MemberRolesResponseSchema = Type.Object({
  memberId: IdSchema,
  permissionsVersion: Type.Integer({ minimum: 1 }),
  roleIds: Type.Array(IdSchema),
})

export const ServerMemberSchema = Type.Object(
  {
    id: IdSchema,
    joinedAt: DateTimeSchema,
    nickname: Type.Union([Type.String(), Type.Null()]),
    permissionsVersion: Type.Integer({ minimum: 1 }),
    roleIds: Type.Array(IdSchema),
    timeoutUntil: Type.Union([DateTimeSchema, Type.Null()]),
    user: UserSchema,
  },
  { $id: 'ServerMember' },
)

export const ServerMemberListResponseSchema = Type.Intersect([
  Type.Object({ members: Type.Array(ServerMemberSchema) }),
  CursorPageSchema,
])

export const MemberStateResponseSchema = Type.Object({
  serverId: IdSchema,
  state: Type.Literal('left'),
  userId: IdSchema,
})

export const UnbanMemberResponseSchema = Type.Object({
  removed: Type.Boolean(),
  serverId: IdSchema,
  userId: IdSchema,
})

export const ClearMemberTimeoutResponseSchema = Type.Object({
  cleared: Type.Boolean(),
  serverId: IdSchema,
  userId: IdSchema,
})

export const TimeoutMemberBodySchema = Type.Object(
  {
    durationSeconds: Type.Integer({
      maximum: 2_419_200,
      minimum: 60,
    }),
    reason: Type.Optional(Type.String({ maxLength: 1_024 })),
  },
  { $id: 'TimeoutMemberBody' },
)

export const KickMemberBodySchema = Type.Object(
  {
    reason: Type.Optional(Type.String({ maxLength: 1_024 })),
  },
  { $id: 'KickMemberBody', additionalProperties: false },
)

export const BanMemberBodySchema = Type.Object(
  {
    expiresInSeconds: Type.Optional(
      Type.Integer({ maximum: 31_536_000, minimum: 60 }),
    ),
    reason: Type.Optional(Type.String({ maxLength: 1_024 })),
  },
  { $id: 'BanMemberBody' },
)

export const ModerationActionResponseSchema = Type.Object({
  applied: Type.Boolean(),
  targetUserId: IdSchema,
})

export const AuditLogEntrySchema = Type.Object(
  {
    action: Type.String(),
    actorId: Type.Union([IdSchema, Type.Null()]),
    createdAt: DateTimeSchema,
    id: IdSchema,
    metadata: Type.Record(Type.String(), Type.Unknown()),
    reason: Type.Union([Type.String(), Type.Null()]),
    serverId: IdSchema,
    targetId: Type.Union([IdSchema, Type.Null()]),
    targetType: Type.Union([Type.String(), Type.Null()]),
  },
  { $id: 'AuditLogEntry' },
)

export const AuditLogListResponseSchema = Type.Intersect([
  Type.Object({ entries: Type.Array(AuditLogEntrySchema) }),
  CursorPageSchema,
])

export type AuditLogEntry = Static<typeof AuditLogEntrySchema>
export type BanMemberBody = Static<typeof BanMemberBodySchema>
export type CreateInviteBody = Static<typeof CreateInviteBodySchema>
export type CreateRoleBody = Static<typeof CreateRoleBodySchema>
export type CreateServerBody = Static<typeof CreateServerBodySchema>
export type KickMemberBody = Static<typeof KickMemberBodySchema>
export type ReorderRolesBody = Static<typeof ReorderRolesBodySchema>
export type Server = Static<typeof ServerSchema>
export type ServerMember = Static<typeof ServerMemberSchema>
export type TimeoutMemberBody = Static<typeof TimeoutMemberBodySchema>
export type TransferServerOwnershipBody = Static<
  typeof TransferServerOwnershipBodySchema
>
export type UpdateRoleBody = Static<typeof UpdateRoleBodySchema>
export type UpdateMemberRolesBody = Static<typeof UpdateMemberRolesBodySchema>
export type UpdateServerBody = Static<typeof UpdateServerBodySchema>
