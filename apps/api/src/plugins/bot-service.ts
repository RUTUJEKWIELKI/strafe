import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { BotService } from '../modules/bots/bot.service.js'

const botServicePlugin: FastifyPluginAsync = async (app) => {
  const botService = new BotService(app)
  app.decorate('botService', botService)
  app.addHook('onClose', async () => botService.close())
}

export default fp(botServicePlugin, {
  dependencies: ['database'],
  name: 'bot-service',
})
