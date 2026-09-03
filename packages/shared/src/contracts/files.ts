import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const FilePurposeSchema = Type.Union([
  Type.Literal('attachment'),
  Type.Literal('avatar'),
  Type.Literal('banner'),
  Type.Literal('server_icon'),
  Type.Literal('emoji'),
])

export const FileStatusSchema = Type.Union([
  Type.Literal('pending'),
  Type.Literal('quarantined'),
  Type.Literal('processing'),
  Type.Literal('ready'),
  Type.Literal('rejected'),
  Type.Literal('deleted'),
])

export const FileVariantSchema = Type.Object({
  height: Type.Union([Type.Integer(), Type.Null()]),
  id: IdSchema,
  mimeType: Type.String(),
  sizeBytes: Type.Integer({ minimum: 0 }),
  type: Type.String(),
  width: Type.Union([Type.Integer(), Type.Null()]),
})

export const FileSchema = Type.Object(
  {
    encryptionMode: Type.Union([Type.Literal('none'), Type.Literal('e2ee-v1')]),
    createdAt: DateTimeSchema,
    durationMs: Type.Union([Type.Integer(), Type.Null()]),
    height: Type.Union([Type.Integer(), Type.Null()]),
    id: IdSchema,
    mimeType: Type.String(),
    originalName: Type.String(),
    purpose: FilePurposeSchema,
    rejectionReason: Type.Union([Type.String(), Type.Null()]),
    scanStatus: Type.String(),
    serverId: Type.Union([IdSchema, Type.Null()]),
    sizeBytes: Type.Integer({ minimum: 0 }),
    status: FileStatusSchema,
    variants: Type.Array(FileVariantSchema),
    width: Type.Union([Type.Integer(), Type.Null()]),
  },
  { $id: 'File' },
)

export const InitiateFileUploadBodySchema = Type.Object(
  {
    chunkSizeBytes: Type.Optional(
      Type.Integer({ maximum: 67_108_864, minimum: 65_536 }),
    ),
    encryptionMode: Type.Optional(Type.Literal('e2ee-v1')),
    mimeType: Type.Optional(Type.String({ maxLength: 255, minLength: 1 })),
    originalName: Type.Optional(Type.String({ maxLength: 255, minLength: 1 })),
    purpose: FilePurposeSchema,
    serverId: Type.Optional(IdSchema),
    sizeBytes: Type.Integer({ maximum: 2_147_483_647, minimum: 1 }),
  },
  { additionalProperties: false, $id: 'InitiateFileUploadBody' },
)

export const UploadPartSchema = Type.Object({
  partNumber: Type.Integer({ maximum: 10_000, minimum: 1 }),
  url: Type.String(),
})

export const InitiateFileUploadResponseSchema = Type.Object({
  expiresAt: DateTimeSchema,
  fileId: IdSchema,
  partSizeBytes: Type.Integer({ minimum: 5_242_880 }),
  parts: Type.Array(UploadPartSchema),
  uploadId: IdSchema,
})

export const CompleteUploadPartSchema = Type.Object({
  etag: Type.String({ maxLength: 512, minLength: 1 }),
  partNumber: Type.Integer({ maximum: 10_000, minimum: 1 }),
})

export const CompleteFileUploadBodySchema = Type.Object(
  {
    parts: Type.Array(CompleteUploadPartSchema, {
      maxItems: 10_000,
      minItems: 1,
    }),
  },
  { additionalProperties: false, $id: 'CompleteFileUploadBody' },
)

export const PresignUploadPartBodySchema = Type.Object(
  { partNumber: Type.Integer({ maximum: 10_000, minimum: 1 }) },
  { additionalProperties: false, $id: 'PresignUploadPartBody' },
)

export const PresignedUrlResponseSchema = Type.Object({
  expiresAt: DateTimeSchema,
  url: Type.String(),
})

export const FileMutationResponseSchema = Type.Object({
  fileId: IdSchema,
  status: FileStatusSchema,
})

export type CompleteFileUploadBody = Static<typeof CompleteFileUploadBodySchema>
export type FilePurpose = Static<typeof FilePurposeSchema>
export type FileResource = Static<typeof FileSchema>
export type InitiateFileUploadBody = Static<typeof InitiateFileUploadBodySchema>
export type PresignUploadPartBody = Static<typeof PresignUploadPartBodySchema>
