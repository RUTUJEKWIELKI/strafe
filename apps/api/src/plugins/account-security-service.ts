import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { AccountSecurityService } from '../modules/auth/account-security.service.js'

const accountSecurityPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('accountSecurityService', new AccountSecurityService(app))
}

export default fp(accountSecurityPlugin, {
  dependencies: ['database', 'mail-service'],
  name: 'account-security-service',
})
