import {
  BanMemberBodySchema,
  ClearMemberTimeoutResponseSchema,
  ErrorResponseSchema,
  KickMemberBodySchema,
  MemberStateResponseSchema,
  MemberRolesResponseSchema,
  ModerationActionResponseSchema,
  ServerMemberListResponseSchema,
  TimeoutMemberBodySchema,
  UnbanMemberResponseSchema,
  UpdateMemberRolesBodySchema,
  type BanMemberBody,
  type KickMemberBody,
  type TimeoutMemberBody,
  type UpdateMemberRolesBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const MemberParamsSchema = Type.Object({
  serverId: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
})
const ServerParamsSchema = Type.Object({
  serverId: Type.String({ format: 'uuid' }),
})
const MemberPageQuerySchema = Type.Object({
  before: Type.Optional(Type.String({ maxLength: 2_048, minLength: 1 })),
  limit: Type.Optional(Type.Integer({ default: 50, maximum: 100, minimum: 1 })),
})

const memberRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Params: { serverId: string }
    Querystring: { before?: string; limit?: number }
  }>(
    '/servers/:serverId/members',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listServerMembers',
        params: ServerParamsSchema,
        querystring: MemberPageQuerySchema,
        response: {
          200: ServerMemberListResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'List active server members using cursor pagination',
        tags: ['members'],
      },
    },
    async (request) =>
      app.memberService.list(
        request.auth.userId,
        request.params.serverId,
        request.query.limit ?? 50,
        request.query.before,
      ),
  )

  app.delete<{ Params: { serverId: string } }>(
    '/servers/:serverId/members/@me',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'leaveServer',
        params: ServerParamsSchema,
        response: {
          200: MemberStateResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Leave a server after transferring ownership if necessary',
        tags: ['members'],
      },
    },
    async (request) =>
      app.memberService.leave(request.auth.userId, request.params.serverId),
  )

  app.post<{
    Body: KickMemberBody
    Params: { serverId: string; userId: string }
  }>(
    '/servers/:serverId/members/:userId/kick',
    {
      preHandler: app.authenticate,
      schema: {
        body: KickMemberBodySchema,
        operationId: 'kickServerMember',
        params: MemberParamsSchema,
        response: {
          200: MemberStateResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Kick a lower-permission member and record the action',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.memberService.kick(
        request.auth.userId,
        request.params.serverId,
        request.params.userId,
        request.body.reason,
      ),
  )

  app.delete<{ Params: { serverId: string; userId: string } }>(
    '/servers/:serverId/members/:userId/timeout',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'clearMemberTimeout',
        params: MemberParamsSchema,
        response: {
          200: ClearMemberTimeoutResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Clear an active or stale server timeout',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.memberService.clearTimeout(
        request.auth.userId,
        request.params.serverId,
        request.params.userId,
      ),
  )

  app.delete<{ Params: { serverId: string; userId: string } }>(
    '/servers/:serverId/bans/:userId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'unbanServerMember',
        params: MemberParamsSchema,
        response: {
          200: UnbanMemberResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
        summary: 'Remove a server ban and record the action',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.memberService.unban(
        request.auth.userId,
        request.params.serverId,
        request.params.userId,
      ),
  )

  app.put<{
    Body: UpdateMemberRolesBody
    Params: { serverId: string; userId: string }
  }>(
    '/servers/:serverId/members/:userId/roles',
    {
      config: { botScopes: ['roles:write'] },
      preHandler: app.authenticate,
      schema: {
        body: UpdateMemberRolesBodySchema,
        operationId: 'replaceMemberRoles',
        params: MemberParamsSchema,
        response: {
          200: MemberRolesResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Replace member roles without permission escalation',
        tags: ['members'],
      },
    },
    async (request) =>
      app.memberService.replaceRoles(
        request.auth.userId,
        request.params.serverId,
        request.params.userId,
        request.body,
      ),
  )

  app.post<{
    Body: TimeoutMemberBody
    Params: { serverId: string; userId: string }
  }>(
    '/servers/:serverId/members/:userId/timeout',
    {
      preHandler: app.authenticate,
      schema: {
        body: TimeoutMemberBodySchema,
        operationId: 'timeoutMember',
        params: MemberParamsSchema,
        response: {
          200: ModerationActionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Apply a server timeout with a moderation case',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.memberService.timeout(
        request.auth.userId,
        request.params.serverId,
        request.params.userId,
        request.body,
      ),
  )

  app.post<{
    Body: BanMemberBody
    Params: { serverId: string; userId: string }
  }>(
    '/servers/:serverId/members/:userId/ban',
    {
      preHandler: app.authenticate,
      schema: {
        body: BanMemberBodySchema,
        operationId: 'banMember',
        params: MemberParamsSchema,
        response: {
          200: ModerationActionResponseSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
        summary: 'Ban a member atomically and write the audit trail',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.memberService.ban(
        request.auth.userId,
        request.params.serverId,
        request.params.userId,
        request.body,
      ),
  )
}

export default memberRoutes
