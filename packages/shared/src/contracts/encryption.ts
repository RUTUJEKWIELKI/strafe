import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

const PublicKeySchema = Type.String({
  maxLength: 256,
  minLength: 40,
  pattern: '^[A-Za-z0-9_-]+$',
})

export const OneTimePrekeySchema = Type.Object({
  keyId: Type.Integer({ minimum: 0 }),
  publicKey: PublicKeySchema,
})

export const PublishKeyBundleBodySchema = Type.Object(
  {
    identityKey: PublicKeySchema,
    oneTimePrekeys: Type.Array(OneTimePrekeySchema, { maxItems: 1000 }),
    signedPrekey: Type.Intersect([
      OneTimePrekeySchema,
      Type.Object({
        signature: Type.String({ maxLength: 256, minLength: 40 }),
      }),
    ]),
    version: Type.Integer({ minimum: 1 }),
  },
  { additionalProperties: false, $id: 'PublishKeyBundleBody' },
)

export const TransparencyCheckpointSchema = Type.Object({
  createdAt: DateTimeSchema,
  rootHash: Type.String(),
  signature: Type.String(),
  size: Type.Integer({ minimum: 1 }),
})

export const KeyBundleSchema = Type.Object({
  deviceId: IdSchema,
  identityKey: PublicKeySchema,
  oneTimePrekey: Type.Union([OneTimePrekeySchema, Type.Null()]),
  signedPrekey: Type.Intersect([
    OneTimePrekeySchema,
    Type.Object({ signature: Type.String(), version: Type.Integer() }),
  ]),
  userId: IdSchema,
  version: Type.Integer(),
})

export const KeyBundleResponseSchema = Type.Object({
  bundle: KeyBundleSchema,
  checkpoint: TransparencyCheckpointSchema,
  inclusionProof: Type.Array(Type.String()),
  leafIndex: Type.Integer({ minimum: 0 }),
})

export const PublishKeyBundleResponseSchema = Type.Object({
  checkpoint: TransparencyCheckpointSchema,
  leafIndex: Type.Integer({ minimum: 0 }),
})

export const TransparencyConsistencyResponseSchema = Type.Object({
  checkpoint: TransparencyCheckpointSchema,
  consistencyProof: Type.Array(Type.String()),
  fromSize: Type.Integer({ minimum: 1 }),
})

export const RemoveEncryptionDeviceBodySchema = Type.Object(
  {
    reason: Type.String({ maxLength: 256, minLength: 1 }),
  },
  { additionalProperties: false },
)

export const RotateEncryptionSessionsBodySchema = Type.Object(
  {
    conversationIds: Type.Array(IdSchema, { maxItems: 500, minItems: 1 }),
    reason: Type.Union([
      Type.Literal('device_compromise'),
      Type.Literal('membership_changed'),
    ]),
  },
  { additionalProperties: false },
)

export const RotationResponseSchema = Type.Object({
  rotated: Type.Integer({ minimum: 0 }),
})

export type PublishKeyBundleBody = Static<typeof PublishKeyBundleBodySchema>
export type RemoveEncryptionDeviceBody = Static<
  typeof RemoveEncryptionDeviceBodySchema
>
export type RotateEncryptionSessionsBody = Static<
  typeof RotateEncryptionSessionsBodySchema
>
export type TransparencyCheckpoint = Static<typeof TransparencyCheckpointSchema>
