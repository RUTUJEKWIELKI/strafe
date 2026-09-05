import {
  CompleteFileUploadBodySchema,
  ErrorResponseSchema,
  FileMutationResponseSchema,
  FileSchema,
  InitiateFileUploadBodySchema,
  InitiateFileUploadResponseSchema,
  PresignedUrlResponseSchema,
  PresignUploadPartBodySchema,
  type CompleteFileUploadBody,
  type InitiateFileUploadBody,
  type PresignUploadPartBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

import { NotFoundError } from '../lib/errors.js'

const FileParamsSchema = Type.Object({
  fileId: Type.String({ format: 'uuid' }),
})
const UploadParamsSchema = Type.Object({
  uploadId: Type.String({ format: 'uuid' }),
})
const DownloadQuerySchema = Type.Object({
  variant: Type.Optional(Type.String({ maxLength: 64, minLength: 1 })),
})

const fileRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: InitiateFileUploadBody }>(
    '/files/uploads',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' }, botScopes: ['messages:write'] },
      preHandler: app.authenticate,
      schema: {
        body: InitiateFileUploadBodySchema,
        operationId: 'initiateFileUpload',
        response: {
          201: InitiateFileUploadResponseSchema,
          400: ErrorResponseSchema,
          503: ErrorResponseSchema,
        },
        summary: 'Create a quarantined S3 multipart upload',
        tags: ['files'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.fileService.initiate(request.auth.userId, request.body),
        ),
  )

  app.post<{
    Body: PresignUploadPartBody
    Params: { uploadId: string }
  }>(
    '/files/uploads/:uploadId/parts',
    {
      config: { rateLimit: { max: 120, timeWindow: '1 minute' }, botScopes: ['messages:write'] },
      preHandler: app.authenticate,
      schema: {
        body: PresignUploadPartBodySchema,
        operationId: 'presignFileUploadPart',
        params: UploadParamsSchema,
        response: { 200: PresignedUrlResponseSchema },
        summary: 'Sign one multipart upload part',
        tags: ['files'],
      },
    },
    async (request) =>
      app.fileService.presignPart(
        request.auth.userId,
        request.params.uploadId,
        request.body.partNumber,
      ),
  )

  app.post<{
    Body: CompleteFileUploadBody
    Params: { uploadId: string }
  }>(
    '/files/uploads/:uploadId/complete',
    {
      config: { rateLimit: { max: 30, timeWindow: '1 minute' }, botScopes: ['messages:write'] },
      preHandler: app.authenticate,
      schema: {
        body: CompleteFileUploadBodySchema,
        operationId: 'completeFileUpload',
        params: UploadParamsSchema,
        response: { 200: FileMutationResponseSchema },
        summary: 'Complete upload and move the file into quarantine',
        tags: ['files'],
      },
    },
    async (request) =>
      app.fileService.complete(
        request.auth.userId,
        request.params.uploadId,
        request.body,
      ),
  )

  app.delete<{ Params: { uploadId: string } }>(
    '/files/uploads/:uploadId',
    {
      config: { botScopes: ['messages:write'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'abortFileUpload',
        params: UploadParamsSchema,
        response: { 200: FileMutationResponseSchema },
        summary: 'Abort and remove a pending multipart upload',
        tags: ['files'],
      },
    },
    async (request) =>
      app.fileService.abort(request.auth.userId, request.params.uploadId),
  )

  app.get<{ Params: { fileId: string } }>(
    '/files/:fileId',
    {
      config: { botScopes: ['messages:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'getFile',
        params: FileParamsSchema,
        response: { 200: FileSchema, 404: ErrorResponseSchema },
        summary: 'Return authorized file metadata and processing state',
        tags: ['files'],
      },
    },
    async (request) =>
      app.fileService.get(request.auth.userId, request.params.fileId),
  )

  app.get<{
    Params: { fileId: string }
    Querystring: { variant?: string }
  }>(
    '/files/:fileId/download',
    {
      config: { rateLimit: { max: 120, timeWindow: '1 minute' }, botScopes: ['messages:read'] },
      preHandler: app.authenticate,
      schema: {
        operationId: 'downloadFile',
        params: FileParamsSchema,
        querystring: DownloadQuerySchema,
        response: { 200: PresignedUrlResponseSchema, 404: ErrorResponseSchema },
        summary: 'Create a short authorized download URL',
        tags: ['files'],
      },
    },
    async (request) =>
      app.fileService.download(
        request.auth.userId,
        request.params.fileId,
        request.query.variant,
      ),
  )

  app.post<{ Params: { fileId: string } }>(
    '/files/:fileId/reprocess',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'reprocessFile',
        params: FileParamsSchema,
        response: { 200: FileMutationResponseSchema, 404: ErrorResponseSchema },
        summary: 'Retry scanning and processing an owned quarantined file',
        tags: ['files'],
      },
    },
    async (request) => {
      const queued = await app.fileProcessingService.reprocess(
        request.auth.userId,
        request.params.fileId,
      )
      if (!queued) throw new NotFoundError('Quarantined file not found')
      return { fileId: request.params.fileId, status: 'quarantined' as const }
    },
  )

  app.delete<{ Params: { fileId: string } }>(
    '/files/:fileId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'deleteFile',
        params: FileParamsSchema,
        response: { 200: FileMutationResponseSchema },
        summary: 'Delete an unused owned file',
        tags: ['files'],
      },
    },
    async (request) =>
      app.fileService.delete(request.auth.userId, request.params.fileId),
  )
}

export default fileRoutes
