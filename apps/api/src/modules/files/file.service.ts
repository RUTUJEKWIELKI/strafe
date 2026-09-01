import type {
  CompleteFileUploadBody,
  FileResource,
  InitiateFileUploadBody,
} from '@strafe/shared'
import { and, eq, gt, inArray, ne, sql, sum } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import sanitizeFilename from 'sanitize-filename'

import {
  fileUploads,
  files,
  fileVariants,
  messageAttachments,
  messages,
  outboxEvents,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'
import { Permission } from '../../lib/permissions.js'
import { authorizeChannel } from '../permissions/authorization.js'
import { authorizeServer } from '../permissions/authorization.js'

const allowedMimeTypes = new Map([
  [
    'attachment',
    new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'audio/mpeg',
      'audio/ogg',
      'audio/wav',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
    ]),
  ],
  ['avatar', new Set(['image/jpeg', 'image/png', 'image/webp'])],
  ['banner', new Set(['image/jpeg', 'image/png', 'image/webp'])],
  ['server_icon', new Set(['image/jpeg', 'image/png', 'image/webp'])],
  ['emoji', new Set(['image/png', 'image/webp', 'image/gif'])],
])

export function isMimeAllowed(purpose: string, mimeType: string): boolean {
  return allowedMimeTypes.get(purpose)?.has(mimeType.toLowerCase()) === true
}

function mapFile(
  row: typeof files.$inferSelect,
  variants: Array<typeof fileVariants.$inferSelect>,
): FileResource {
  return {
    createdAt: row.createdAt.toISOString(),
    durationMs: row.durationMs,
    height: row.height,
    id: row.id,
    mimeType: row.mimeType,
    originalName: row.originalName,
    purpose: row.purpose as FileResource['purpose'],
    rejectionReason: row.rejectionReason,
    scanStatus: row.scanStatus,
    serverId: row.serverId,
    sizeBytes: row.sizeBytes,
    status: row.status as FileResource['status'],
    variants: variants.map((variant) => ({
      height: variant.height,
      id: variant.id,
      mimeType: variant.mimeType,
      sizeBytes: variant.sizeBytes,
      type: variant.type,
      width: variant.width,
    })),
    width: row.width,
  }
}

export class FileService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async initiate(userId: string, input: InitiateFileUploadBody) {
    const allowed = allowedMimeTypes.get(input.purpose)
    if (!allowed?.has(input.mimeType.toLowerCase())) {
      throw new BadRequestError(
        'This file type is not allowed for the selected purpose',
        'FILE_TYPE_NOT_ALLOWED',
      )
    }
    if (input.sizeBytes > this.#app.config.FILE_MAX_SIZE_BYTES) {
      throw new BadRequestError(
        'File exceeds the upload limit',
        'FILE_TOO_LARGE',
      )
    }
    if (input.purpose === 'server_icon' && !input.serverId) {
      throw new BadRequestError(
        'A server icon requires serverId',
        'SERVER_REQUIRED',
      )
    }
    if (
      input.serverId &&
      input.purpose !== 'attachment' &&
      input.purpose !== 'server_icon' &&
      input.purpose !== 'emoji'
    ) {
      throw new BadRequestError(
        'This file purpose cannot be scoped to a server',
        'INVALID_FILE_SCOPE',
      )
    }
    if (input.serverId) {
      await authorizeServer(
        this.#app,
        userId,
        input.serverId,
        input.purpose === 'server_icon'
          ? Permission.ManageServer
          : Permission.ViewChannel,
      )
    }

