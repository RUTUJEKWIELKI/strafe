import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { FileService } from '../modules/files/file.service.js'

const fileServicePlugin: FastifyPluginAsync = async (app) => {
  app.decorate('fileService', new FileService(app))
}

export default fp(fileServicePlugin, {
  dependencies: ['database', 'object-storage'],
  name: 'file-service',
})
