import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { createPrivateKey, generateKeyPairSync } from 'node:crypto'

import { EncryptionService } from '../modules/encryption/encryption.service.js'

const plugin: FastifyPluginAsync = async (app) => {
  if (
    app.config.NODE_ENV === 'production' &&
    !app.config.KEY_TRANSPARENCY_PRIVATE_KEY
  ) {
    throw new Error('KEY_TRANSPARENCY_PRIVATE_KEY is required in production')
  }
  const key = app.config.KEY_TRANSPARENCY_PRIVATE_KEY
    ? createPrivateKey(
        app.config.KEY_TRANSPARENCY_PRIVATE_KEY.replaceAll('\\n', '\n'),
      )
    : generateKeyPairSync('ed25519').privateKey
  if (!app.config.KEY_TRANSPARENCY_PRIVATE_KEY)
    app.log.warn('Using an ephemeral key-transparency signing key')
  app.decorate('encryptionService', new EncryptionService(app, key))
}

export default fp(plugin, {
  dependencies: ['auth', 'database'],
  name: 'encryption-service',
})
