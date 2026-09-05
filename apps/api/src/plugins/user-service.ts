import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { UserService } from '../modules/users/user.service.js'

const userServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('userService', new UserService(app))
}

export default fp(userServicePlugin, {
  dependencies: ['database'],
  name: 'user-service',
})
