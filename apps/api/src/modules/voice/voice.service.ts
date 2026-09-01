import type { VoiceToken } from '@strafe/shared'
import type { FastifyInstance } from 'fastify'
import { AccessToken } from 'livekit-server-sdk'

import { BadRequestError, ServiceUnavailableError } from '../../lib/errors.js'
import { Permission } from '../../lib/permissions.js'
import { authorizeChannel } from '../permissions/authorization.js'

export class VoiceService {
  readonly #app: FastifyInstance

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async createToken(userId: string, channelId: string): Promise<VoiceToken> {
    const authorization = await authorizeChannel(
      this.#app,
      userId,
      channelId,
      Permission.ConnectVoice,
    )
    if (
      authorization.channel.type !== 'voice' &&
      authorization.channel.type !== 'stage'
    ) {
      throw new BadRequestError(
        'This channel does not support voice connections',
        'INVALID_VOICE_CHANNEL',
      )
    }

    const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } =
      this.#app.config
    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new ServiceUnavailableError('LiveKit is not configured')
    }

    const ttlSeconds = 60
    const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      metadata: JSON.stringify({
        channelId,
        serverId: authorization.channel.serverId,
      }),
      ttl: ttlSeconds,
    })
    accessToken.addGrant({
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      room: channelId,
      roomJoin: true,
    })

    return {
      channelId,
      expiresAt: new Date(Date.now() + ttlSeconds * 1_000).toISOString(),
      livekitUrl: LIVEKIT_URL,
      token: await accessToken.toJwt(),
    }
  }
}
