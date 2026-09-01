import { fileTypeFromBuffer } from 'file-type'
import ffmpegPath from 'ffmpeg-static'
import type { FastifyInstance } from 'fastify'
import { parseBuffer } from 'music-metadata'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { connect } from 'node:net'
import sharp from 'sharp'
import { and, asc, eq, inArray, lt, or } from 'drizzle-orm'

import {
  fileUploads,
  files,
  fileVariants,
  outboxEvents,
} from '../../db/schema.js'
import { requireDatabase } from '../../lib/database.js'
import { createId } from '../../lib/ids.js'
import { isMimeAllowed } from './file.service.js'

interface VariantOutput {
  body: Buffer | string
  height?: number
  mimeType: string
  type: string
  width?: number
}

async function clamScan(
  buffer: Buffer,
  host: string,
  port: number,
): Promise<'clean' | 'infected'> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port })
    const chunks: Buffer[] = []
    const timeout = setTimeout(() => {
      socket.destroy(new Error('ClamAV scan timed out'))
    }, 30_000)
    timeout.unref()
    socket.on('connect', () => {
      socket.write('zINSTREAM\0')
      for (let offset = 0; offset < buffer.length; offset += 64 * 1_024) {
        const chunk = buffer.subarray(offset, offset + 64 * 1_024)
        const length = Buffer.allocUnsafe(4)
        length.writeUInt32BE(chunk.length)
        socket.write(length)
        socket.write(chunk)
      }
      socket.end(Buffer.alloc(4))
    })
    socket.on('data', (chunk: Buffer) => chunks.push(chunk))
    socket.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    socket.on('close', () => {
      clearTimeout(timeout)
      const response = Buffer.concat(chunks).toString('utf8')
      if (response.includes(' FOUND')) resolve('infected')
      else if (response.includes(' OK')) resolve('clean')
      else
        reject(
          new Error(`Unexpected ClamAV response: ${response.slice(0, 200)}`),
        )
    })
  })
}

async function ffmpegOutput(buffer: Buffer, args: string[]): Promise<Buffer> {
  const executable = typeof ffmpegPath === 'string' ? ffmpegPath : null
  if (!executable) throw new Error('FFmpeg executable is unavailable')
  return new Promise((resolve, reject) => {
    const process = spawn(
      executable,
      ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', ...args],
      { shell: false, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    process.stdout.on('data', (chunk: Buffer) => stdout.push(chunk))
    process.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
    process.on('error', reject)
    process.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(stdout))
      else
        reject(
          new Error(
            `FFmpeg failed: ${Buffer.concat(stderr).toString('utf8').slice(0, 500)}`,
          ),
        )
    })
    process.stdin.end(buffer)
  })
}

async function waveform(buffer: Buffer): Promise<string> {
  const raw = await ffmpegOutput(buffer, [
    '-ac',
    '1',
    '-ar',
    '8000',
    '-f',
    'f32le',
    'pipe:1',
  ])
  const samples = new Float32Array(
    raw.buffer,
    raw.byteOffset,
    Math.floor(raw.byteLength / 4),
  )
  const bucketCount = Math.min(512, Math.max(1, samples.length))
  const bucketSize = Math.max(1, Math.floor(samples.length / bucketCount))
  const peaks = Array.from({ length: bucketCount }, (_, bucket) => {
    let peak = 0
    const end = Math.min(samples.length, (bucket + 1) * bucketSize)
    for (let index = bucket * bucketSize; index < end; index += 1) {
      peak = Math.max(peak, Math.abs(samples[index] ?? 0))
    }
    return Number(peak.toFixed(4))
  })
  return JSON.stringify({ peaks, version: 1 })
}

