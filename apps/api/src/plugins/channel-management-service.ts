import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { ChannelManagementService } from '../modules/channels/channel-management.service.js'

const channelManagementServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('channelManagementService', new ChannelManagementService(app))
}

export default fp(channelManagementServicePlugin, {
  dependencies: ['database'],
  name: 'channel-management-service',
})
