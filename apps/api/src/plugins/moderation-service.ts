import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { ModerationService } from '../modules/moderation/moderation.service.js'

const moderationServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('moderationService', new ModerationService(app))
}

export default fp(moderationServicePlugin, {
  dependencies: ['database', 'redis'],
  name: 'moderation-service',
})
