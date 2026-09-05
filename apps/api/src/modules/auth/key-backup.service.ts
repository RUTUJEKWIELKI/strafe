import type { PutKeyBackupBody } from '@strafe/shared'
import { and, desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { encryptedKeyBackups, userDevices } from '../../db/schema.js'
import { isPostgresError, requireDatabase } from '../../lib/database.js'
import { ConflictError } from '../../lib/errors.js'
import type { AuthContext } from './auth.service.js'

export class KeyBackupService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async getLatest(context: AuthContext) {
    const { db } = requireDatabase(this.#app)
    const [backup] = await db
      .select()
      .from(encryptedKeyBackups)
      .where(eq(encryptedKeyBackups.userId, context.userId))
      .orderBy(desc(encryptedKeyBackups.version))
      .limit(1)

    return {
      backup: backup ? this.#serialize(backup) : null,
      latestVersion: backup?.version ?? 0,
    }
  }

  async put(context: AuthContext, input: PutKeyBackupBody) {
    if (input.version !== input.expectedPreviousVersion + 1) {
      throw new ConflictError(
        'Backup version must immediately follow expectedPreviousVersion',
        'KEY_BACKUP_ROLLBACK',
      )
    }

    const { db } = requireDatabase(this.#app)
    try {
      await db.transaction(async (tx) => {
        const [latest] = await tx
          .select({ version: encryptedKeyBackups.version })
          .from(encryptedKeyBackups)
          .where(eq(encryptedKeyBackups.userId, context.userId))
          .orderBy(desc(encryptedKeyBackups.version))
          .limit(1)
        if ((latest?.version ?? 0) !== input.expectedPreviousVersion) {
          throw new ConflictError(
            'A newer key backup exists; fetch and verify it before writing',
            'KEY_BACKUP_ROLLBACK',
          )
        }

        const [device] = await tx
          .select({ id: userDevices.id })
          .from(userDevices)
          .where(
            and(
              eq(userDevices.id, input.deviceId),
              eq(userDevices.userId, context.userId),
            ),
          )
          .limit(1)
        if (!device) {
          throw new ConflictError(
            'The backup device is no longer registered',
            'KEY_BACKUP_DEVICE_REMOVED',
          )
        }

        await tx.insert(encryptedKeyBackups).values({
          aead: input.aead,
          ciphertext: input.ciphertext,
          createdAt: new Date(input.createdAt),
          deviceId: input.deviceId,
          identityKeyFingerprint: input.identityKeyFingerprint,
          kdf: input.kdf,
          nonce: input.nonce,
          previousDigest: input.previousDigest,
          userId: context.userId,
          version: input.version,
        })
      })
    } catch (error) {
      if (isPostgresError(error) && error.code === '23505') {
        throw new ConflictError(
          'A newer key backup exists; fetch and verify it before writing',
          'KEY_BACKUP_ROLLBACK',
        )
      }
      throw error
    }

    return this.getLatest(context)
  }

  #serialize(row: typeof encryptedKeyBackups.$inferSelect) {
    return {
      aead: 'aes-256-gcm' as const,
      ciphertext: row.ciphertext,
      createdAt: row.createdAt.toISOString(),
      deviceId: row.deviceId,
      identityKeyFingerprint: row.identityKeyFingerprint,
      kdf: row.kdf,
      nonce: row.nonce,
      previousDigest: row.previousDigest,
      version: row.version,
    }
  }
}
