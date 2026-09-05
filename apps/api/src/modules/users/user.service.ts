import type { UpdateUserBody, UpdateUserSettingsBody, UserSettings, UserRelationship, WebPushSubscriptionBody } from '@strafe/shared'
import { and, eq, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  pushSubscriptions,
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
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.pronouns !== undefined ? { pronouns: data.pronouns } : {}),
        ...(data.avatarFileId !== undefined ? { avatarFileId: data.avatarFileId } : {}),
        ...(data.bannerFileId !== undefined ? { bannerFileId: data.bannerFileId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, userId))
  }

  async updateSettings(userId: string, data: UpdateUserSettingsBody) {
    const { db } = requireDatabase(this.#app)
    await db
      .update(userSettings)
      .set({
        ...data,
        customStatusExpiresAt: data.customStatusExpiresAt ? new Date(data.customStatusExpiresAt) : null,
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

    await db.insert(userRelationships).values({
      addresseeId,
      requesterId,
      status: 'pending',
    }).onConflictDoNothing()
  }

  async updateRelationshipStatus(userId: string, relationId: string, status: 'accepted' | 'declined') {
    const { db } = requireDatabase(this.#app)
    const res = await db.update(userRelationships)
      .set({ status, acceptedAt: status === 'accepted' ? new Date() : null })
      .where(
        and(
          or(
            eq(userRelationships.requesterId, userId),
            eq(userRelationships.addresseeId, userId)
          ),
          or(
            eq(userRelationships.requesterId, relationId),
            eq(userRelationships.addresseeId, relationId)
          )
        )
      )
    if (res.rowCount === 0) throw new NotFoundError('Relationship not found')
  }

  async deleteRelationship(userId: string, relationId: string) {
    const { db } = requireDatabase(this.#app)
    await db.delete(userRelationships)
      .where(
        and(
          or(
            eq(userRelationships.requesterId, userId),
            eq(userRelationships.addresseeId, userId)
          ),
          or(
            eq(userRelationships.requesterId, relationId),
            eq(userRelationships.addresseeId, relationId)
          )
        )
      )
  }

  async listRelationships(userId: string) {
    const { db } = requireDatabase(this.#app)
    return await db.select()
      .from(userRelationships)
      .where(
        or(
          eq(userRelationships.requesterId, userId),
          eq(userRelationships.addresseeId, userId)
        )
      )
  }

  async addPushSubscription(userId: string, data: WebPushSubscriptionBody) {
    const { db } = requireDatabase(this.#app)
    await db.insert(pushSubscriptions)
      .values({
        id: createId(),
        userId,
        endpoint: data.endpoint,
        keys: data.keys,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { keys: data.keys, revokedAt: null }
      })
  }
}
