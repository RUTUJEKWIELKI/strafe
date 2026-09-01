import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const ChannelTypeSchema = Type.Union([
  Type.Literal('category'),
  Type.Literal('text'),
  Type.Literal('announcement'),
  Type.Literal('forum'),
  Type.Literal('voice'),
  Type.Literal('stage'),
  Type.Literal('thread_public'),
  Type.Literal('thread_private'),
  Type.Literal('dm'),
  Type.Literal('group_dm'),
])

export const ChannelSchema = Type.Object(
  {
    archivedAt: Type.Union([DateTimeSchema, Type.Null()]),
    id: IdSchema,
    name: Type.String(),
    parentId: Type.Union([IdSchema, Type.Null()]),
    positionKey: Type.String(),
    serverId: Type.Union([IdSchema, Type.Null()]),
    slowmodeSeconds: Type.Integer({ minimum: 0 }),
    topic: Type.Union([Type.String(), Type.Null()]),
    type: ChannelTypeSchema,
  },
  { $id: 'Channel' },
)

export const CreateChannelBodySchema = Type.Object(
  {
    name: Type.String({ maxLength: 100, minLength: 1 }),
    parentId: Type.Optional(IdSchema),
    slowmodeSeconds: Type.Optional(
      Type.Integer({ maximum: 21_600, minimum: 0 }),
    ),
    topic: Type.Optional(Type.String({ maxLength: 1_024 })),
    type: ChannelTypeSchema,
  },
  { $id: 'CreateChannelBody' },
)

export const UpdateChannelBodySchema = Type.Object(
  {
    name: Type.Optional(Type.String({ maxLength: 100, minLength: 1 })),
    parentId: Type.Optional(Type.Union([IdSchema, Type.Null()])),
    slowmodeSeconds: Type.Optional(
      Type.Integer({ maximum: 21_600, minimum: 0 }),
    ),
    topic: Type.Optional(
      Type.Union([Type.String({ maxLength: 1_024 }), Type.Null()]),
    ),
  },
  {
    $id: 'UpdateChannelBody',
    additionalProperties: false,
    minProperties: 1,
  },
)

export const ReorderChannelItemSchema = Type.Object(
  {
    channelId: IdSchema,
    parentId: Type.Union([IdSchema, Type.Null()]),
  },
  { additionalProperties: false },
)

export const ReorderChannelsBodySchema = Type.Object(
  {
    items: Type.Array(ReorderChannelItemSchema, {
      description:
        'Every active server channel in display order, including categories.',
      maxItems: 500,
      minItems: 1,
    }),
  },
  { $id: 'ReorderChannelsBody', additionalProperties: false },
)

export const DeleteChannelResponseSchema = Type.Object({
  channelId: IdSchema,
  deleted: Type.Literal(true),
})

export const PermissionOverwriteSubjectTypeSchema = Type.Union([
  Type.Literal('role'),
  Type.Literal('member'),
])

export const ChannelPermissionOverwriteSchema = Type.Object(
  {
    allowBits: Type.String({ pattern: '^[0-9]+$' }),
    channelId: IdSchema,
    denyBits: Type.String({ pattern: '^[0-9]+$' }),
    subjectId: IdSchema,
    subjectType: PermissionOverwriteSubjectTypeSchema,
  },
  { $id: 'ChannelPermissionOverwrite' },
)

export const UpsertChannelPermissionOverwriteBodySchema = Type.Object(
  {
    allowBits: Type.String({ pattern: '^[0-9]+$' }),
    denyBits: Type.String({ pattern: '^[0-9]+$' }),
  },
  {
    $id: 'UpsertChannelPermissionOverwriteBody',
    additionalProperties: false,
  },
)

export const ChannelPermissionOverwriteListResponseSchema = Type.Object({
  overwrites: Type.Array(ChannelPermissionOverwriteSchema),
})

export const DeleteChannelPermissionOverwriteResponseSchema = Type.Object({
  channelId: IdSchema,
  removed: Type.Boolean(),
  subjectId: IdSchema,
  subjectType: PermissionOverwriteSubjectTypeSchema,
})

export const ChannelListResponseSchema = Type.Object({
  channels: Type.Array(ChannelSchema),
})

export const CreateDirectMessageBodySchema = Type.Object(
  {
    recipientId: IdSchema,
  },
  { $id: 'CreateDirectMessageBody' },
)

export type Channel = Static<typeof ChannelSchema>
export type ChannelPermissionOverwrite = Static<
  typeof ChannelPermissionOverwriteSchema
>
export type CreateChannelBody = Static<typeof CreateChannelBodySchema>
export type CreateDirectMessageBody = Static<
  typeof CreateDirectMessageBodySchema
>
export type PermissionOverwriteSubjectType = Static<
  typeof PermissionOverwriteSubjectTypeSchema
>
export type ReorderChannelsBody = Static<typeof ReorderChannelsBodySchema>
export type UpdateChannelBody = Static<typeof UpdateChannelBodySchema>
export type UpsertChannelPermissionOverwriteBody = Static<
  typeof UpsertChannelPermissionOverwriteBodySchema
>
