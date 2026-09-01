import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { MessageService } from '../modules/messages/message.service.js'

const messageServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('messageService', new MessageService(app))
}

export default fp(messageServicePlugin, {
  dependencies: ['database'],
  name: 'message-service',
})
