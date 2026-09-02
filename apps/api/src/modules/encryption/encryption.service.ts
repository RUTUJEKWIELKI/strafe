import type {
  PublishKeyBundleBody,
  RotateEncryptionSessionsBody,
} from '@strafe/shared'
import { and, asc, eq, gt, isNull, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { FastifyInstance } from 'fastify'
import {
  createPublicKey,
  createHash,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto'

import * as schema from '../../db/schema.js'
import {
  deviceIdentityKeys,
  encryptionSessionEpochs,
  keyBundleVersions,
  keyRevocations,
  keyTransparencyCheckpoints,
  keyTransparencyLeaves,
  oneTimePrekeys,
  signedPrekeys,
  userDevices,
  userSessions,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'
import type { AuthContext } from '../auth/auth.service.js'
import { inclusionProof, leafHash, merkleRoot } from './transparency.js'

type Database = NodePgDatabase<typeof schema>
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

const fingerprint = (key: string) =>
  createHash('sha256').update(key).digest('base64url')

export class EncryptionService {
  constructor(
    private readonly app: FastifyInstance,
    private readonly checkpointKey: KeyObject,
  ) {}

  private async activeDevice(auth: AuthContext): Promise<string> {
    const { db } = requireDatabase(this.app)
    const [session] = await db
      .select({ deviceId: userSessions.deviceId })
      .from(userSessions)
      .innerJoin(userDevices, eq(userDevices.id, userSessions.deviceId))
      .where(
        and(
          eq(userSessions.id, auth.sessionId),
          eq(userSessions.userId, auth.userId),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .limit(1)
    if (!session?.deviceId)
      throw new ForbiddenError('An active device session is required')
    return session.deviceId
  }

  async publish(auth: AuthContext, input: PublishKeyBundleBody) {
    const deviceId = await this.activeDevice(auth)
    let identityKey: KeyObject
    try {
      identityKey = createPublicKey({
        key: Buffer.from(input.identityKey, 'base64url'),
        format: 'der',
        type: 'spki',
      })
    } catch {
      throw new BadRequestError(
        'Invalid Ed25519 identity key',
        'INVALID_IDENTITY_KEY',
      )
    }
    const signed = Buffer.from(
      `${input.version}:${input.signedPrekey.keyId}:${input.signedPrekey.publicKey}`,
    )
    if (
      !verify(
        null,
        signed,
        identityKey,
        Buffer.from(input.signedPrekey.signature, 'base64url'),
      )
    ) {
      throw new BadRequestError(
        'Signed prekey signature is invalid',
        'INVALID_PREKEY_SIGNATURE',
      )
    }
    const body = JSON.stringify({
      deviceId,
      identityKey: input.identityKey,
      signedPrekey: input.signedPrekey,
      userId: auth.userId,
      version: input.version,
    })
    const { db } = requireDatabase(this.app)
    return db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${deviceId}))`)
      const [current] = await tx
        .select()
        .from(keyBundleVersions)
        .where(eq(keyBundleVersions.deviceId, deviceId))
        .limit(1)
      if (current && input.version <= current.version)
        throw new ConflictError(
          'Key bundle version must increase',
          'KEY_BUNDLE_ROLLBACK',
        )
      const [existingIdentity] = await tx
        .select()
        .from(deviceIdentityKeys)
        .where(eq(deviceIdentityKeys.deviceId, deviceId))
        .limit(1)
      if (
        existingIdentity &&
        existingIdentity.publicKey !== input.identityKey
      ) {
        await tx.insert(keyRevocations).values({
          deviceId,
          id: createId(),
          keyFingerprint: fingerprint(existingIdentity.publicKey),
          reason: 'identity_key_rotated',
          userId: auth.userId,
        })
      }
      await tx
        .insert(deviceIdentityKeys)
        .values({ deviceId, publicKey: input.identityKey, userId: auth.userId })
        .onConflictDoUpdate({
          target: deviceIdentityKeys.deviceId,
          set: { publicKey: input.identityKey, revokedAt: null },
        })
      await tx
        .insert(keyBundleVersions)
        .values({ deviceId, version: input.version })
        .onConflictDoUpdate({
          target: keyBundleVersions.deviceId,
          set: { updatedAt: new Date(), version: input.version },
        })
      await tx.insert(signedPrekeys).values({
        deviceId,
        keyId: input.signedPrekey.keyId,
        publicKey: input.signedPrekey.publicKey,
        signature: input.signedPrekey.signature,
        version: input.version,
      })
      if (input.oneTimePrekeys.length)
        await tx.insert(oneTimePrekeys).values(
          input.oneTimePrekeys.map((key) => ({
            ...key,
            deviceId,
            version: input.version,
          })),
        )
      return this.append(tx, body)
    })
  }

  async consume(userId: string, deviceId: string) {
    const { db } = requireDatabase(this.app)
    return db.transaction(async (tx) => {
      const [bundle] = await tx
        .select({
          deviceId: deviceIdentityKeys.deviceId,
          identityKey: deviceIdentityKeys.publicKey,
          userId: deviceIdentityKeys.userId,
          version: keyBundleVersions.version,
        })
        .from(deviceIdentityKeys)
        .innerJoin(
          keyBundleVersions,
          eq(keyBundleVersions.deviceId, deviceIdentityKeys.deviceId),
        )
        .where(
          and(
            eq(deviceIdentityKeys.userId, userId),
            eq(deviceIdentityKeys.deviceId, deviceId),
            isNull(deviceIdentityKeys.revokedAt),
          ),
        )
        .limit(1)
      if (!bundle) throw new NotFoundError('Active device key bundle not found')
      const [signedKey] = await tx
        .select()
        .from(signedPrekeys)
        .where(
          and(
            eq(signedPrekeys.deviceId, deviceId),
            eq(signedPrekeys.version, bundle.version),
          ),
        )
        .limit(1)
      if (!signedKey) throw new NotFoundError('Signed prekey not found')
      const [oneTime] = await tx
        .select()
        .from(oneTimePrekeys)
        .where(
          and(
            eq(oneTimePrekeys.deviceId, deviceId),
            isNull(oneTimePrekeys.consumedAt),
          ),
        )
        .orderBy(asc(oneTimePrekeys.keyId))
        .limit(1)
        .for('update', { skipLocked: true })
      if (oneTime)
        await tx
          .update(oneTimePrekeys)
          .set({ consumedAt: new Date() })
          .where(
            and(
              eq(oneTimePrekeys.deviceId, deviceId),
              eq(oneTimePrekeys.keyId, oneTime.keyId),
            ),
          )
      const leaves = await tx
        .select()
        .from(keyTransparencyLeaves)
        .orderBy(asc(keyTransparencyLeaves.index))
      const leafIndex = [...leaves]
        .reverse()
        .find((leaf) => JSON.parse(leaf.body).deviceId === deviceId)?.index
      if (leafIndex === undefined)
        throw new NotFoundError('Transparency entry not found')
      const [checkpoint] = await tx
        .select()
        .from(keyTransparencyCheckpoints)
        .orderBy(sql`${keyTransparencyCheckpoints.size} desc`)
        .limit(1)
      return {
        bundle: {
          ...bundle,
          oneTimePrekey: oneTime
            ? { keyId: oneTime.keyId, publicKey: oneTime.publicKey }
            : null,
          signedPrekey: {
            keyId: signedKey.keyId,
            publicKey: signedKey.publicKey,
            signature: signedKey.signature,
            version: signedKey.version,
          },
        },
        checkpoint: {
          ...checkpoint!,
          createdAt: checkpoint!.createdAt.toISOString(),
        },
        inclusionProof: inclusionProof(
          leaves.map((leaf) => leaf.hash),
          leafIndex,
        ),
        leafIndex,
      }
    })
  }

  async removeDevice(auth: AuthContext, deviceId: string, reason: string) {
    const activeDeviceId = await this.activeDevice(auth)
    const { db } = requireDatabase(this.app)
    return db.transaction(async (tx) => {
      const [key] = await tx
        .select()
        .from(deviceIdentityKeys)
        .where(
          and(
            eq(deviceIdentityKeys.deviceId, deviceId),
            eq(deviceIdentityKeys.userId, auth.userId),
          ),
        )
        .limit(1)
      if (!key) throw new NotFoundError('Device key not found')
      await tx
        .update(deviceIdentityKeys)
        .set({ revokedAt: new Date() })
        .where(eq(deviceIdentityKeys.deviceId, deviceId))
      await tx
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(userSessions.deviceId, deviceId))
      await tx.insert(keyRevocations).values({
        deviceId,
        id: createId(),
        keyFingerprint: fingerprint(key.publicKey),
        reason,
        userId: auth.userId,
      })
      await this.append(
        tx,
        JSON.stringify({
          action: 'revoke',
          deviceId,
          reason,
          userId: auth.userId,
        }),
      )
      return {
        removed: true,
        currentDeviceRemoved: activeDeviceId === deviceId,
      }
    })
  }

  async rotate(auth: AuthContext, input: RotateEncryptionSessionsBody) {
    await this.activeDevice(auth)
    const { db } = requireDatabase(this.app)
    await db.transaction(async (tx) => {
      for (const conversationId of input.conversationIds)
        await tx
          .insert(encryptionSessionEpochs)
          .values({ conversationId, reason: input.reason })
          .onConflictDoUpdate({
            target: encryptionSessionEpochs.conversationId,
            set: {
              epoch: sql`${encryptionSessionEpochs.epoch} + 1`,
              reason: input.reason,
              rotatedAt: new Date(),
            },
          })
    })
    return { rotated: input.conversationIds.length }
  }

  async consistency(fromSize: number) {
    const { db } = requireDatabase(this.app)
    const [previous] = await db
      .select()
      .from(keyTransparencyCheckpoints)
      .where(eq(keyTransparencyCheckpoints.size, fromSize))
      .limit(1)
    if (!previous) throw new NotFoundError('Previous checkpoint not found')
    const leaves = await db
      .select({ hash: keyTransparencyLeaves.hash })
      .from(keyTransparencyLeaves)
      .orderBy(asc(keyTransparencyLeaves.index))
    const [checkpoint] = await db
      .select()
      .from(keyTransparencyCheckpoints)
      .orderBy(sql`${keyTransparencyCheckpoints.size} desc`)
      .limit(1)
    if (!checkpoint)
      throw new NotFoundError('Transparency checkpoint not found')
    return {
      checkpoint: {
        ...checkpoint!,
        createdAt: checkpoint!.createdAt.toISOString(),
      },
      consistencyProof: leaves.map((leaf) => leaf.hash),
      fromSize,
    }
  }

  private async append(tx: Transaction, body: string) {
    await tx.execute(sql`select pg_advisory_xact_lock(193747623)`)
    const leaves = await tx
      .select()
      .from(keyTransparencyLeaves)
      .orderBy(asc(keyTransparencyLeaves.index))
    const index = leaves.length
    const hash = leafHash(body)
    const hashes = [...leaves.map((leaf: { hash: string }) => leaf.hash), hash]
    const rootHash = merkleRoot(hashes)
    const signature = sign(
      null,
      Buffer.from(`${hashes.length}:${rootHash}`),
      this.checkpointKey,
    ).toString('base64url')
    const [leaf] = await tx
      .insert(keyTransparencyLeaves)
      .values({ body, hash, index })
      .returning()
    const [checkpoint] = await tx
      .insert(keyTransparencyCheckpoints)
      .values({ rootHash, signature, size: hashes.length })
      .returning()
    return {
      checkpoint: {
        ...checkpoint!,
        createdAt: checkpoint!.createdAt.toISOString(),
      },
      leafIndex: leaf!.index,
    }
  }
}
