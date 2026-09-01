import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'
import { UserSchema } from './users.js'

export const MessageSchema = Type.Object(
  {
    attachmentIds: Type.Array(IdSchema),
    author: Type.Union([UserSchema, Type.Null()]),
    authorId: Type.Union([IdSchema, Type.Null()]),
    channelId: IdSchema,
    content: Type.String(),
    createdAt: DateTimeSchema,
    deletedAt: Type.Union([DateTimeSchema, Type.Null()]),
    editedAt: Type.Union([DateTimeSchema, Type.Null()]),
    flags: Type.Integer({ minimum: 0 }),
    id: IdSchema,
    replyToMessageId: Type.Union([IdSchema, Type.Null()]),
    type: Type.String(),
  },
  { $id: 'Message' },
)

export const CreateMessageBodySchema = Type.Object(
  {
    attachmentIds: Type.Optional(
      Type.Array(IdSchema, { maxItems: 10, uniqueItems: true }),
    ),
    clientNonce: IdSchema,
    content: Type.String({ maxLength: 4_000 }),
    replyToMessageId: Type.Optional(IdSchema),
  },
  { $id: 'CreateMessageBody' },
)

export const UpdateMessageBodySchema = Type.Object(
  {
    content: Type.String({ maxLength: 4_000, minLength: 1 }),
  },
  { $id: 'UpdateMessageBody' },
)

export const ListMessagesQuerySchema = Type.Object({
  before: Type.Optional(Type.String({ maxLength: 512 })),
  limit: Type.Optional(Type.Integer({ maximum: 100, minimum: 1 })),
})

export const MessageListResponseSchema = Type.Object(
  {
    messages: Type.Array(MessageSchema),
    nextCursor: Type.Union([Type.String(), Type.Null()]),
  },
  { $id: 'MessageListResponse' },
)

export const DeleteMessageResponseSchema = Type.Object({
  deleted: Type.Boolean(),
})

export const ReactionBodySchema = Type.Object(
  {
    emojiKey: Type.String({ maxLength: 128, minLength: 1 }),
  },
  { $id: 'ReactionBody' },
)

export const ReactionResponseSchema = Type.Object({
  active: Type.Boolean(),
})

export const ReadStateBodySchema = Type.Object(
  {
    lastReadMessageId: IdSchema,
  },
  { $id: 'ReadStateBody' },
)

export const ReadStateSchema = Type.Object(
  {
    channelId: IdSchema,
    lastReadAt: DateTimeSchema,
    lastReadMessageId: IdSchema,
    mentionCount: Type.Integer({ minimum: 0 }),
    userId: IdSchema,
  },
  { $id: 'ReadState' },
)

export type CreateMessageBody = Static<typeof CreateMessageBodySchema>
export type ListMessagesQuery = Static<typeof ListMessagesQuerySchema>
export type Message = Static<typeof MessageSchema>
export type ReactionBody = Static<typeof ReactionBodySchema>
export type ReadStateBody = Static<typeof ReadStateBodySchema>
export type UpdateMessageBody = Static<typeof UpdateMessageBodySchema>
