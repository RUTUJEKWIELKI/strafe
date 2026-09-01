import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { ServerService } from '../modules/servers/server.service.js'

const serverServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('serverService', new ServerService(app))
}

export default fp(serverServicePlugin, {
  dependencies: ['database'],
  name: 'server-service',
})
