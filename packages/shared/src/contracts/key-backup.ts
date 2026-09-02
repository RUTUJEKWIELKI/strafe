import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const KeyBackupKdfSchema = Type.Object(
  {
    algorithm: Type.Literal('argon2id'),
    iterations: Type.Integer({ maximum: 10, minimum: 1 }),
    memoryKiB: Type.Integer({ maximum: 1_048_576, minimum: 65_536 }),
    parallelism: Type.Integer({ maximum: 8, minimum: 1 }),
    salt: Type.String({ maxLength: 128, minLength: 22 }),
  },
  { additionalProperties: false },
)

export const KeyBackupEnvelopeSchema = Type.Object(
  {
    aead: Type.Literal('aes-256-gcm'),
    ciphertext: Type.String({ maxLength: 4_000_000, minLength: 1 }),
    createdAt: DateTimeSchema,
    deviceId: IdSchema,
    identityKeyFingerprint: Type.String({ maxLength: 128, minLength: 16 }),
    kdf: KeyBackupKdfSchema,
    nonce: Type.String({ maxLength: 64, minLength: 16 }),
    previousDigest: Type.Union([
      Type.String({ maxLength: 128, minLength: 32 }),
      Type.Null(),
    ]),
    version: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false, $id: 'KeyBackupEnvelope' },
)

export const PutKeyBackupBodySchema = Type.Intersect([
  KeyBackupEnvelopeSchema,
  Type.Object({ expectedPreviousVersion: Type.Integer({ minimum: 0 }) }),
])

export const KeyBackupResponseSchema = Type.Object({
  backup: Type.Union([KeyBackupEnvelopeSchema, Type.Null()]),
  latestVersion: Type.Integer({ minimum: 0 }),
})

export type KeyBackupEnvelope = Static<typeof KeyBackupEnvelopeSchema>
export type KeyBackupKdf = Static<typeof KeyBackupKdfSchema>
export type PutKeyBackupBody = Static<typeof PutKeyBackupBodySchema>
