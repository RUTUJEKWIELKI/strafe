import { Type, type Static } from 'typebox'

import { DateTimeSchema, IdSchema } from './common.js'

export const VoiceTokenSchema = Type.Object(
  {
    channelId: IdSchema,
    expiresAt: DateTimeSchema,
    livekitUrl: Type.String({ format: 'uri' }),
    token: Type.String(),
  },
  { $id: 'VoiceToken' },
)

export type VoiceToken = Static<typeof VoiceTokenSchema>
