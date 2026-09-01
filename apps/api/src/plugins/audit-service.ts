import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { AuditService } from '../modules/audit/audit.service.js'

const auditServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('auditService', new AuditService(app))
}

export default fp(auditServicePlugin, {
  dependencies: ['database'],
  name: 'audit-service',
})
