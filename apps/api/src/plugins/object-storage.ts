import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { ObjectStorageService } from '../modules/files/object-storage.service.js'

const objectStoragePlugin: FastifyPluginAsync = async (app) => {
  const objectStorage = new ObjectStorageService(app)
  await objectStorage.ensureBucket()
  if (app.config.NODE_ENV === 'production' && !objectStorage.configured) {
    throw new Error('S3 object storage is required in production')
  }
  app.decorate('objectStorage', objectStorage)
  app.addHook('onClose', async () => objectStorage.close())
}

export default fp(objectStoragePlugin, { name: 'object-storage' })
