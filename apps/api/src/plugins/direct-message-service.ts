import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { DirectMessageService } from '../modules/channels/direct-message.service.js'

const directMessageServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('directMessageService', new DirectMessageService(app))
}

export default fp(directMessageServicePlugin, {
  dependencies: ['database'],
  name: 'direct-message-service',
})
