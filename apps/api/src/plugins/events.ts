import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { RealtimeEventBus } from '../modules/realtime/event-bus.js'

const eventsPlugin: FastifyPluginAsync = async (app) => {
  const eventBus = new RealtimeEventBus(app.redis)
  await eventBus.start()
  app.decorate('eventBus', eventBus)
  app.addHook('onClose', async () => eventBus.close())
}

export default fp(eventsPlugin, {
  dependencies: ['redis'],
  name: 'events',
})