export class FileProcessingService {
  readonly #app: FastifyInstance
  #running = false

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async tick(): Promise<void> {
    if (this.#running || !this.#app.objectStorage.configured) return
    this.#running = true
    try {
      await this.cleanupExpiredUploads()
      const file = await this.#claim()
      if (file) await this.#process(file)
    } finally {
      this.#running = false
    }
  }

  async reprocess(userId: string, fileId: string) {
    const { db } = requireDatabase(this.#app)
    const [file] = await db
      .update(files)
      .set({
        rejectionReason: null,
        scanStatus: 'pending',
        status: 'quarantined',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(files.id, fileId),
          eq(files.ownerId, userId),
          inArray(files.status, ['quarantined', 'rejected']),
        ),
      )
      .returning({ id: files.id })
    if (!file) return false
    void this.tick().catch((error: unknown) => {
      this.#app.log.error({ err: error }, 'File reprocessing tick failed')
      this.#app.reportError(error, { component: 'file-processing' })
    })
    return true
  }

  async cleanupExpiredUploads(): Promise<number> {
    const { db } = requireDatabase(this.#app)
    const expired = await db.transaction(async (tx) => {
      const claimed = await tx
        .select({
          fileId: fileUploads.fileId,
          objectKey: files.objectKey,
          providerUploadId: fileUploads.providerUploadId,
          uploadId: fileUploads.id,
        })
        .from(fileUploads)
        .innerJoin(files, eq(files.id, fileUploads.fileId))
        .where(
          and(
            eq(fileUploads.status, 'pending'),
            lt(fileUploads.expiresAt, new Date()),
          ),
        )
        .limit(25)
        .for('update', { skipLocked: true })
      if (claimed.length === 0) return claimed
      await tx
        .update(fileUploads)
        .set({ abortedAt: new Date(), status: 'expired' })
        .where(
          inArray(
            fileUploads.id,
            claimed.map((upload) => upload.uploadId),
          ),
        )
      await tx
        .update(files)
        .set({ status: 'deleted', updatedAt: new Date() })
        .where(
          inArray(
            files.id,
            claimed.map((upload) => upload.fileId),
          ),
        )
      return claimed
    })
    for (const upload of expired) {
      await this.#app.objectStorage
        .abortMultipart(upload.objectKey, upload.providerUploadId)
        .catch((error: unknown) => {
          this.#app.log.debug({ err: error }, 'Expired multipart abort failed')
        })
    }
    return expired.length
  }

  async #claim() {
    const { db } = requireDatabase(this.#app)
    return db.transaction(async (tx) => {
      const [file] = await tx
        .select()
        .from(files)
        .where(
          and(
            eq(files.scanStatus, 'pending'),
            or(
              eq(files.status, 'quarantined'),
              and(
                eq(files.status, 'processing'),
                lt(files.updatedAt, new Date(Date.now() - 10 * 60_000)),
              ),
            ),
          ),
        )
        .orderBy(asc(files.createdAt))
        .limit(1)
        .for('update', { skipLocked: true })
      if (!file) return null
      await tx
        .update(files)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(files.id, file.id))
      return file
    })
  }

  async #process(file: typeof files.$inferSelect): Promise<void> {
    try {
      const source = await this.#app.objectStorage.get(file.objectKey)
      if (source.length !== file.sizeBytes) {
        await this.#reject(file, 'size_mismatch', 'failed')
        return
      }

      let scanStatus = 'skipped'
      if (this.#app.config.CLAMAV_HOST) {
        const scan = await clamScan(
          source,
          this.#app.config.CLAMAV_HOST,
          this.#app.config.CLAMAV_PORT,
        )
        if (scan === 'infected') {
          await this.#reject(file, 'malware_detected', 'blocked')
          return
        }
        scanStatus = 'clean'
      } else if (this.#app.config.FILE_SCAN_REQUIRED) {
        await this.#quarantineFailure(file, 'ClamAV is not configured')
        return
      }

      const detected = await fileTypeFromBuffer(source)
      const detectedMime =
        detected?.mime ?? (file.mimeType === 'text/plain' ? 'text/plain' : null)
      if (!detectedMime || !isMimeAllowed(file.purpose, detectedMime)) {
        await this.#reject(file, 'content_type_mismatch', 'blocked')
        return
      }

      let readyBody = source
      let width: number | null = null
      let height: number | null = null
      let durationMs: number | null = null
      const variants: VariantOutput[] = []
      if (detectedMime.startsWith('image/')) {
        const image = sharp(source, { animated: detectedMime === 'image/gif' })
        const metadata = await image.metadata()
        width = metadata.width ?? null
        height = metadata.height ?? null
        if (detectedMime === 'image/jpeg')
          readyBody = await image.rotate().jpeg({ quality: 90 }).toBuffer()
        else if (detectedMime === 'image/png')
          readyBody = await image.rotate().png().toBuffer()
        else if (detectedMime === 'image/webp')
          readyBody = await image.rotate().webp({ quality: 90 }).toBuffer()
        else readyBody = await image.rotate().gif().toBuffer()
        const thumbnail = await sharp(source, { animated: false })
          .rotate()
          .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true })
        variants.push({
          body: thumbnail.data,
          height: thumbnail.info.height,
          mimeType: 'image/webp',
          type: 'thumbnail',
          width: thumbnail.info.width,
        })
      } else if (detectedMime.startsWith('audio/')) {
        const metadata = await parseBuffer(source, { mimeType: detectedMime })
        durationMs = metadata.format.duration
          ? Math.round(metadata.format.duration * 1_000)
          : null
        variants.push({
          body: await waveform(source),
          mimeType: 'application/json',
          type: 'waveform',
        })
      } else if (detectedMime.startsWith('video/')) {
        const frame = await ffmpegOutput(source, [
          '-frames:v',
          '1',
          '-f',
          'image2pipe',
          '-vcodec',
          'mjpeg',
          'pipe:1',
        ])
        const thumbnail = await sharp(frame)
          .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer({ resolveWithObject: true })
        variants.push({
          body: thumbnail.data,
          height: thumbnail.info.height,
          mimeType: 'image/webp',
          type: 'thumbnail',
          width: thumbnail.info.width,
        })
      }

      const readyKey = `ready/${file.ownerId ?? 'orphaned'}/${file.id}`
      await this.#app.objectStorage.put(readyKey, readyBody, detectedMime)
      const storedVariants: Array<VariantOutput & { objectKey: string }> = []
      for (const variant of variants) {
        const objectKey = `variants/${file.id}/${variant.type}`
        await this.#app.objectStorage.put(
          objectKey,
          variant.body,
          variant.mimeType,
        )
        storedVariants.push({ ...variant, objectKey })
      }
      const { db } = requireDatabase(this.#app)
      await db.transaction(async (tx) => {
        await tx.delete(fileVariants).where(eq(fileVariants.fileId, file.id))
        if (storedVariants.length > 0) {
          await tx.insert(fileVariants).values(
            storedVariants.map((variant) => ({
              fileId: file.id,
              height: variant.height,
              id: createId(),
              mimeType: variant.mimeType,
              objectKey: variant.objectKey,
              sizeBytes: Buffer.byteLength(variant.body),
              type: variant.type,
              width: variant.width,
            })),
          )
        }
        await tx
          .update(files)
          .set({
            durationMs,
            height,
            mimeType: detectedMime,
            objectKey: readyKey,
            rejectionReason: null,
            scanStatus,
            sha256: createHash('sha256').update(readyBody).digest('hex'),
            sizeBytes: readyBody.length,
            status: 'ready',
            updatedAt: new Date(),
            width,
          })
          .where(eq(files.id, file.id))
        await tx.insert(outboxEvents).values({
          aggregateId: file.id,
          aggregateType: 'file',
          id: createId(),
          payload: {
            audience: { userIds: file.ownerId ? [file.ownerId] : [] },
            data: { fileId: file.id, status: 'ready' },
          },
          topic: 'file.ready',
        })
      })
      await this.#app.objectStorage.delete(file.objectKey).catch((error) => {
        this.#app.log.debug(
          { err: error, fileId: file.id },
          'Quarantine object cleanup failed',
        )
      })
    } catch (error) {
      await this.#quarantineFailure(
        file,
        error instanceof Error
          ? error.message.slice(0, 500)
          : 'Processing failed',
      )
      this.#app.reportError(error, { component: 'file-processing' })
    }
  }

  async #reject(
    file: typeof files.$inferSelect,
    reason: string,
    scanStatus: 'blocked' | 'failed',
  ) {
    const { db } = requireDatabase(this.#app)
    await db.transaction(async (tx) => {
      await tx
        .update(files)
        .set({
          rejectionReason: reason,
          scanStatus,
          status: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(files.id, file.id))
      await tx.insert(outboxEvents).values({
        aggregateId: file.id,
        aggregateType: 'file',
        id: createId(),
        payload: {
          audience: { userIds: file.ownerId ? [file.ownerId] : [] },
          data: { fileId: file.id, reason, status: 'rejected' },
        },
        topic: 'file.rejected',
      })
    })
    await this.#app.objectStorage.delete(file.objectKey).catch(() => undefined)
  }

  async #quarantineFailure(file: typeof files.$inferSelect, reason: string) {
    const { db } = requireDatabase(this.#app)
    await db
      .update(files)
      .set({
        rejectionReason: reason,
        scanStatus: 'failed',
        status: 'quarantined',
        updatedAt: new Date(),
      })
      .where(eq(files.id, file.id))
  }
}
