import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { NotificationDeliveryService } from '../modules/notifications/notification-delivery.service.js'

const notificationDeliveryPlugin: FastifyPluginAsync = async (app) => {
  const service = new NotificationDeliveryService(app)
  app.decorate('notificationDeliveryService', service)
  if (!app.database) return
  const run = () =>
    void service.tick().catch((error: unknown) => {
      app.log.error({ err: error }, 'Notification delivery tick failed')
      app.reportError(error, { component: 'notification-delivery' })
    })
  const timer = setInterval(run, 5_000)
  timer.unref()
  run()
  app.addHook('onClose', async () => clearInterval(timer))
}

export default fp(notificationDeliveryPlugin, {
  dependencies: ['database', 'mail-service'],
  name: 'notification-delivery',
})
