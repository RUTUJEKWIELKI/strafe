import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { MailService } from '../modules/notifications/mail.service.js'

const mailServicePlugin: FastifyPluginAsync = async (app) => {
  const mailService = new MailService(app)
  if (app.config.NODE_ENV === 'production' && !mailService.configured) {
    throw new Error('SMTP_HOST and SMTP_FROM are required in production')
  }
  app.decorate('mailService', mailService)
}

export default fp(mailServicePlugin, { name: 'mail-service' })
