import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { BotTokenService } from '../modules/bots/bot-token.service.js'

const plugin: FastifyPluginAsync = async (app) => {
  const service = new BotTokenService(app)
  app.decorate('botTokenService', service)
  let timer: NodeJS.Timeout | undefined
  app.addHook('onReady', async () => {
    if (!app.database) return
    const run = () =>
      void service.maintain().catch((error) => {
        app.log.error({ err: error }, 'Bot token maintenance failed')
        app.reportError(error, { component: 'bot-token-maintenance' })
      })
    run()
    timer = setInterval(run, app.config.BOT_TOKEN_MAINTENANCE_INTERVAL_MS)
    timer.unref()
  })
  app.addHook('onClose', async () => {
    if (timer) clearInterval(timer)
  })
}

export default fp(plugin, {
  dependencies: ['database'],
  name: 'bot-token-service',
})
