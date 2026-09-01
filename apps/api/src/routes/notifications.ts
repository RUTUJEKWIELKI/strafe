import {
  ErrorResponseSchema,
  ListNotificationsQuerySchema,
  MarkNotificationsReadResponseSchema,
  NotificationPreferenceListResponseSchema,
  NotificationPreferenceSchema,
  NotificationListResponseSchema,
  PushSubscriptionBodySchema,
  PushSubscriptionListResponseSchema,
  PushSubscriptionSchema,
  UpsertNotificationPreferenceBodySchema,
  type PushSubscriptionBody,
  type UpsertNotificationPreferenceBody,
  type ListNotificationsQuery,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const NotificationParamsSchema = Type.Object({
  notificationId: Type.String({ format: 'uuid' }),
})
const PushSubscriptionParamsSchema = Type.Object({
  subscriptionId: Type.String({ format: 'uuid' }),
})
const RemoveSubscriptionResponseSchema = Type.Object({
  removed: Type.Boolean(),
})

const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: ListNotificationsQuery }>(
    '/users/@me/notifications',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listNotifications',
        querystring: ListNotificationsQuerySchema,
        response: { 200: NotificationListResponseSchema },
        summary: 'List the current user notification inbox',
        tags: ['notifications'],
      },
    },
    async (request) =>
      app.notificationService.list(
        request.auth.userId,
        request.query.limit ?? 50,
        request.query.before,
        request.query.unreadOnly ?? false,
      ),
  )

  app.post<{ Params: { notificationId: string } }>(
    '/users/@me/notifications/:notificationId/read',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'markNotificationRead',
        params: NotificationParamsSchema,
        response: {
          200: MarkNotificationsReadResponseSchema,
          401: ErrorResponseSchema,
        },
        summary: 'Mark one notification as read',
        tags: ['notifications'],
      },
    },
    async (request) => ({
      updated: await app.notificationService.markRead(
        request.auth.userId,
        request.params.notificationId,
      ),
    }),
  )

  app.post(
    '/users/@me/notifications/read-all',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'markAllNotificationsRead',
        response: { 200: MarkNotificationsReadResponseSchema },
        summary: 'Mark every current user notification as read',
        tags: ['notifications'],
      },
    },
    async (request) => ({
      updated: await app.notificationService.markRead(request.auth.userId),
    }),
  )

  app.get(
    '/users/@me/notification-preferences',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listNotificationPreferences',
        response: { 200: NotificationPreferenceListResponseSchema },
        summary: 'List notification delivery and mute preferences',
        tags: ['notifications'],
      },
    },
    async (request) =>
      app.notificationService.listPreferences(request.auth.userId),
  )

  app.put<{ Body: UpsertNotificationPreferenceBody }>(
    '/users/@me/notification-preferences',
    {
      preHandler: app.authenticate,
      schema: {
        body: UpsertNotificationPreferenceBodySchema,
        operationId: 'upsertNotificationPreference',
        response: { 200: NotificationPreferenceSchema },
        summary: 'Create or replace a scoped notification preference',
        tags: ['notifications'],
      },
    },
    async (request) =>
      app.notificationService.upsertPreference(
        request.auth.userId,
        request.body,
      ),
  )

  app.get(
    '/users/@me/push-subscriptions',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listPushSubscriptions',
        response: { 200: PushSubscriptionListResponseSchema },
        summary: 'List current user web push subscriptions',
        tags: ['notifications'],
      },
    },
    async (request) =>
      app.notificationService.listPushSubscriptions(request.auth.userId),
  )

  app.post<{ Body: PushSubscriptionBody }>(
    '/users/@me/push-subscriptions',
    {
      preHandler: app.authenticate,
      schema: {
        body: PushSubscriptionBodySchema,
        operationId: 'createPushSubscription',
        response: { 201: PushSubscriptionSchema },
        summary: 'Register or rotate a web push subscription',
        tags: ['notifications'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.notificationService.subscribePush(
            request.auth.userId,
            request.body,
          ),
        ),
  )

  app.delete<{ Params: { subscriptionId: string } }>(
    '/users/@me/push-subscriptions/:subscriptionId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'deletePushSubscription',
        params: PushSubscriptionParamsSchema,
        response: { 200: RemoveSubscriptionResponseSchema },
        summary: 'Revoke a web push subscription',
        tags: ['notifications'],
      },
    },
    async (request) =>
      app.notificationService.unsubscribePush(
        request.auth.userId,
        request.params.subscriptionId,
      ),
  )
}

export default notificationRoutes
