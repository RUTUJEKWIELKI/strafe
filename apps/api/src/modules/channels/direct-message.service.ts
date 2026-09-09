import type {
  Channel,
  Conversation,
  CreateDirectMessageBody,
  CreateGroupDirectMessageBody,
} from '@strafe/shared'
import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { FastifyInstance } from 'fastify'

import {
  channelMembers,
  channels,
  conversationEvents,
  directConversations,
  outboxEvents,
  serverMembers,
  userBlocks,
  userRelationships,
  userSettings,
  userProfiles,
  users,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'

function mapChannel(row: typeof channels.$inferSelect): Channel {
  return {
    archivedAt: row.archivedAt?.toISOString() ?? null,
    flags: row.flags,
    id: row.id,
    name: row.name,
    parentId: row.parentId,
    positionKey: row.positionKey,
    serverId: row.serverId,
    slowmodeSeconds: row.slowmodeSeconds,
    topic: row.topic,
    type: row.type as Channel['type'],
  }
}

export class DirectMessageService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async create(
    userId: string,
    input: CreateDirectMessageBody,
    ip = 'unknown',
  ): Promise<Channel> {
    await this.#app.abusePrevention.check({
      action: 'dm.create',
      actorId: userId,
      ip,
    })
    if (userId === input.recipientId) {
      throw new BadRequestError(
        'A direct conversation requires another user',
        'INVALID_DM_RECIPIENT',
      )
    }
    const { db } = requireDatabase(this.#app)
    const [recipient] = await db
      .select({
        allowDmsFrom: userSettings.allowDmsFrom,
        id: users.id,
      })
      .from(users)
      .innerJoin(userSettings, eq(userSettings.userId, users.id))
      .where(
        and(
          eq(users.id, input.recipientId),
          eq(users.status, 'active'),
          isNull(users.deletedAt),
        ),
      )
      .limit(1)
    if (!recipient) throw new NotFoundError('Recipient not found')

    const [block] = await db
      .select({ blockerId: userBlocks.blockerId })
      .from(userBlocks)
      .where(
        or(
          and(
            eq(userBlocks.blockerId, userId),
            eq(userBlocks.blockedId, input.recipientId),
          ),
          and(
            eq(userBlocks.blockerId, input.recipientId),
            eq(userBlocks.blockedId, userId),
          ),
        ),
      )
      .limit(1)
    if (block) {
      throw new ForbiddenError('Direct messages are unavailable for this user')
    }

    if (recipient.allowDmsFrom !== 'everyone') {
      const [friendship] = await db
        .select({ requesterId: userRelationships.requesterId })
        .from(userRelationships)
        .where(
          and(
            eq(userRelationships.status, 'accepted'),
            or(
              and(
                eq(userRelationships.requesterId, userId),
                eq(userRelationships.addresseeId, input.recipientId),
              ),
              and(
                eq(userRelationships.requesterId, input.recipientId),
                eq(userRelationships.addresseeId, userId),
              ),
            ),
          ),
        )
        .limit(1)

      if (recipient.allowDmsFrom === 'nobody') {
        throw new ForbiddenError(
          'The recipient does not accept direct messages',
        )
      }
      if (recipient.allowDmsFrom === 'friends' && !friendship) {
        throw new ForbiddenError(
          'The recipient accepts direct messages from friends only',
        )
      }
      if (recipient.allowDmsFrom === 'server_members' && !friendship) {
        const mine = alias(serverMembers, 'mine')
        const theirs = alias(serverMembers, 'theirs')
        const [sharedServer] = await db
          .select({ serverId: mine.serverId })
          .from(mine)
          .innerJoin(theirs, eq(theirs.serverId, mine.serverId))
          .where(
            and(
              eq(mine.userId, userId),
              eq(mine.state, 'active'),
              eq(theirs.userId, input.recipientId),
              eq(theirs.state, 'active'),
            ),
          )
          .limit(1)
        if (!sharedServer) {
          throw new ForbiddenError(
            'The recipient accepts messages from shared server members only',
          )
        }
      }
    }

    const [lowerUserId, higherUserId] = [userId, input.recipientId].sort()
    if (!lowerUserId || !higherUserId) {
      throw new Error('Unable to order DM participants')
    }
    const lockKey = `dm:${lowerUserId}:${higherUserId}`

    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${lockKey}))`)
      const [existing] = await tx
        .select({ channel: channels })
        .from(directConversations)
        .innerJoin(channels, eq(channels.id, directConversations.channelId))
        .where(
          and(
            eq(directConversations.lowerUserId, lowerUserId),
            eq(directConversations.higherUserId, higherUserId),
          ),
        )
        .limit(1)
      if (existing) return mapChannel(existing.channel)

      const channelId = createId()
      const [channel] = await tx
        .insert(channels)
        .values({
          id: channelId,
          name: 'Direct Message',
          ownerId: userId,
          positionKey: '000000',
          serverId: null,
          type: 'dm',
        })
        .returning()
      if (!channel) throw new Error('DM channel insert returned no row')
      await tx.insert(channelMembers).values([
        { channelId, userId },
        { channelId, userId: input.recipientId },
      ])
      await tx.insert(directConversations).values({
        channelId,
        higherUserId,
        lowerUserId,
      })
      await tx.insert(outboxEvents).values({
        aggregateId: channelId,
        aggregateType: 'channel',
        id: createId(),
        payload: {
          audience: { userIds: [userId, input.recipientId] },
          data: {
            channelId,
            recipientIds: [userId, input.recipientId],
          },
        },
        topic: 'channel.dm_created',
      })
      return mapChannel(channel)
    })
  }

  async list(userId: string): Promise<Channel[]> {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select({ channel: channels })
      .from(channelMembers)
      .innerJoin(channels, eq(channels.id, channelMembers.channelId))
      .where(
        and(
          eq(channelMembers.userId, userId),
          isNull(channels.serverId),
          isNull(channels.deletedAt),
        ),
      )
      .orderBy(channels.updatedAt)
    return rows.map(({ channel }) => mapChannel(channel))
  }

  async listConversations(userId: string): Promise<Conversation[]> {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select({ channel: channels })
      .from(channelMembers)
      .innerJoin(channels, eq(channels.id, channelMembers.channelId))
      .where(
        and(
          eq(channelMembers.userId, userId),
          isNull(channels.serverId),
          isNull(channels.deletedAt),
        ),
      )
      .orderBy(sql`${channels.updatedAt} desc`)
    if (rows.length === 0) return []
    const ids = rows.map(({ channel }) => channel.id)
    const members = await db
      .select({
        avatarUrl: userProfiles.avatarFileId,
        channelId: channelMembers.channelId,
        displayName: userProfiles.displayName,
        handle: users.handle,
        id: users.id,
        joinedAt: channelMembers.joinedAt,
        role: channelMembers.role,
      })
      .from(channelMembers)
      .innerJoin(users, eq(users.id, channelMembers.userId))
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(inArray(channelMembers.channelId, ids))
    return rows.map(({ channel }) => ({
      ...mapChannel(channel),
      members: members
        .filter((member) => member.channelId === channel.id)
        .map((member) => ({
          joinedAt: member.joinedAt.toISOString(),
          role: member.role as 'owner' | 'member',
          user: {
            avatarUrl: member.avatarUrl,
            displayName: member.displayName,
            handle: member.handle,
            id: member.id,
          },
        })),
    }))
  }

  async createGroup(
    userId: string,
    input: CreateGroupDirectMessageBody,
    ip = 'unknown',
  ): Promise<Conversation> {
    await this.#app.abusePrevention.check({
      action: 'dm.create',
      actorId: userId,
      ip,
    })
    const memberIds = [...new Set(input.memberIds)]
    if (memberIds.includes(userId))
      throw new BadRequestError('Creator must not be included in memberIds')
    const { db } = requireDatabase(this.#app)
    const activeUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          inArray(users.id, memberIds),
          eq(users.status, 'active'),
          isNull(users.deletedAt),
        ),
      )
    if (activeUsers.length !== memberIds.length)
      throw new NotFoundError('One or more users were not found')
    const blocks = await db
      .select()
      .from(userBlocks)
      .where(
        or(
          and(
            eq(userBlocks.blockerId, userId),
            inArray(userBlocks.blockedId, memberIds),
          ),
          and(
            inArray(userBlocks.blockerId, memberIds),
            eq(userBlocks.blockedId, userId),
          ),
        ),
      )
    if (blocks.length)
      throw new ForbiddenError('A blocked user cannot be added to the group')
    const channelId = createId()
    await db.transaction(async (tx) => {
      await tx.insert(channels).values({
        id: channelId,
        name: input.name.trim(),
        ownerId: userId,
        positionKey: '000000',
        type: 'group_dm',
      })
      await tx.insert(channelMembers).values([
        { channelId, userId, role: 'owner' },
        ...memberIds.map((memberId) => ({
          channelId,
          userId: memberId,
          role: 'member' as const,
        })),
      ])
      await tx.insert(conversationEvents).values(
        memberIds.map((targetId) => ({
          actorId: userId,
          channelId,
          id: createId(),
          targetId,
          type: 'member_added',
        })),
      )
      await tx.insert(outboxEvents).values({
        aggregateId: channelId,
        aggregateType: 'channel',
        id: createId(),
        payload: {
          audience: { userIds: [userId, ...memberIds] },
          data: { channelId },
        },
        topic: 'channel.group_created',
      })
    })
    return (await this.listConversations(userId)).find(
      (conversation) => conversation.id === channelId,
    )!
  }
}
