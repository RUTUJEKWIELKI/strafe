import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

import { filterBotOpenApi, type OpenApiDocument } from '../lib/bot-openapi.js'
import { STRAFE_TOKEN_SECURITY_SCHEME } from '../lib/strafe-token.js'

const openApiPlugin: FastifyPluginAsync = async (app) => {
  await app.register(swagger, {
    openapi: {
      components: {
        securitySchemes: {
          [STRAFE_TOKEN_SECURITY_SCHEME]: {
            bearerFormat: 'JWT or Strafe bot token',
            description:
              'User access token returned by register, login, or refresh, or a scoped bot token. Paste only the token; Swagger adds the Bearer prefix.',
            scheme: 'bearer',
            type: 'http',
          },
        },
      },
      info: {
        description: 'Clean-room Strafe API',
        title: 'Strafe API',
        version: app.config.SERVICE_VERSION,
      },
      servers: [{ url: 'http://localhost:3000' }],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  })

  app.get(
    '/docs/bot/json',
    { schema: { hide: true } },
    async (_request, reply) => {
      const botSpec = filterBotOpenApi(
        app.swagger() as unknown as OpenApiDocument,
      )
      return reply.send(botSpec)
    },
  )

  app.get(
    '/docs/bot.json',
    { schema: { hide: true } },
    async (_request, reply) => {
      const botSpec = filterBotOpenApi(
        app.swagger() as unknown as OpenApiDocument,
      )
      return reply.send(botSpec)
    },
  )
}

export default fp(openApiPlugin, { name: 'openapi' })
