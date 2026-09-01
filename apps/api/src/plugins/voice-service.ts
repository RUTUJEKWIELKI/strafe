import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { VoiceService } from '../modules/voice/voice.service.js'

const voiceServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('voiceService', new VoiceService(app))
}

export default fp(voiceServicePlugin, {
  dependencies: ['database'],
  name: 'voice-service',
})
