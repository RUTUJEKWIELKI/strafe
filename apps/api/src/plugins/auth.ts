import jwt from '@fastify/jwt'
import { hash, argon2id } from 'argon2'
import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { generateKeyPairSync, randomBytes } from 'node:crypto'

import { strafeTokenSecurityRequirement } from '../lib/strafe-token.js'
import { AuthService } from '../modules/auth/auth.service.js'
import { loadJwtKeyset, type JwtKeyset } from '../lib/production-security.js'

function ephemeralKeyset(): JwtKeyset {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' },
  })
  return {
    activeKid: 'ephemeral-development',
    keys: [{ kid: 'ephemeral-development', privateKey, publicKey }],
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  const keyset = app.config.AUTH_JWT_KEYSET_FILE
    ? await loadJwtKeyset(app.config.AUTH_JWT_KEYSET_FILE)
    : ephemeralKeyset()
  if (!app.config.AUTH_JWT_KEYSET_FILE) {
    app.log.warn(
      'JWT keyset is not configured; ephemeral development keys reset on restart',
    )
  }
  const activeKey = keyset.keys.find((key) => key.kid === keyset.activeKid)!
  const acceptedKeys = new Map(
    keyset.keys
      .filter((key) => !key.retireAt || new Date(key.retireAt) > new Date())
      .map((key) => [key.kid, key.publicKey]),
  )

  await app.register(jwt, {
    secret: async (
      _request: FastifyRequest,
      token: { header?: { kid?: string }; kid?: string },
    ) => {
      const header = token.header ?? token
      const key =
        typeof header.kid === 'string'
          ? acceptedKeys.get(header.kid)
          : undefined
      if (!key)
        throw new Error(
          'JWT kid is unknown or outside its rotation grace period',
        )
      return key
    },
    sign: { algorithm: 'RS256' },
    verify: { algorithms: ['RS256'] },
  })
  app.decorate('jwtSigningKey', {
    kid: activeKey.kid,
    privateKey: activeKey.privateKey!,
  })

  const dummyPasswordHash = await hash(randomBytes(32), {
    hashLength: 32,
    memoryCost: 19_456,
    parallelism: 1,
    timeCost: 2,
    type: argon2id,
  })
  const authService = new AuthService(app, dummyPasswordHash)

  app.decorate('authService', authService)
  app.decorateRequest('auth')
  app.decorate('authenticate', async (request) => {
    request.auth = await authService.authenticateRequest(request)
  })
  app.addHook('onRoute', (routeOptions) => {
    const preHandlers = Array.isArray(routeOptions.preHandler)
      ? routeOptions.preHandler
      : [routeOptions.preHandler]

    if (!preHandlers.includes(app.authenticate)) return

    routeOptions.schema = {
      ...routeOptions.schema,
      security: strafeTokenSecurityRequirement(),
    }
  })
}

export default fp(authPlugin, {
  dependencies: ['database'],
  name: 'auth',
})
