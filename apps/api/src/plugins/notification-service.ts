import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { NotificationService } from '../modules/notifications/notification.service.js'

const notificationServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('notificationService', new NotificationService(app))
}

export default fp(notificationServicePlugin, {
  dependencies: ['database'],
  name: 'notification-service',
})
