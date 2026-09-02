import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { BotService } from '../modules/bots/bot.service.js'

const botServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('botService', new BotService(app))
}

export default fp(botServicePlugin, {
  dependencies: ['database'],
  name: 'bot-service',
})
