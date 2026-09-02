import type {
  RealtimeEvent,
  SearchMessagesQuery,
  SearchServersQuery,
} from '@strafe/shared'
import { EncryptedChannelFlag } from '@strafe/shared'
import { and, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { Meilisearch } from 'meilisearch'

import {
  channelMembers,
  channels,
  messages,
  serverMembers,
  servers,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import { Permission } from '../../lib/permissions.js'
import {
  authorizeChannel,
  authorizeServer,
} from '../permissions/authorization.js'

interface MessageDocument {
  authorId: string | null
  channelId: string
  content: string
  createdAt: string
  id: string
  serverId: string | null
}

interface ServerDocument {
  description: string | null
  id: string
  memberCount: number
  name: string
  slug: string
  visibility: string
}

export class SearchService {
  readonly #app: FastifyInstance
  readonly #client: Meilisearch | null
  #available = false

  constructor(app: FastifyInstance) {
    this.#app = app
    this.#client = app.config.MEILISEARCH_HOST
      ? new Meilisearch({
          host: app.config.MEILISEARCH_HOST,
          ...(app.config.MEILISEARCH_API_KEY
            ? { apiKey: app.config.MEILISEARCH_API_KEY }
            : {}),
        })
      : null
  }

  async start(): Promise<void> {
    if (!this.#client) return
    try {
      await Promise.all([
        this.#client
          .index('messages')
          .updateFilterableAttributes(['channelId', 'serverId', 'authorId']),
        this.#client
          .index('servers')
          .updateFilterableAttributes(['id', 'visibility']),
      ])
      this.#available = true
    } catch (error) {
      if (this.#app.config.NODE_ENV === 'production') throw error
      this.#app.log.warn(
        { err: error },
        'Meilisearch unavailable; using PostgreSQL search',
      )
    }
  }

  async handleEvent(event: RealtimeEvent): Promise<void> {
    if (!this.#client || !this.#available || !event.aggregateId) return
    if (event.type.startsWith('message.')) {
      if (event.type === 'message.deleted') {
        await this.#client.index('messages').deleteDocument(event.aggregateId)
        return
      }
      const document = await this.#messageDocument(event.aggregateId)
      if (document) {
        await this.#client.index('messages').addDocuments([document])
      } else {
        // Also removes documents left behind when a channel becomes encrypted.
        await this.#client.index('messages').deleteDocument(event.aggregateId)
      }
      return
    }
    if (event.type.startsWith('server.')) {
      if (event.type === 'server.deleted') {
        await this.#client.index('servers').deleteDocument(event.aggregateId)
        return
      }
      const document = await this.#serverDocument(event.aggregateId)
      if (document) await this.#client.index('servers').addDocuments([document])
    }
  }

  async messages(userId: string, query: SearchMessagesQuery) {
    const limit = query.limit ?? 25
    const offset = query.offset ?? 0
    const channelIds = await this.#visibleChannelIds(
      userId,
      query.serverId,
      query.channelId,
    )
    if (channelIds.length === 0) {
      return { estimatedTotalHits: 0, hits: [], limit, offset }
    }
    if (this.#client && this.#available) {
      const result = await this.#client
        .index<MessageDocument>('messages')
        .search(query.q.trim(), {
          filter: `channelId IN [${channelIds.map((id) => JSON.stringify(id)).join(',')}]`,
          limit,
          offset,
        })
      return {
        estimatedTotalHits: result.estimatedTotalHits ?? result.hits.length,
        hits: result.hits.map((hit) => ({
          authorId: hit.authorId,
          channelId: hit.channelId,
          content: hit.content,
          createdAt: hit.createdAt,
          id: hit.id,
          serverId: hit.serverId,
        })),
        limit,
        offset,
      }
    }

    const escaped = query.q
      .trim()
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_')
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select({
        authorId: messages.authorId,
        channelId: messages.channelId,
        content: messages.content,
        createdAt: messages.createdAt,
        id: messages.id,
        serverId: channels.serverId,
      })
      .from(messages)
      .innerJoin(channels, eq(channels.id, messages.channelId))
      .where(
        and(
          inArray(messages.channelId, channelIds),
          sql`(${channels.flags} & ${EncryptedChannelFlag}) = 0`,
          isNull(messages.deletedAt),
          ilike(messages.content, `%${escaped}%`),
        ),
      )
      .orderBy(messages.createdAt)
      .limit(limit)
      .offset(offset)
    return {
      estimatedTotalHits: rows.length,
      hits: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      limit,
      offset,
    }
  }

  async servers(userId: string, query: SearchServersQuery) {
    const limit = query.limit ?? 25
    const offset = query.offset ?? 0
    const { db } = requireDatabase(this.#app)
    const memberships = await db
      .select({ serverId: serverMembers.serverId })
      .from(serverMembers)
      .where(
        and(
          eq(serverMembers.userId, userId),
          eq(serverMembers.state, 'active'),
        ),
      )
    const memberIds = memberships.map((membership) => membership.serverId)
    if (this.#client && this.#available) {
      const membershipFilter = memberIds.length
        ? ` OR id IN [${memberIds.map((id) => JSON.stringify(id)).join(',')}]`
        : ''
      const result = await this.#client
        .index<ServerDocument>('servers')
        .search(query.q.trim(), {
          filter: `visibility = "public"${membershipFilter}`,
          limit,
          offset,
        })
      return {
        estimatedTotalHits: result.estimatedTotalHits ?? result.hits.length,
        hits: result.hits.map((hit) => ({
          description: hit.description,
          id: hit.id,
          memberCount: hit.memberCount,
          name: hit.name,
          slug: hit.slug,
        })),
        limit,
        offset,
      }
    }
    const visibility = memberIds.length
      ? or(eq(servers.visibility, 'public'), inArray(servers.id, memberIds))
      : eq(servers.visibility, 'public')
    const rows = await db
      .select({
        description: servers.description,
        id: servers.id,
        memberCount: servers.memberCount,
        name: servers.name,
        slug: servers.slug,
      })
      .from(servers)
      .where(
        and(
          isNull(servers.deletedAt),
          visibility,
          ilike(servers.name, `%${query.q.trim()}%`),
        ),
      )
      .limit(limit)
      .offset(offset)
    return { estimatedTotalHits: rows.length, hits: rows, limit, offset }
  }

  async #visibleChannelIds(
    userId: string,
    serverId?: string,
    channelId?: string,
  ): Promise<string[]> {
    if (channelId) {
      const authorization = await authorizeChannel(
        this.#app,
        userId,
        channelId,
        Permission.ReadMessageHistory,
      )
      if (serverId && authorization.channel.serverId !== serverId) return []
      return [channelId]
    }
    if (serverId) {
      await authorizeServer(this.#app, userId, serverId, Permission.ViewChannel)
    }
    const { db } = requireDatabase(this.#app)
    const serverChannels = await db
      .select({ id: channels.id })
      .from(channels)
      .innerJoin(serverMembers, eq(serverMembers.serverId, channels.serverId))
      .where(
        and(
          eq(serverMembers.userId, userId),
          eq(serverMembers.state, 'active'),
          isNull(channels.deletedAt),
          sql`(${channels.flags} & ${EncryptedChannelFlag}) = 0`,
          ...(serverId ? [eq(channels.serverId, serverId)] : []),
        ),
      )
      .limit(5_000)
    const directChannels = serverId
      ? []
      : await db
          .select({ id: channelMembers.channelId })
          .from(channelMembers)
          .innerJoin(channels, eq(channels.id, channelMembers.channelId))
          .where(
            and(
              eq(channelMembers.userId, userId),
              isNull(channels.serverId),
              isNull(channels.deletedAt),
              sql`(${channels.flags} & ${EncryptedChannelFlag}) = 0`,
            ),
          )
          .limit(1_000)
    const visible: string[] = []
    for (const { id } of [...serverChannels, ...directChannels]) {
      try {
        await authorizeChannel(
          this.#app,
          userId,
          id,
          Permission.ReadMessageHistory,
        )
        visible.push(id)
      } catch {
        // Channel overwrites intentionally hide this channel from search.
      }
    }
    return visible
  }

  async #messageDocument(messageId: string): Promise<MessageDocument | null> {
    const { db } = requireDatabase(this.#app)
    const [row] = await db
      .select({
        authorId: messages.authorId,
        channelId: messages.channelId,
        content: messages.content,
        createdAt: messages.createdAt,
        deletedAt: messages.deletedAt,
        id: messages.id,
        serverId: channels.serverId,
        channelFlags: channels.flags,
      })
      .from(messages)
      .innerJoin(channels, eq(channels.id, messages.channelId))
      .where(eq(messages.id, messageId))
      .limit(1)
    if (
      !row ||
      row.deletedAt ||
      (row.channelFlags & EncryptedChannelFlag) !== 0
    )
      return null
    const { channelFlags: _channelFlags, ...document } = row
    return { ...document, createdAt: row.createdAt.toISOString() }
  }

  async #serverDocument(serverId: string): Promise<ServerDocument | null> {
    const { db } = requireDatabase(this.#app)
    const [row] = await db
      .select()
      .from(servers)
      .where(and(eq(servers.id, serverId), isNull(servers.deletedAt)))
      .limit(1)
    if (!row) return null
    return {
      description: row.description,
      id: row.id,
      memberCount: row.memberCount,
      name: row.name,
      slug: row.slug,
      visibility: row.visibility,
    }
  }
}
