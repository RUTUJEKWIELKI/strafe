import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateBucketCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
  type CompletedPart,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { FastifyInstance } from 'fastify'

import { ServiceUnavailableError } from '../../lib/errors.js'

export class ObjectStorageService {
  readonly #app: FastifyInstance
  readonly #bucket: string | null
  readonly #client: S3Client | null
  #available = false

  constructor(app: FastifyInstance) {
    this.#app = app
    this.#bucket = app.config.S3_BUCKET ?? null
    const configured =
      app.config.S3_ACCESS_KEY_ID &&
      app.config.S3_SECRET_ACCESS_KEY &&
      this.#bucket
    this.#client = configured
      ? new S3Client({
          credentials: {
            accessKeyId: app.config.S3_ACCESS_KEY_ID!,
            secretAccessKey: app.config.S3_SECRET_ACCESS_KEY!,
          },
          ...(app.config.S3_ENDPOINT
            ? { endpoint: app.config.S3_ENDPOINT }
            : {}),
          forcePathStyle: app.config.S3_FORCE_PATH_STYLE,
          region: app.config.S3_REGION,
        })
      : null
  }

  get configured(): boolean {
    return Boolean(this.#client && this.#bucket && this.#available)
  }

  async ensureBucket(): Promise<void> {
    if (!this.#client || !this.#bucket) return
    try {
      await this.#client.send(new HeadBucketCommand({ Bucket: this.#bucket }))
      this.#available = true
    } catch (error) {
      if (this.#app.config.NODE_ENV === 'production') throw error
      try {
        await this.#client.send(
          new CreateBucketCommand({ Bucket: this.#bucket }),
        )
        this.#available = true
      } catch (createError) {
        this.#app.log.warn(
          { err: createError },
          'Object storage unavailable; file uploads are disabled',
        )
      }
    }
  }

  async createMultipart(objectKey: string, mimeType: string): Promise<string> {
    const { bucket, client } = this.#require()
    const result = await client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucket,
        ContentType: mimeType,
        Key: objectKey,
        Metadata: { source: 'strafe-quarantine' },
      }),
    )
    if (!result.UploadId) throw new Error('S3 did not return an upload ID')
    return result.UploadId
  }

  async presignPart(
    objectKey: string,
    providerUploadId: string,
    partNumber: number,
  ): Promise<string> {
    const { bucket, client } = this.#require()
    return getSignedUrl(
      client,
      new UploadPartCommand({
        Bucket: bucket,
        Key: objectKey,
        PartNumber: partNumber,
        UploadId: providerUploadId,
      }),
      { expiresIn: 900 },
    )
  }

  async completeMultipart(
    objectKey: string,
    providerUploadId: string,
    parts: CompletedPart[],
  ): Promise<void> {
    const { bucket, client } = this.#require()
    await client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: objectKey,
        MultipartUpload: { Parts: parts },
        UploadId: providerUploadId,
      }),
    )
  }

  async abortMultipart(
    objectKey: string,
    providerUploadId: string,
  ): Promise<void> {
    const { bucket, client } = this.#require()
    await client.send(
      new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: objectKey,
        UploadId: providerUploadId,
      }),
    )
  }

  async head(objectKey: string): Promise<{ sizeBytes: number }> {
    const { bucket, client } = this.#require()
    const result = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
    )
    return { sizeBytes: result.ContentLength ?? 0 }
  }

  async get(objectKey: string): Promise<Buffer> {
    const { bucket, client } = this.#require()
    const result = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: objectKey }),
    )
    if (!result.Body) throw new Error('S3 object has no response body')
    return Buffer.from(await result.Body.transformToByteArray())
  }

  async put(
    objectKey: string,
    body: Buffer | string,
    mimeType: string,
  ): Promise<void> {
    const { bucket, client } = this.#require()
    await client.send(
      new PutObjectCommand({
        Body: body,
        Bucket: bucket,
        ContentType: mimeType,
        Key: objectKey,
      }),
    )
  }

  async delete(objectKey: string): Promise<void> {
    const { bucket, client } = this.#require()
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
    )
  }

  async presignDownload(objectKey: string, originalName: string) {
    const { bucket, client } = this.#require()
    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`,
      }),
      { expiresIn: 300 },
    )
  }

  close(): void {
    this.#client?.destroy()
  }

  #require(): { bucket: string; client: S3Client } {
    if (!this.#client || !this.#bucket || !this.#available) {
      throw new ServiceUnavailableError('Object storage is not configured')
    }
    return { bucket: this.#bucket, client: this.#client }
  }
}
