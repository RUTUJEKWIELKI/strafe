import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { SearchService } from '../modules/search/search.service.js'

const searchServicePlugin: FastifyPluginAsync = async (app) => {
  const service = new SearchService(app)
  await service.start()
  app.decorate('searchService', service)
}

export default fp(searchServicePlugin, {
  dependencies: ['database'],
  name: 'search-service',
})
