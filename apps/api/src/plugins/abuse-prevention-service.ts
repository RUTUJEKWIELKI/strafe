import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { AbusePreventionService } from '../modules/abuse/abuse-prevention.service.js'

const plugin: FastifyPluginAsync = async (app) => {
  app.decorate('abusePrevention', new AbusePreventionService(app))
}

export default fp(plugin, {
  dependencies: ['database', 'redis'],
  name: 'abuse-prevention-service',
})
