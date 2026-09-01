import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { RoleService } from '../modules/roles/role.service.js'

const roleServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('roleService', new RoleService(app))
}

export default fp(roleServicePlugin, {
  dependencies: ['database'],
  name: 'role-service',
})