    const { db } = requireDatabase(this.#app)
    const [quota] = await db
      .select({ used: sum(files.sizeBytes) })
      .from(files)
      .where(
        and(
          eq(files.ownerId, userId),
          inArray(files.status, [
            'pending',
            'quarantined',
            'processing',
            'ready',
          ]),
        ),
      )
    if (
      Number(quota?.used ?? 0) + input.sizeBytes >
      this.#app.config.FILE_USER_QUOTA_BYTES
    ) {
      throw new BadRequestError(
        'Account storage quota exceeded',
        'FILE_QUOTA_EXCEEDED',
      )
    }

    const fileId = createId()
    const uploadId = createId()
    const objectKey = `quarantine/${userId}/${fileId}`
    const providerUploadId = await this.#app.objectStorage.createMultipart(
      objectKey,
      input.mimeType,
    )
    const expiresAt = new Date(Date.now() + 60 * 60 * 1_000)
    const partSizeBytes = this.#app.config.FILE_PART_SIZE_BYTES
    const partCount = Math.ceil(input.sizeBytes / partSizeBytes)
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`)
        const [lockedQuota] = await tx
          .select({ used: sum(files.sizeBytes) })
          .from(files)
          .where(
            and(
              eq(files.ownerId, userId),
              inArray(files.status, [
                'pending',
                'quarantined',
                'processing',
                'ready',
              ]),
            ),
          )
        if (
          Number(lockedQuota?.used ?? 0) + input.sizeBytes >
          this.#app.config.FILE_USER_QUOTA_BYTES
        ) {
          throw new BadRequestError(
            'Account storage quota exceeded',
            'FILE_QUOTA_EXCEEDED',
          )
        }
        await tx.insert(files).values({
          id: fileId,
          mimeType: input.mimeType.toLowerCase(),
          objectKey,
          originalName: sanitizeFilename(input.originalName.trim()) || 'upload',
          ownerId: userId,
          purpose: input.purpose,
          serverId: input.serverId,
          sizeBytes: input.sizeBytes,
        })
        await tx.insert(fileUploads).values({
          expiresAt,
          fileId,
          id: uploadId,
          partSizeBytes,
          providerUploadId,
        })
      })
    } catch (error) {
      await this.#app.objectStorage
        .abortMultipart(objectKey, providerUploadId)
        .catch(() => undefined)
      throw error
    }

    const parts = await Promise.all(
      Array.from({ length: partCount }, async (_, index) => ({
        partNumber: index + 1,
        url: await this.#app.objectStorage.presignPart(
          objectKey,
          providerUploadId,
          index + 1,
        ),
      })),
    )
    return {
      expiresAt: expiresAt.toISOString(),
      fileId,
      partSizeBytes,
      parts,
      uploadId,
    }
  }

  async presignPart(userId: string, uploadId: string, partNumber: number) {
    const upload = await this.#getActiveUpload(userId, uploadId)
    const expectedParts = Math.ceil(upload.sizeBytes / upload.partSizeBytes)
    if (partNumber > expectedParts) {
      throw new BadRequestError(
        'Part number exceeds file size',
        'INVALID_UPLOAD_PART',
      )
    }
    return {
      expiresAt: new Date(Date.now() + 900_000).toISOString(),
      url: await this.#app.objectStorage.presignPart(
        upload.objectKey,
        upload.providerUploadId,
        partNumber,
      ),
    }
  }

  async complete(
    userId: string,
    uploadId: string,
    input: CompleteFileUploadBody,
  ) {
    const { db } = requireDatabase(this.#app)
    return db.transaction(async (tx) => {
      const [upload] = await tx
        .select({ file: files, upload: fileUploads })
        .from(fileUploads)
        .innerJoin(files, eq(files.id, fileUploads.fileId))
        .where(
          and(
            eq(fileUploads.id, uploadId),
            eq(fileUploads.status, 'pending'),
            eq(files.ownerId, userId),
            gt(fileUploads.expiresAt, new Date()),
          ),
        )
        .limit(1)
        .for('update')
      if (!upload) throw new NotFoundError('Active upload not found')
      const expectedCount = Math.ceil(
        upload.file.sizeBytes / upload.upload.partSizeBytes,
      )
      const numbers = input.parts.map((part) => part.partNumber)
      if (
        input.parts.length !== expectedCount ||
        new Set(numbers).size !== numbers.length ||
        numbers.some(
          (number, index) =>
            number !== [...numbers].sort((a, b) => a - b)[index],
        ) ||
        Math.min(...numbers) !== 1 ||
        Math.max(...numbers) !== expectedCount
      ) {
        throw new BadRequestError(
          'Upload parts must be complete, unique and ordered',
          'INVALID_UPLOAD_PARTS',
        )
      }
      try {
          await this.#app.objectStorage.completeMultipart(
        upload.file.objectKey,
        upload.upload.providerUploadId,
        input.parts.map((part) => ({
          ETag: part.etag.replaceAll('"', ''),
          PartNumber: part.partNumber,
        })),
      )
                )
        } catch (error: unknown) {
          try {
            await this.#app.objectStorage.head(upload.file.objectKey)
          } catch {
            throw error
          }
        }
        const head = await this.#app.objectStorage.head(upload.file.objectKey)
      if (head.sizeBytes !== upload.file.sizeBytes) {
        const now = new Date()
        await tx
          .update(fileUploads)
          .set({ completedAt: now, status: 'completed' })
          .where(eq(fileUploads.id, uploadId))
        await tx
          .update(files)
          .set({
            rejectionReason: 'Uploaded object size does not match declaration',
            status: 'rejected',
            updatedAt: now,
          })
          .where(eq(files.id, upload.file.id))
        await tx.insert(outboxEvents).values({
          aggregateId: upload.file.id,
          aggregateType: 'file',
          id: createId(),
          payload: {
            audience: { userIds: [userId] },
            data: {
              fileId: upload.file.id,
              reason: 'Uploaded object size does not match declaration',
              status: 'rejected',
            },
          },
          topic: 'file.rejected',
        })
        return { fileId: upload.file.id, status: 'rejected' as const }
      }
      const now = new Date()
      await tx
        .update(fileUploads)
        .set({ completedAt: now, status: 'completed' })
        .where(eq(fileUploads.id, uploadId))
      await tx
        .update(files)
        .set({ scanStatus: 'pending', status: 'quarantined', updatedAt: now })
        .where(eq(files.id, upload.file.id))
      await tx.insert(outboxEvents).values({
        aggregateId: upload.file.id,
        aggregateType: 'file',
        id: createId(),
        payload: {
          audience: { userIds: [userId] },
          data: { fileId: upload.file.id, status: 'quarantined' },
        },
        topic: 'file.upload_completed',
      })
      return { fileId: upload.file.id, status: 'quarantined' as const }
    })
  }

  async abort(userId: string, uploadId: string) {
    const upload = await this.#getActiveUpload(userId, uploadId)
    await this.#app.objectStorage.abortMultipart(
      upload.objectKey,
      upload.providerUploadId,
    )
    const { db } = requireDatabase(this.#app)
    await db.transaction(async (tx) => {
      await tx
        .update(fileUploads)
        .set({ abortedAt: new Date(), status: 'aborted' })
        .where(eq(fileUploads.id, uploadId))
      await tx
        .update(files)
        .set({ status: 'deleted', updatedAt: new Date() })
        .where(eq(files.id, upload.fileId))
    })
    return { fileId: upload.fileId, status: 'deleted' as const }
  }

  async get(userId: string, fileId: string) {
    const row = await this.#authorizeFile(userId, fileId, false)
    const { db } = requireDatabase(this.#app)
    const variants = await db
      .select()
      .from(fileVariants)
      .where(eq(fileVariants.fileId, fileId))
    return mapFile(row, variants)
  }

  async download(userId: string, fileId: string, variantType?: string) {
    const file = await this.#authorizeFile(userId, fileId, true)
    let objectKey = file.objectKey
    let filename = file.originalName
    if (variantType) {
      const { db } = requireDatabase(this.#app)
      const [variant] = await db
        .select()
        .from(fileVariants)
        .where(
          and(
            eq(fileVariants.fileId, fileId),
            eq(fileVariants.type, variantType),
          ),
        )
        .limit(1)
      if (!variant) throw new NotFoundError('File variant not found')
      objectKey = variant.objectKey
      filename = `${fileId}-${variantType}`
    }
    return {
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
      url: await this.#app.objectStorage.presignDownload(objectKey, filename),
    }
  }

  async delete(userId: string, fileId: string) {
    const { db } = requireDatabase(this.#app)
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.ownerId, userId)))
      .limit(1)
    if (!file) throw new NotFoundError('File not found')
    const [attached] = await db
      .select({ fileId: messageAttachments.fileId })
      .from(messageAttachments)
      .where(eq(messageAttachments.fileId, fileId))
      .limit(1)
    if (attached) {
      throw new ConflictError(
        'Attached files cannot be deleted directly',
        'FILE_IN_USE',
      )
    }
    const variants = await db
      .select({ objectKey: fileVariants.objectKey })
      .from(fileVariants)
      .where(eq(fileVariants.fileId, fileId))
    await db
      .update(files)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(and(eq(files.id, fileId), ne(files.status, 'deleted')))
    await Promise.allSettled([
      this.#app.objectStorage.delete(file.objectKey),
      ...variants.map((variant) =>
        this.#app.objectStorage.delete(variant.objectKey),
      ),
    ])
    return { fileId, status: 'deleted' as const }
  }

  async #getActiveUpload(userId: string, uploadId: string) {
    const { db } = requireDatabase(this.#app)
    const [row] = await db
      .select({
        expiresAt: fileUploads.expiresAt,
        fileId: fileUploads.fileId,
        objectKey: files.objectKey,
        partSizeBytes: fileUploads.partSizeBytes,
        providerUploadId: fileUploads.providerUploadId,
        sizeBytes: files.sizeBytes,
      })
      .from(fileUploads)
      .innerJoin(files, eq(files.id, fileUploads.fileId))
      .where(
        and(
          eq(fileUploads.id, uploadId),
          eq(fileUploads.status, 'pending'),
          eq(files.ownerId, userId),
          gt(fileUploads.expiresAt, new Date()),
        ),
      )
      .limit(1)
    if (!row) throw new NotFoundError('Active upload not found')
    return row
  }

  async #authorizeFile(userId: string, fileId: string, requireReady: boolean) {
    const { db } = requireDatabase(this.#app)
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), ne(files.status, 'deleted')))
      .limit(1)
    if (!file) throw new NotFoundError('File not found')
    if (requireReady && file.status !== 'ready') {
      throw new NotFoundError('File is not available')
    }
    if (file.ownerId === userId) return file

    const [attachment] = await db
      .select({ channelId: messages.channelId })
      .from(messageAttachments)
      .innerJoin(messages, eq(messages.id, messageAttachments.messageId))
      .where(eq(messageAttachments.fileId, fileId))
      .limit(1)
    if (attachment) {
      await authorizeChannel(
        this.#app,
        userId,
        attachment.channelId,
        Permission.ReadMessageHistory,
      )
      return file
    }
    if (file.serverId) {
      await authorizeServer(
        this.#app,
        userId,
        file.serverId,
        Permission.ViewChannel,
      )
      return file
    }
    throw new ForbiddenError('You cannot access this file')
  }
}
