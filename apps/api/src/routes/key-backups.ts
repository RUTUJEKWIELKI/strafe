import {
  ErrorResponseSchema,
  KeyBackupResponseSchema,
  PutKeyBackupBodySchema,
  type PutKeyBackupBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'

const keyBackupRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/users/@me/key-backup',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'getCurrentUserKeyBackup',
        response: { 200: KeyBackupResponseSchema },
        summary: 'Fetch the latest opaque encrypted key backup',
        tags: ['key backup'],
      },
    },
    async (request) => app.keyBackupService.getLatest(request.auth),
  )

  app.put<{ Body: PutKeyBackupBody }>(
    '/users/@me/key-backup',
    {
      preHandler: app.authenticate,
      schema: {
        body: PutKeyBackupBodySchema,
        operationId: 'putCurrentUserKeyBackup',
        response: { 200: KeyBackupResponseSchema, 409: ErrorResponseSchema },
        summary: 'Append an opaque encrypted key backup version',
        tags: ['key backup'],
      },
    },
    async (request) => app.keyBackupService.put(request.auth, request.body),
  )
}

export default keyBackupRoutes
