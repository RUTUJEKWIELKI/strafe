import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

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
}

export default fp(openApiPlugin, { name: 'openapi' })
