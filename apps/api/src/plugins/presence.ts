import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { PresenceService } from '../modules/presence/presence.service.js'

const presencePlugin: FastifyPluginAsync = async (app) => {
  const presence = new PresenceService(app)
  app.decorate('presence', presence)
  app.addHook('onClose', async () => presence.close())
}

export default fp(presencePlugin, {
  dependencies: ['database', 'events'],
  name: 'presence',
})
