import type {
  UpdateUserBody,
  UpdateUserSettingsBody,
  UserSettings,
  WebPushSubscriptionBody,
} from '@strafe/shared'
import { and, eq, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  pushSubscriptions,
  notifications,
  userBlocks,
  userProfiles,
  userRelationships,
  users,
  userSettings,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import { ConflictError, NotFoundError } from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'

export class UserService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async getUser(userId: string) {
    const { db } = requireDatabase(this.#app)
    const [user] = await db
      .select({
        avatarUrl: userProfiles.avatarFileId, // mapping this is simplified for now
        createdAt: users.createdAt,
        displayName: userProfiles.displayName,
        handle: users.handle,
        id: users.id,
        status: users.status,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) throw new NotFoundError('User not found')
    return user
  }

  async updateProfile(userId: string, data: UpdateUserBody) {
    const { db } = requireDatabase(this.#app)
    await db
      .update(userProfiles)
      .set({
        ...(data.displayName !== undefined
          ? { displayName: data.displayName }
          : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.pronouns !== undefined ? { pronouns: data.pronouns } : {}),
        ...(data.avatarFileId !== undefined
          ? { avatarFileId: data.avatarFileId }
          : {}),
        ...(data.bannerFileId !== undefined
          ? { bannerFileId: data.bannerFileId }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
  }

  async updateSettings(userId: string, data: UpdateUserSettingsBody) {
    const { db } = requireDatabase(this.#app)
    const { customStatusExpiresAt, ...settings } = data
    await db
      .update(userSettings)
      .set({
        ...settings,
        ...(customStatusExpiresAt !== undefined
          ? {
              customStatusExpiresAt: customStatusExpiresAt
                ? new Date(customStatusExpiresAt)
                : null,
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId))
  }

  async getSettings(userId: string): Promise<UserSettings> {
    const { db } = requireDatabase(this.#app)
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1)

    if (!settings) throw new NotFoundError('Settings not found')
    // Safe casting since schema matches
    return settings as unknown as UserSettings
  }

  async createRelationship(requesterId: string, addresseeId: string) {
    const { db } = requireDatabase(this.#app)
    if (requesterId === addresseeId) {
      throw new ConflictError('Cannot befriend yourself')
    }

    await db.transaction(async (tx) => {
      const pair = [requesterId, addresseeId].sort().join(':')
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`friend:${pair}`}))`,
      )
      const [blocked] = await tx
        .select({ id: userBlocks.blockerId })
        .from(userBlocks)
        .where(
          or(
            and(
              eq(userBlocks.blockerId, requesterId),
              eq(userBlocks.blockedId, addresseeId),
            ),
            and(
              eq(userBlocks.blockerId, addresseeId),
              eq(userBlocks.blockedId, requesterId),
            ),
          ),
        )
        .limit(1)
      if (blocked) throw new ConflictError('Friend request is unavailable')
      const [existing] = await tx
        .select()
        .from(userRelationships)
        .where(
          or(
            and(
              eq(userRelationships.requesterId, requesterId),
              eq(userRelationships.addresseeId, addresseeId),
            ),
            and(
              eq(userRelationships.requesterId, addresseeId),
              eq(userRelationships.addresseeId, requesterId),
            ),
          ),
        )
        .limit(1)
      if (
        existing?.status === 'accepted' ||
        existing?.requesterId === requesterId
      ) {
        throw new ConflictError('Relationship already exists')
      }
      if (existing) {
        await tx
          .update(userRelationships)
          .set({ status: 'accepted', acceptedAt: new Date() })
          .where(
            and(
              eq(userRelationships.requesterId, existing.requesterId),
              eq(userRelationships.addresseeId, existing.addresseeId),
            ),
          )
      } else {
        await tx
          .insert(userRelationships)
          .values({ addresseeId, requesterId, status: 'pending' })
        await tx
          .insert(notifications)
          .values({
            id: createId(),
            userId: addresseeId,
            type: 'friend_request',
            data: { actorId: requesterId },
          })
      }
    })
  }

  async updateRelationshipStatus(
    userId: string,
    relationId: string,
    status: 'accepted' | 'declined',
  ) {
    const { db } = requireDatabase(this.#app)
    const res = await db
      .update(userRelationships)
      .set({ status, acceptedAt: status === 'accepted' ? new Date() : null })
      .where(
        and(
          eq(userRelationships.addresseeId, userId),
          eq(userRelationships.requesterId, relationId),
          eq(userRelationships.status, 'pending'),
        ),
      )
    if (res.rowCount === 0) throw new NotFoundError('Relationship not found')
  }

  async deleteRelationship(userId: string, relationId: string) {
    const { db } = requireDatabase(this.#app)
    await db
      .delete(userRelationships)
      .where(
        and(
          or(
            eq(userRelationships.requesterId, userId),
            eq(userRelationships.addresseeId, userId),
          ),
          or(
            eq(userRelationships.requesterId, relationId),
            eq(userRelationships.addresseeId, relationId),
          ),
        ),
      )
  }

  async listRelationships(userId: string) {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(userRelationships)
      .where(
        or(
          eq(userRelationships.requesterId, userId),
          eq(userRelationships.addresseeId, userId),
        ),
      )
    return Promise.all(
      rows.map(async (relationship) => ({
        ...relationship,
        createdAt: relationship.createdAt.toISOString(),
        user: await this.getUser(
          relationship.requesterId === userId
            ? relationship.addresseeId
            : relationship.requesterId,
        ),
      })),
    )
  }

  async block(userId: string, targetId: string) {
    if (userId === targetId) throw new ConflictError('Cannot block yourself')
    const { db } = requireDatabase(this.#app)
    await db.transaction(async (tx) => {
      await tx
        .delete(userRelationships)
        .where(
          or(
            and(
              eq(userRelationships.requesterId, userId),
              eq(userRelationships.addresseeId, targetId),
            ),
            and(
              eq(userRelationships.requesterId, targetId),
              eq(userRelationships.addresseeId, userId),
            ),
          ),
        )
      await tx
        .insert(userBlocks)
        .values({ blockerId: userId, blockedId: targetId })
        .onConflictDoNothing()
    })
  }

  async unblock(userId: string, targetId: string) {
    const { db } = requireDatabase(this.#app)
    await db
      .delete(userBlocks)
      .where(
        and(
          eq(userBlocks.blockerId, userId),
          eq(userBlocks.blockedId, targetId),
        ),
      )
  }

  async listBlocks(userId: string) {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, userId))
    return Promise.all(
      rows.map(async (block) => ({
        blockedAt: block.createdAt.toISOString(),
        user: await this.getUser(block.blockedId),
      })),
    )
  }

  async addPushSubscription(userId: string, data: WebPushSubscriptionBody) {
    const { db } = requireDatabase(this.#app)
    await db
      .insert(pushSubscriptions)
      .values({
        id: createId(),
        userId,
        endpoint: data.endpoint,
        keys: data.keys,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { keys: data.keys, revokedAt: null },
      })
  }
}
