import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { FileProcessingService } from '../modules/files/file-processing.service.js'

const fileProcessingPlugin: FastifyPluginAsync = async (app) => {
  const processor = new FileProcessingService(app)
  app.decorate('fileProcessingService', processor)
  if (
    app.config.NODE_ENV === 'production' &&
    app.config.FILE_SCAN_REQUIRED &&
    !app.config.CLAMAV_HOST
  ) {
    throw new Error('CLAMAV_HOST is required when file scanning is mandatory')
  }
  if (!app.database) return
  const run = () =>
    void processor.tick().catch((error: unknown) => {
      app.log.error({ err: error }, 'File processing tick failed')
      app.reportError(error, { component: 'file-processing' })
    })
  const timer = setInterval(run, app.config.FILE_PROCESS_INTERVAL_MS)
  timer.unref()
  run()
  app.addHook('onClose', async () => clearInterval(timer))
}

export default fp(fileProcessingPlugin, {
  dependencies: ['database', 'file-service', 'object-storage'],
  name: 'file-processing',
})
