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
            bearerFormat: 'JWT',
            description:
              'Strafe access token returned by register, login, or refresh. Paste only the token; Swagger adds the Bearer prefix.',
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
      servers: [],
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  })
}

export default fp(openApiPlugin, { name: 'openapi' })
