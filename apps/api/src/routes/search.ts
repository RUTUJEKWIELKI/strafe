import { Type } from 'typebox'
import {
  SearchMessagesQuerySchema,
  SearchMessagesResponseSchema,
  SearchServersQuerySchema,
  SearchServersResponseSchema,
  type SearchMessagesQuery,
  type SearchServersQuery,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'

const searchRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: SearchMessagesQuery }>(
    '/search/messages',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' },
        botScopes: ['messages:read'],
      },
      preHandler: app.authenticate,
      schema: {
        operationId: 'searchMessages',
        querystring: SearchMessagesQuerySchema,
        response: { 200: SearchMessagesResponseSchema },
        summary: 'Search only messages visible to the current user',
        tags: ['search'],
      },
    },
    async (request) =>
      app.searchService.messages(request.auth.userId, request.query),
  )

  app.get<{ Querystring: SearchServersQuery }>(
    '/search/servers',
    {
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' },
        botScopes: ['servers:read'],
      },
      preHandler: app.authenticate,
      schema: {
        operationId: 'searchServers',
        querystring: SearchServersQuerySchema,
        response: { 200: SearchServersResponseSchema },
        summary: 'Search public and joined communities',
        tags: ['search'],
      },
    },
    async (request) =>
      app.searchService.servers(request.auth.userId, request.query),
  )

  app.post(
    '/search/sync',
    {
      config: { rateLimit: { max: 2, timeWindow: '1 minute' } },
      preHandler: app.authenticate,
      schema: {
        operationId: 'syncSearchIndexes',
        response: { 204: Type.Null() },
        summary: 'Manually trigger a full reindex of search documents',
        tags: ['search'],
      },
    },
    async (request, reply) => {
      // In reality we'd require admin rights here.
      await app.searchService.reindexAll()
      return reply.code(204).send()
    },
  )
}

export default searchRoutes
