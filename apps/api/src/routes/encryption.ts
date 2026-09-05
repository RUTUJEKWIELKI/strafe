import {
  ErrorResponseSchema,
  KeyBundleResponseSchema,
  PublishKeyBundleBodySchema,
  PublishKeyBundleResponseSchema,
  RemoveEncryptionDeviceBodySchema,
  RotateEncryptionSessionsBodySchema,
  RotationResponseSchema,
  TransparencyConsistencyResponseSchema,
  type PublishKeyBundleBody,
  type RemoveEncryptionDeviceBody,
  type RotateEncryptionSessionsBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const DeviceParams = Type.Object({
  deviceId: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
})

const routes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { fromSize: number } }>(
    '/encryption/transparency/consistency',
    {
      schema: {
        operationId: 'getKeyTransparencyConsistencyProof',
        querystring: Type.Object({ fromSize: Type.Integer({ minimum: 1 }) }),
        response: {
          200: TransparencyConsistencyResponseSchema,
          404: ErrorResponseSchema,
        },
        tags: ['encryption'],
      },
    },
    async (request) =>
      app.encryptionService.consistency(request.query.fromSize),
  )

  app.put<{ Body: PublishKeyBundleBody }>(
    '/encryption/keys',
    {
      preHandler: app.authenticate,
      schema: {
        body: PublishKeyBundleBodySchema,
        operationId: 'publishKeyBundle',
        response: {
          200: PublishKeyBundleResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
        tags: ['encryption'],
      },
    },
    async (request) =>
      app.encryptionService.publish(request.auth, request.body),
  )

  app.post<{ Params: { deviceId: string; userId: string } }>(
    '/encryption/users/:userId/devices/:deviceId/prekeys/consume',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'consumePrekeyBundle',
        params: DeviceParams,
        response: { 200: KeyBundleResponseSchema, 404: ErrorResponseSchema },
        tags: ['encryption'],
      },
    },
    async (request) =>
      app.encryptionService.consume(
        request.params.userId,
        request.params.deviceId,
      ),
  )

  app.delete<{
    Body: RemoveEncryptionDeviceBody
    Params: { deviceId: string }
  }>(
    '/encryption/devices/:deviceId',
    {
      preHandler: app.authenticate,
      schema: {
        body: RemoveEncryptionDeviceBodySchema,
        params: Type.Object({ deviceId: Type.String({ format: 'uuid' }) }),
        tags: ['encryption'],
      },
    },
    async (request) =>
      app.encryptionService.removeDevice(
        request.auth,
        request.params.deviceId,
        request.body.reason,
      ),
  )

  app.post<{ Body: RotateEncryptionSessionsBody }>(
    '/encryption/sessions/rotate',
    {
      preHandler: app.authenticate,
      schema: {
        body: RotateEncryptionSessionsBodySchema,
        operationId: 'rotateEncryptionSessions',
        response: { 200: RotationResponseSchema },
        tags: ['encryption'],
      },
    },
    async (request) => app.encryptionService.rotate(request.auth, request.body),
  )
}

export default routes
