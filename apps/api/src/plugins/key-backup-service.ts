import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { KeyBackupService } from '../modules/auth/key-backup.service.js'

const keyBackupPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('keyBackupService', new KeyBackupService(app))
}

export default fp(keyBackupPlugin, {
  dependencies: ['database'],
  name: 'key-backup-service',
})
