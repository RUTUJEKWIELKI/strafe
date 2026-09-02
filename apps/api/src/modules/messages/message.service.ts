import type {
  CreateMessageBody,
  Message,
  MessageEnvelope,
  UpdateMessageBody,
} from '@strafe/shared'
import {
  and,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  or,
  sql,
} from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  channels,
  channelReadStates,
  files,
  messageAttachments,
  messageEdits,
  messageReactions,
  messages,
  notifications,
  outboxEvents,
  userProfiles,
  users,
} from '../../db/schema.js'
import { decodeCursor, encodeCursor } from '../../lib/cursor.js'
import { requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'
import { hasPermission, Permission } from '../../lib/permissions.js'
import { authorizeChannel } from '../permissions/authorization.js'

interface MessageProjection {
  authorAvatarFileId: string | null
  authorCreatedAt: Date | null
  authorDisplayName: string | null
  authorHandle: string | null
  authorId: string | null
  authorStatus: string | null
  channelId: string
  authenticationTag: string | null
  ciphertext: string | null
  contentType: string | null
  createdAt: Date
  deletedAt: Date | null
  editedAt: Date | null
  flags: number
  messageEpoch: number | null
  migrationState: 'encrypted' | 'legacy_unconvertible'
  nonce: string | null
  protocolVersion: number | null
  id: string
  replyToMessageId: string | null
  senderDeviceId: string | null
  type: string
}

function mapMessage(
  row: MessageProjection,
  attachmentIds: string[] = [],
): Message {
  return {
    attachmentIds,
    author:
      row.authorId &&
      row.authorCreatedAt &&
      row.authorDisplayName &&
      row.authorHandle &&
      row.authorStatus
        ? {
            avatarUrl: null,
            createdAt: row.authorCreatedAt.toISOString(),
            displayName: row.authorDisplayName,
            handle: row.authorHandle,
            id: row.authorId,
            status: row.authorStatus as Message['author'] extends {
              status: infer Status
            }
              ? Status
              : never,
          }
        : null,
    authorId: row.authorId,
    channelId: row.channelId,
    envelope:
      row.migrationState === 'encrypted'
        ? {
            authenticationTag: row.authenticationTag!,
            ciphertext: row.ciphertext!,
            contentType: row.contentType!,
            epoch: row.messageEpoch!,
            nonce: row.nonce!,
            protocolVersion: 1,
            senderDeviceId: row.senderDeviceId!,
          }
        : null,
    migrationState: row.migrationState,
    createdAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
    editedAt: row.editedAt?.toISOString() ?? null,
    flags: row.flags,
    id: row.id,
    replyToMessageId: row.replyToMessageId,
    type: row.type,
  }
}

function projection() {
  return {
    authorAvatarFileId: userProfiles.avatarFileId,
    authorCreatedAt: users.createdAt,
    authorDisplayName: userProfiles.displayName,
    authorHandle: users.handle,
    authorId: messages.authorId,
    authorStatus: users.status,
    channelId: messages.channelId,
    authenticationTag: messages.authenticationTag,
    ciphertext: messages.ciphertext,
    contentType: messages.contentType,
    createdAt: messages.createdAt,
    deletedAt: messages.deletedAt,
    editedAt: messages.editedAt,
    flags: messages.flags,
    messageEpoch: messages.messageEpoch,
    migrationState: sql<
      'encrypted' | 'legacy_unconvertible'
    >`${messages.migrationState}`,
    nonce: messages.nonce,
    protocolVersion: messages.protocolVersion,
    id: messages.id,
    replyToMessageId: messages.replyToMessageId,
    senderDeviceId: messages.senderDeviceId,
    type: messages.type,
  }
}

const messageChannelTypes = new Set([
  'text',
  'announcement',
  'forum',
  'thread_public',
  'thread_private',
  'dm',
  'group_dm',
])

function validateEnvelope(envelope: MessageEnvelope): void {
  const base64Url = /^[A-Za-z0-9_-]+$/
  if (
    !base64Url.test(envelope.ciphertext) ||
    !base64Url.test(envelope.nonce) ||
    !base64Url.test(envelope.authenticationTag)
  ) {
    throw new BadRequestError(
      'Envelope binary fields must be base64url',
      'INVALID_MESSAGE_ENVELOPE',
    )
  }
  const ciphertextBytes = Math.floor((envelope.ciphertext.length * 3) / 4)
  if (ciphertextBytes > 48_000) {
    throw new BadRequestError(
      'Encrypted message exceeds 48 KiB',
      'MESSAGE_TOO_LARGE',
    )
  }
}

export class MessageService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async list(
    userId: string,
    channelId: string,
    limit: number,
    before?: string,
  ) {
    await authorizeChannel(
      this.#app,
      userId,
      channelId,
      Permission.ReadMessageHistory,
    )
    const { db } = requireDatabase(this.#app)
    const cursor = before ? decodeCursor(before) : null
    const conditions = [eq(messages.channelId, channelId)]
    if (cursor) {
      const cursorDate = new Date(cursor.createdAt)
      conditions.push(
        or(
          lt(messages.createdAt, cursorDate),
          and(eq(messages.createdAt, cursorDate), lt(messages.id, cursor.id)),
        )!,
      )
    }

    const rows = await db
      .select(projection())
      .from(messages)
      .leftJoin(users, eq(users.id, messages.authorId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const page = rows.slice(0, limit)
    const attachmentRows =
      page.length === 0
        ? []
        : await db
            .select()
            .from(messageAttachments)
            .where(
              inArray(
                messageAttachments.messageId,
                page.map((message) => message.id),
              ),
            )
            .orderBy(messageAttachments.position)
    const last = page.at(-1)
    return {
      messages: page.map((message) =>
        mapMessage(
          message,
          attachmentRows
            .filter((attachment) => attachment.messageId === message.id)
            .map((attachment) => attachment.fileId),
        ),
      ),
      nextCursor:
        hasMore && last
          ? encodeCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    }
  }

  async create(
    userId: string,
    channelId: string,
    input: CreateMessageBody,
  ): Promise<Message> {
    const authorization = await authorizeChannel(
      this.#app,
      userId,
      channelId,
      Permission.SendMessages,
    )
    if (!messageChannelTypes.has(authorization.channel.type)) {
      throw new BadRequestError(
        'Messages cannot be sent to this channel type',
        'INVALID_MESSAGE_CHANNEL',
      )
    }

    validateEnvelope(input.envelope)
    const attachmentIds = input.attachmentIds ?? []
    if (!input.envelope.ciphertext && attachmentIds.length === 0) {
      throw new BadRequestError(
        'Message content and attachments cannot both be empty',
        'EMPTY_MESSAGE',
      )
    }

    const { db } = requireDatabase(this.#app)
    const [existing] = await db
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.authorId, userId),
          eq(messages.clientNonce, input.clientNonce),
        ),
      )
      .limit(1)
    if (existing) return this.get(userId, existing.id)

    const attachmentRows =
      attachmentIds.length === 0
        ? []
        : await db
            .select({
              id: files.id,
              purpose: files.purpose,
              serverId: files.serverId,
              status: files.status,
            })
            .from(files)
            .where(
              and(inArray(files.id, attachmentIds), eq(files.ownerId, userId)),
            )
    if (
      attachmentRows.length !== attachmentIds.length ||
      attachmentRows.some(
        (file) =>
          file.status !== 'ready' ||
          file.purpose !== 'attachment' ||
          file.serverId !== authorization.channel.serverId,
      )
    ) {
      throw new BadRequestError(
        'Every attachment must be ready, owned by the author and scoped to this conversation',
        'INVALID_MESSAGE_ATTACHMENT',
      )
    }

    let replyAuthorId: string | null = null
    if (input.replyToMessageId) {
      const [reply] = await db
        .select({
          authorId: messages.authorId,
          channelId: messages.channelId,
        })
        .from(messages)
        .where(eq(messages.id, input.replyToMessageId))
        .limit(1)
      if (!reply || reply.channelId !== channelId) {
        throw new BadRequestError(
          'Reply target does not belong to this channel',
          'INVALID_REPLY_TARGET',
        )
      }
      replyAuthorId = reply.authorId
    }

    if (
      authorization.channel.slowmodeSeconds > 0 &&
      !hasPermission(authorization.permissions, Permission.ManageMessages)
    ) {
      const [lastMessage] = await db
        .select({ createdAt: messages.createdAt })
        .from(messages)
        .where(
          and(eq(messages.channelId, channelId), eq(messages.authorId, userId)),
        )
        .orderBy(desc(messages.createdAt))
        .limit(1)
      const allowedAt =
        (lastMessage?.createdAt.getTime() ?? 0) +
        authorization.channel.slowmodeSeconds * 1_000
      if (allowedAt > Date.now()) {
        throw new BadRequestError(
          `Slow mode is active; retry in ${Math.ceil(
            (allowedAt - Date.now()) / 1_000,
          )} seconds`,
          'SLOWMODE_ACTIVE',
        )
      }
    }

    const id = createId()
    const messageId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(messages)
        .values({
          authorId: userId,
          channelId,
          clientNonce: input.clientNonce,
          authenticationTag: input.envelope.authenticationTag,
          ciphertext: input.envelope.ciphertext,
          contentType: input.envelope.contentType,
          id,
          messageEpoch: input.envelope.epoch,
          migrationState: 'encrypted',
          nonce: input.envelope.nonce,
          protocolVersion: input.envelope.protocolVersion,
          senderDeviceId: input.envelope.senderDeviceId,
          replyToMessageId: input.replyToMessageId ?? null,
          type: input.replyToMessageId ? 'reply' : 'default',
        })
        .onConflictDoNothing()
        .returning({ id: messages.id })

      if (!created) {
        const [duplicate] = await tx
          .select({ id: messages.id })
          .from(messages)
          .where(
            and(
              eq(messages.authorId, userId),
              eq(messages.clientNonce, input.clientNonce),
            ),
          )
          .limit(1)
        if (!duplicate) {
          throw new Error('Message nonce conflict could not be resolved')
        }
        return duplicate.id
      }

      await tx
        .update(channels)
        .set({ lastMessageId: created.id, updatedAt: new Date() })
        .where(eq(channels.id, channelId))
      if (attachmentIds.length > 0) {
        await tx.insert(messageAttachments).values(
          attachmentIds.map((fileId, position) => ({
            fileId,
            messageId: created.id,
            position,
          })),
        )
      }
      await tx.insert(outboxEvents).values({
        aggregateId: created.id,
        aggregateType: 'message',
        id: createId(),
        payload: {
          audience: {
            channelId,
            ...(authorization.channel.serverId
              ? { serverId: authorization.channel.serverId }
              : {}),
          },
          data: { channelId, envelope: input.envelope, messageId: created.id },
          envelopeVersion: 1,
        },
        topic: 'message.created',
      })
      if (replyAuthorId && replyAuthorId !== userId) {
        const notificationId = createId()
        const groupKey = `message.reply:${channelId}:${Math.floor(Date.now() / 300_000)}`
        const [notification] = await tx
          .insert(notifications)
          .values({
            data: {
              channelId,
              messageId: created.id,
              userId,
            },
            groupKey,
            id: notificationId,
            type: 'message.reply',
            userId: replyAuthorId,
          })
          .onConflictDoUpdate({
            set: {
              data: { channelId, messageId: created.id, userId },
              groupCount: sql`${notifications.groupCount} + 1`,
              updatedAt: new Date(),
            },
            target: [notifications.userId, notifications.groupKey],
            targetWhere: isNotNull(notifications.groupKey),
          })
          .returning({ id: notifications.id })
        if (!notification)
          throw new Error('Notification upsert returned no row')
        await tx.insert(outboxEvents).values({
          aggregateId: notification.id,
          aggregateType: 'notification',
          id: createId(),
          payload: {
            audience: { userIds: [replyAuthorId] },
            data: { notificationId: notification.id },
          },
          topic: 'notification.created',
        })
      }
      return created.id
    })

    return this.get(userId, messageId)
  }

  async get(userId: string, messageId: string): Promise<Message> {
    const { db } = requireDatabase(this.#app)
    const [row] = await db
      .select(projection())
      .from(messages)
      .leftJoin(users, eq(users.id, messages.authorId))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(messages.id, messageId))
      .limit(1)

    if (!row) throw new NotFoundError('Message not found')
    await authorizeChannel(
      this.#app,
      userId,
      row.channelId,
      Permission.ReadMessageHistory,
    )
    const attachments = await db
      .select({ fileId: messageAttachments.fileId })
      .from(messageAttachments)
      .where(eq(messageAttachments.messageId, messageId))
      .orderBy(messageAttachments.position)
    return mapMessage(
      row,
      attachments.map((attachment) => attachment.fileId),
    )
  }

  async update(
    userId: string,
    messageId: string,
    input: UpdateMessageBody,
  ): Promise<Message> {
    const { db } = requireDatabase(this.#app)
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)
    if (!message || message.deletedAt) {
      throw new NotFoundError('Message not found')
    }

    const authorization = await authorizeChannel(
      this.#app,
      userId,
      message.channelId,
      Permission.SendMessages,
    )
    if (
      message.authorId !== userId &&
      !hasPermission(authorization.permissions, Permission.ManageMessages)
    ) {
      throw new ForbiddenError(
        'Only the author or a moderator can edit this message',
      )
    }

    validateEnvelope(input.envelope)
    if (!input.envelope.ciphertext) {
      throw new BadRequestError(
        'Message ciphertext cannot be empty',
        'EMPTY_MESSAGE',
      )
    }

    await db.transaction(async (tx) => {
      await tx.insert(messageEdits).values({
        authenticationTag: message.authenticationTag,
        ciphertext: message.ciphertext,
        contentType: message.contentType,
        editorId: userId,
        messageEpoch: message.messageEpoch,
        migrationState: message.migrationState,
        nonce: message.nonce,
        protocolVersion: message.protocolVersion,
        senderDeviceId: message.senderDeviceId,
        id: createId(),
        messageId,
      })
      await tx
        .update(messages)
        .set({
          authenticationTag: input.envelope.authenticationTag,
          ciphertext: input.envelope.ciphertext,
          contentType: input.envelope.contentType,
          editedAt: new Date(),
          messageEpoch: input.envelope.epoch,
          migrationState: 'encrypted',
          nonce: input.envelope.nonce,
          protocolVersion: input.envelope.protocolVersion,
          senderDeviceId: input.envelope.senderDeviceId,
        })
        .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      await tx.insert(outboxEvents).values({
        aggregateId: messageId,
        aggregateType: 'message',
        aggregateVersion: 2,
        id: createId(),
        payload: {
          audience: {
            channelId: message.channelId,
            ...(authorization.channel.serverId
              ? { serverId: authorization.channel.serverId }
              : {}),
          },
          data: {
            channelId: message.channelId,
            envelope: input.envelope,
            messageId,
          },
          envelopeVersion: 1,
        },
        topic: 'message.updated',
      })
    })

    return this.get(userId, messageId)
  }

  async delete(userId: string, messageId: string): Promise<boolean> {
    const { db } = requireDatabase(this.#app)
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)
    if (!message || message.deletedAt) return false

    const authorization = await authorizeChannel(
      this.#app,
      userId,
      message.channelId,
      Permission.ViewChannel,
    )
    if (
      message.authorId !== userId &&
      !hasPermission(authorization.permissions, Permission.ManageMessages)
    ) {
      throw new ForbiddenError(
        'Only the author or a moderator can delete this message',
      )
    }

    const deletedAt = new Date()
    await db.transaction(async (tx) => {
      await tx.insert(messageEdits).values({
        authenticationTag: message.authenticationTag,
        ciphertext: message.ciphertext,
        contentType: message.contentType,
        editorId: userId,
        messageEpoch: message.messageEpoch,
        migrationState: message.migrationState,
        nonce: message.nonce,
        protocolVersion: message.protocolVersion,
        senderDeviceId: message.senderDeviceId,
        id: createId(),
        messageId,
      })
      await tx
        .update(messages)
        .set({
          authenticationTag: null,
          ciphertext: null,
          contentType: null,
          deletedAt,
          editedAt: null,
          messageEpoch: null,
          migrationState: 'legacy_unconvertible',
          nonce: null,
          protocolVersion: null,
          senderDeviceId: null,
        })
        .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      await tx.insert(outboxEvents).values({
        aggregateId: messageId,
        aggregateType: 'message',
        aggregateVersion: 2,
        id: createId(),
        payload: {
          audience: {
            channelId: message.channelId,
            ...(authorization.channel.serverId
              ? { serverId: authorization.channel.serverId }
              : {}),
          },
          data: { channelId: message.channelId, messageId },
        },
        topic: 'message.deleted',
      })
    })
    return true
  }

  async setReaction(
    userId: string,
    messageId: string,
    emojiKey: string,
    active: boolean,
  ): Promise<boolean> {
    const { db } = requireDatabase(this.#app)
    const [message] = await db
      .select({
        channelId: messages.channelId,
        deletedAt: messages.deletedAt,
      })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)
    if (!message || message.deletedAt) {
      throw new NotFoundError('Message not found')
    }
    const authorization = await authorizeChannel(
      this.#app,
      userId,
      message.channelId,
      Permission.AddReactions,
    )
    const normalizedEmoji = emojiKey.trim()
    if (!normalizedEmoji) {
      throw new BadRequestError('Emoji key cannot be empty', 'INVALID_EMOJI')
    }

    await db.transaction(async (tx) => {
      if (active) {
        await tx
          .insert(messageReactions)
          .values({
            emojiKey: normalizedEmoji,
            messageId,
            userId,
          })
          .onConflictDoNothing()
      } else {
        await tx
          .delete(messageReactions)
          .where(
            and(
              eq(messageReactions.messageId, messageId),
              eq(messageReactions.emojiKey, normalizedEmoji),
              eq(messageReactions.userId, userId),
            ),
          )
      }
      await tx.insert(outboxEvents).values({
        aggregateId: messageId,
        aggregateType: 'message',
        id: createId(),
        payload: {
          audience: {
            channelId: message.channelId,
            ...(authorization.channel.serverId
              ? { serverId: authorization.channel.serverId }
              : {}),
          },
          data: {
            active,
            emojiKey: normalizedEmoji,
            messageId,
            userId,
          },
        },
        topic: 'message.reaction_changed',
      })
    })
    return active
  }

  async markRead(userId: string, channelId: string, lastReadMessageId: string) {
    await authorizeChannel(
      this.#app,
      userId,
      channelId,
      Permission.ReadMessageHistory,
    )
    const { db } = requireDatabase(this.#app)
    const [message] = await db
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.id, lastReadMessageId),
          eq(messages.channelId, channelId),
        ),
      )
      .limit(1)
    if (!message) {
      throw new BadRequestError(
        'Read marker message does not belong to this channel',
        'INVALID_READ_MARKER',
      )
    }

    const now = new Date()
    const [state] = await db
      .insert(channelReadStates)
      .values({
        channelId,
        lastReadAt: now,
        lastReadMessageId,
        mentionCount: 0,
        userId,
      })
      .onConflictDoUpdate({
        set: {
          lastReadAt: now,
          lastReadMessageId,
          mentionCount: 0,
        },
        target: [channelReadStates.channelId, channelReadStates.userId],
      })
      .returning()
    if (!state) throw new Error('Read state upsert returned no row')
    return {
      channelId: state.channelId,
      lastReadAt: state.lastReadAt.toISOString(),
      lastReadMessageId,
      mentionCount: state.mentionCount,
      userId: state.userId,
    }
  }
}
