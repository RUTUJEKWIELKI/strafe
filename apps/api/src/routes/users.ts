import {
  ErrorResponseSchema,
  UserSchema,
  UpdateUserBodySchema,
  UserSettingsSchema,
  UpdateUserSettingsBodySchema,
  UserRelationshipSchema,
  CreateRelationshipBodySchema,
  WebPushSubscriptionBodySchema,
  type UpdateUserBody,
  type UpdateUserSettingsBody,
  type CreateRelationshipBody,
  type WebPushSubscriptionBody
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Params: { userId: string } }>(
    '/users/:userId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'getUser',
        params: Type.Object({ userId: Type.String({ format: 'uuid' }) }),
        response: { 200: UserSchema, 404: ErrorResponseSchema },
        summary: 'Get public user profile',
        tags: ['users'],
      },
    },
    async (request) => app.userService.getUser(request.params.userId),
  )

  app.patch<{ Body: UpdateUserBody }>(
    '/users/@me',
    {
      preHandler: app.authenticate,
      schema: {
        body: UpdateUserBodySchema,
        operationId: 'updateUser',
        response: { 204: Type.Null() },
        summary: 'Update current user profile',
        tags: ['users'],
      },
    },
    async (request, reply) => {
      await app.userService.updateProfile(request.auth.userId, request.body)
      return reply.code(204).send()
    },
  )

  app.get(
    '/users/@me/settings',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'getUserSettings',
        response: { 200: UserSettingsSchema },
        summary: 'Get user settings',
        tags: ['users'],
      },
    },
    async (request) => app.userService.getSettings(request.auth.userId),
  )

  app.patch<{ Body: UpdateUserSettingsBody }>(
    '/users/@me/settings',
    {
      preHandler: app.authenticate,
      schema: {
        body: UpdateUserSettingsBodySchema,
        operationId: 'updateUserSettings',
        response: { 204: Type.Null() },
        summary: 'Update user settings',
        tags: ['users'],
      },
    },
    async (request, reply) => {
      await app.userService.updateSettings(request.auth.userId, request.body)
      return reply.code(204).send()
    },
  )

  app.post<{ Body: WebPushSubscriptionBody }>(
    '/users/@me/devices/:deviceId/push-subscription',
    {
      preHandler: app.authenticate,
      schema: {
        body: WebPushSubscriptionBodySchema,
        operationId: 'addPushSubscription',
        params: Type.Object({ deviceId: Type.String({ format: 'uuid' }) }),
        response: { 204: Type.Null() },
        summary: 'Add a Web Push subscription for this device',
        tags: ['users'],
      },
    },
    async (request, reply) => {
      await app.userService.addPushSubscription(request.auth.userId, request.body)
      return reply.code(204).send()
    }
  )

  app.post<{ Body: CreateRelationshipBody }>(
    '/users/@me/relationships',
    {
      preHandler: app.authenticate,
      schema: {
        body: CreateRelationshipBodySchema,
        operationId: 'createRelationship',
        response: { 204: Type.Null() },
        summary: 'Send a friend request',
        tags: ['relationships'],
      },
    },
    async (request, reply) => {
      await app.userService.createRelationship(request.auth.userId, request.body.targetId)
      return reply.code(204).send()
    }
  )

  app.put<{ Params: { id: string } }>(
    '/users/@me/relationships/:id/accept',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'acceptRelationship',
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        response: { 204: Type.Null(), 404: ErrorResponseSchema },
        summary: 'Accept a friend request',
        tags: ['relationships'],
      },
    },
    async (request, reply) => {
      await app.userService.updateRelationshipStatus(request.auth.userId, request.params.id, 'accepted')
      return reply.code(204).send()
    }
  )

  app.delete<{ Params: { id: string } }>(
    '/users/@me/relationships/:id',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'deleteRelationship',
        params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
        response: { 204: Type.Null() },
        summary: 'Delete or decline a friend request',
        tags: ['relationships'],
      },
    },
    async (request, reply) => {
      await app.userService.deleteRelationship(request.auth.userId, request.params.id)
      return reply.code(204).send()
    }
  )
}

export default usersRoutes
