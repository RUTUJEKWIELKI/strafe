import {
  AutomodRuleListResponseSchema,
  AutomodRuleSchema,
  CreateAppealBodySchema,
  CreateAutomodRuleBodySchema,
  CreateReportBodySchema,
  DecideAppealBodySchema,
  ErrorResponseSchema,
  ModerationAppealListResponseSchema,
  ModerationCaseDetailSchema,
  ModerationCaseListResponseSchema,
  ReportListResponseSchema,
  ReportSchema,
  ReportStatusSchema,
  UpdateAutomodRuleBodySchema,
  UpdateReportBodySchema,
  UserBlockBodySchema,
  UserBlockSchema,
  type CreateAppealBody,
  type CreateAutomodRuleBody,
  type CreateReportBody,
  type DecideAppealBody,
  type UpdateAutomodRuleBody,
  type UpdateReportBody,
  type UserBlockBody,
} from '@strafe/shared'
import type { FastifyPluginAsync } from 'fastify'
import { Type } from 'typebox'

const ServerParamsSchema = Type.Object({
  serverId: Type.String({ format: 'uuid' }),
})
const ReportParamsSchema = Type.Object({
  reportId: Type.String({ format: 'uuid' }),
  serverId: Type.String({ format: 'uuid' }),
})
const RuleParamsSchema = Type.Object({
  ruleId: Type.String({ format: 'uuid' }),
  serverId: Type.String({ format: 'uuid' }),
})
const CaseParamsSchema = Type.Object({
  caseId: Type.String({ format: 'uuid' }),
})
const ServerCaseParamsSchema = Type.Object({
  caseId: Type.String({ format: 'uuid' }),
  serverId: Type.String({ format: 'uuid' }),
})
const AppealParamsSchema = Type.Object({
  appealId: Type.String({ format: 'uuid' }),
  serverId: Type.String({ format: 'uuid' }),
})
const UserParamsSchema = Type.Object({
  userId: Type.String({ format: 'uuid' }),
})
const CursorQuerySchema = Type.Object({
  before: Type.Optional(Type.String({ maxLength: 512 })),
  limit: Type.Optional(Type.Integer({ maximum: 100, minimum: 1 })),
})
const ReportsQuerySchema = Type.Intersect([
  CursorQuerySchema,
  Type.Object({ status: Type.Optional(ReportStatusSchema) }),
])
const DeleteRuleResponseSchema = Type.Object({
  deleted: Type.Literal(true),
  ruleId: Type.String({ format: 'uuid' }),
})
const AppealResponseSchema = Type.Object({
  appealId: Type.String({ format: 'uuid' }),
  caseId: Type.String({ format: 'uuid' }),
  status: Type.String(),
})
const BlockListResponseSchema = Type.Object({
  blocks: Type.Array(UserBlockSchema),
})
const RemoveBlockResponseSchema = Type.Object({ removed: Type.Boolean() })

const moderationRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: CreateReportBody }>(
    '/reports',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
      preHandler: app.authenticate,
      schema: {
        body: CreateReportBodySchema,
        operationId: 'createReport',
        response: { 201: ReportSchema, 400: ErrorResponseSchema },
        summary: 'Report visible content, a user or a community',
        tags: ['moderation'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.moderationService.createReport(
            request.auth.userId,
            request.body,
          ),
        ),
  )

  app.get<{
    Params: { serverId: string }
    Querystring: { before?: string; limit?: number; status?: string }
  }>(
    '/servers/:serverId/reports',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listServerReports',
        params: ServerParamsSchema,
        querystring: ReportsQuerySchema,
        response: { 200: ReportListResponseSchema },
        summary: 'List the server moderation report queue',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.moderationService.listReports(
        request.auth.userId,
        request.params.serverId,
        request.query.limit ?? 50,
        request.query.before,
        request.query.status,
      ),
  )

  app.patch<{
    Body: UpdateReportBody
    Params: { reportId: string; serverId: string }
  }>(
    '/servers/:serverId/reports/:reportId',
    {
      preHandler: app.authenticate,
      schema: {
        body: UpdateReportBodySchema,
        operationId: 'updateServerReport',
        params: ReportParamsSchema,
        response: { 200: ReportSchema },
        summary: 'Assign, review or resolve a report',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.moderationService.updateReport(
        request.auth.userId,
        request.params.serverId,
        request.params.reportId,
        request.body,
      ),
  )

  app.get<{
    Params: { serverId: string }
    Querystring: { before?: string; limit?: number }
  }>(
    '/servers/:serverId/moderation/cases',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listModerationCases',
        params: ServerParamsSchema,
        querystring: CursorQuerySchema,
        response: { 200: ModerationCaseListResponseSchema },
        summary: 'List complete server moderation history',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.moderationService.listCases(
        request.auth.userId,
        request.params.serverId,
        request.query.limit ?? 50,
        request.query.before,
      ),
  )

  app.get<{ Params: { caseId: string; serverId: string } }>(
    '/servers/:serverId/moderation/cases/:caseId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'getModerationCase',
        params: ServerCaseParamsSchema,
        response: { 200: ModerationCaseDetailSchema },
        summary: 'Get a moderation case with actions and appeals',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.moderationService.getCase(
        request.auth.userId,
        request.params.serverId,
        request.params.caseId,
      ),
  )

  app.get(
    '/users/@me/moderation/appeals',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listCurrentUserModerationAppeals',
        response: { 200: ModerationAppealListResponseSchema },
        summary: 'List the current user moderation appeal history',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.moderationService.listOwnAppeals(request.auth.userId),
  )

  app.post<{ Body: CreateAppealBody; Params: { caseId: string } }>(
    '/moderation/cases/:caseId/appeals',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
      preHandler: app.authenticate,
      schema: {
        body: CreateAppealBodySchema,
        operationId: 'createModerationAppeal',
        params: CaseParamsSchema,
        response: { 201: AppealResponseSchema },
        summary: 'Appeal a moderation case concerning the current user',
        tags: ['moderation'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.moderationService.createAppeal(
            request.auth.userId,
            request.params.caseId,
            request.body,
          ),
        ),
  )

  app.post<{
    Body: DecideAppealBody
    Params: { appealId: string; serverId: string }
  }>(
    '/servers/:serverId/moderation/appeals/:appealId/decision',
    {
      preHandler: app.authenticate,
      schema: {
        body: DecideAppealBodySchema,
        operationId: 'decideModerationAppeal',
        params: AppealParamsSchema,
        response: { 200: AppealResponseSchema },
        summary: 'Accept or reject a moderation appeal',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.moderationService.decideAppeal(
        request.auth.userId,
        request.params.serverId,
        request.params.appealId,
        request.body,
      ),
  )

  app.get(
    '/users/@me/blocks',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listCurrentUserBlocks',
        response: { 200: BlockListResponseSchema },
        summary: 'List blocked users',
        tags: ['moderation'],
      },
    },
    async (request) => app.moderationService.listBlocks(request.auth.userId),
  )

  app.put<{ Body: UserBlockBody; Params: { userId: string } }>(
    '/users/@me/blocks/:userId',
    {
      preHandler: app.authenticate,
      schema: {
        body: UserBlockBodySchema,
        operationId: 'blockUser',
        params: UserParamsSchema,
        response: { 200: UserBlockSchema },
        summary: 'Block a user and prevent direct interaction',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.moderationService.blockUser(
        request.auth.userId,
        request.params.userId,
        request.body,
      ),
  )

  app.delete<{ Params: { userId: string } }>(
    '/users/@me/blocks/:userId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'unblockUser',
        params: UserParamsSchema,
        response: { 200: RemoveBlockResponseSchema },
        summary: 'Remove a user block',
        tags: ['moderation'],
      },
    },
    async (request) =>
      app.moderationService.unblockUser(
        request.auth.userId,
        request.params.userId,
      ),
  )

  app.get<{ Params: { serverId: string } }>(
    '/servers/:serverId/automod/rules',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'listAutomodRules',
        params: ServerParamsSchema,
        response: { 200: AutomodRuleListResponseSchema },
        summary: 'List server automod rules',
        tags: ['automod'],
      },
    },
    async (request) =>
      app.moderationService.listAutomodRules(
        request.auth.userId,
        request.params.serverId,
      ),
  )

  app.post<{ Body: CreateAutomodRuleBody; Params: { serverId: string } }>(
    '/servers/:serverId/automod/rules',
    {
      preHandler: app.authenticate,
      schema: {
        body: CreateAutomodRuleBodySchema,
        operationId: 'createAutomodRule',
        params: ServerParamsSchema,
        response: { 201: AutomodRuleSchema },
        summary: 'Create a validated server automod rule',
        tags: ['automod'],
      },
    },
    async (request, reply) =>
      reply
        .code(201)
        .send(
          await app.moderationService.createAutomodRule(
            request.auth.userId,
            request.params.serverId,
            request.body,
          ),
        ),
  )

  app.patch<{
    Body: UpdateAutomodRuleBody
    Params: { ruleId: string; serverId: string }
  }>(
    '/servers/:serverId/automod/rules/:ruleId',
    {
      preHandler: app.authenticate,
      schema: {
        body: UpdateAutomodRuleBodySchema,
        operationId: 'updateAutomodRule',
        params: RuleParamsSchema,
        response: { 200: AutomodRuleSchema },
        summary: 'Update a server automod rule',
        tags: ['automod'],
      },
    },
    async (request) =>
      app.moderationService.updateAutomodRule(
        request.auth.userId,
        request.params.serverId,
        request.params.ruleId,
        request.body,
      ),
  )

  app.delete<{ Params: { ruleId: string; serverId: string } }>(
    '/servers/:serverId/automod/rules/:ruleId',
    {
      preHandler: app.authenticate,
      schema: {
        operationId: 'deleteAutomodRule',
        params: RuleParamsSchema,
        response: { 200: DeleteRuleResponseSchema },
        summary: 'Delete a server automod rule',
        tags: ['automod'],
      },
    },
    async (request) =>
      app.moderationService.deleteAutomodRule(
        request.auth.userId,
        request.params.serverId,
        request.params.ruleId,
      ),
  )
}

export default moderationRoutes
