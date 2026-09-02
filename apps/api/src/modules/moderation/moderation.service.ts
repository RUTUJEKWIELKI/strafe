import {
  EncryptedChannelFlag,
  type CreateAppealBody,
  type CreateAutomodRuleBody,
  type CreateReportBody,
  type DecideAppealBody,
  type UpdateAutomodRuleBody,
  type UpdateReportBody,
  type UserBlockBody,
} from '@strafe/shared'
import { createHash, createPublicKey, verify } from 'node:crypto'
import { and, desc, eq, isNull, lt, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import {
  auditLog,
  automodEvents,
  automodRules,
  channels,
  messages,
  moderationActions,
  moderationAppeals,
  moderationCases,
  outboxEvents,
  serverMembers,
  userBlocks,
  userReports,
  users,
} from '../../db/schema.js'
import { decodeCursor, encodeCursor } from '../../lib/cursor.js'
import { requireDatabase } from '../../lib/database.js'
import { BadRequestError, NotFoundError } from '../../lib/errors.js'
import { createId } from '../../lib/ids.js'
import { Permission } from '../../lib/permissions.js'
import {
  authorizeChannel,
  authorizeServer,
} from '../permissions/authorization.js'

function reportResponse(report: typeof userReports.$inferSelect) {
  return {
    assignedTo: report.assignedTo,
    category: report.category,
    createdAt: report.createdAt.toISOString(),
    description: report.description,
    encryptedEvidence: report.encryptedEvidence,
    id: report.id,
    reporterId: report.reporterId,
    resolutionNote: report.resolutionNote,
    serverId: report.serverId,
    status: report.status as 'dismissed' | 'open' | 'resolved' | 'reviewing',
    targetId: report.targetId,
    targetType: report.targetType as 'channel' | 'message' | 'server' | 'user',
    updatedAt: report.updatedAt.toISOString(),
  }
}

function ruleResponse(rule: typeof automodRules.$inferSelect) {
  return {
    action: rule.action as 'block' | 'flag' | 'timeout',
    config: rule.config,
    createdAt: rule.createdAt.toISOString(),
    enabled: rule.enabled,
    id: rule.id,
    enforcementScope: automodEnforcementScope(rule.triggerType),
    name: rule.name,
    serverId: rule.serverId,
    triggerType: rule.triggerType as
      'flood' | 'keyword' | 'link' | 'raid' | 'spam',
    updatedAt: rule.updatedAt.toISOString(),
  }
}

type AutomodEnforcementScope = 'metadata' | 'plaintext'

function automodEnforcementScope(triggerType: string): AutomodEnforcementScope {
  return triggerType === 'spam' || triggerType === 'raid'
    ? 'metadata'
    : 'plaintext'
}

function canonicalReportedMessage(
  message: NonNullable<CreateReportBody['encryptedEvidence']>['message'],
): string {
  return JSON.stringify({
    authorId: message.authorId,
    channelId: message.channelId,
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
  })
}

function verifiedEncryptedEvidence(
  evidence: NonNullable<CreateReportBody['encryptedEvidence']>,
) {
  try {
    const publicKeyBytes = Buffer.from(
      evidence.cryptographicMaterial.authorPublicKey,
      'base64',
    )
    const publicKey = createPublicKey({
      format: 'der',
      key: publicKeyBytes,
      type: 'spki',
    })
    const valid = verify(
      null,
      Buffer.from(canonicalReportedMessage(evidence.message)),
      publicKey,
      Buffer.from(evidence.cryptographicMaterial.signature, 'base64'),
    )
    if (!valid) throw new Error('invalid signature')
    return {
      authorKeyFingerprint: createHash('sha256')
        .update(publicKeyBytes)
        .digest('base64url'),
      context: evidence.context,
      cryptographicMaterial: evidence.cryptographicMaterial,
      message: evidence.message,
      verification: 'signature_valid' as const,
    }
  } catch {
    throw new BadRequestError(
      'Encrypted report evidence signature is invalid',
      'INVALID_REPORT_EVIDENCE',
    )
  }
}

function caseResponse(row: typeof moderationCases.$inferSelect) {
  return {
    assignedTo: row.assignedTo,
    closedAt: row.closedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    openedBy: row.openedBy,
    reason: row.reason,
    serverId: row.serverId,
    status: row.status,
    subjectId: row.subjectId,
    subjectType: row.subjectType as 'channel' | 'message' | 'server' | 'user',
    updatedAt: row.updatedAt.toISOString(),
  }
}

function actionResponse(row: typeof moderationActions.$inferSelect) {
  return {
    action: row.action,
    actorId: row.actorId,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    id: row.id,
    metadata: row.metadata,
    reason: row.reason,
  }
}

function appealResponse(
  row: typeof moderationAppeals.$inferSelect,
  serverId: string,
) {
  return {
    caseId: row.caseId,
    createdAt: row.createdAt.toISOString(),
    decidedAt: row.decidedAt?.toISOString() ?? null,
    decidedBy: row.decidedBy,
    decisionNote: row.decisionNote,
    id: row.id,
    reason: row.reason,
    serverId,
    status: row.status as 'accepted' | 'pending' | 'rejected',
    userId: row.userId,
  }
}

function stringArray(value: unknown, field: string, maximum: number): string[] {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > maximum ||
    value.some((item) => typeof item !== 'string' || item.length > 100)
  ) {
    throw new BadRequestError(
      `Automod ${field} is invalid`,
      'INVALID_AUTOMOD_CONFIG',
    )
  }
  const normalized = value.map((item) => item.trim()).filter(Boolean)
  if (normalized.length === 0) {
    throw new BadRequestError(
      `Automod ${field} is invalid`,
      'INVALID_AUTOMOD_CONFIG',
    )
  }
  return normalized
}

function integer(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
): number {
  if (
    !Number.isInteger(value) ||
    Number(value) < minimum ||
    Number(value) > maximum
  ) {
    throw new BadRequestError(
      `Automod ${field} is invalid`,
      'INVALID_AUTOMOD_CONFIG',
    )
  }
  return Number(value)
}

function validateAutomodConfig(
  triggerType: CreateAutomodRuleBody['triggerType'],
  config: Record<string, unknown>,
): Record<string, unknown> {
  switch (triggerType) {
    case 'keyword':
      return {
        caseSensitive: config.caseSensitive === true,
        keywords: stringArray(config.keywords, 'keywords', 100),
      }
    case 'spam':
      return {
        intervalSeconds: integer(
          config.intervalSeconds,
          'intervalSeconds',
          1,
          60,
        ),
        maxMessages: integer(config.maxMessages, 'maxMessages', 2, 30),
      }
    case 'link':
      return {
        allowedDomains: Array.isArray(config.allowedDomains)
          ? stringArray(config.allowedDomains, 'allowedDomains', 100).map(
              (domain) => domain.toLowerCase(),
            )
          : [],
        blockAll: config.blockAll === true,
      }
    case 'flood':
      return {
        maxCharacters: integer(
          config.maxCharacters,
          'maxCharacters',
          100,
          4_000,
        ),
        maxLines: integer(config.maxLines, 'maxLines', 2, 100),
        maxMentions: integer(config.maxMentions, 'maxMentions', 1, 100),
      }
    case 'raid':
      return {
        intervalSeconds: integer(
          config.intervalSeconds,
          'intervalSeconds',
          10,
          600,
        ),
        maxJoins: integer(config.maxJoins, 'maxJoins', 5, 1_000),
      }
  }
  throw new BadRequestError(
    'Unsupported automod trigger',
    'INVALID_AUTOMOD_CONFIG',
  )
}

export class ModerationService {
  readonly #app: FastifyInstance
  readonly #localSpam = new Map<string, number[]>()

  constructor(app: FastifyInstance) {
    this.#app = app
  }

  async createReport(reporterId: string, input: CreateReportBody) {
    const serverId = await this.#validateReportTarget(reporterId, input)
    const encryptedEvidence = input.encryptedEvidence
      ? verifiedEncryptedEvidence(input.encryptedEvidence)
      : null
    if (encryptedEvidence && input.targetType !== 'message') {
      throw new BadRequestError(
        'Encrypted evidence can only accompany a message report',
        'INVALID_REPORT_EVIDENCE',
      )
    }
    if (encryptedEvidence && encryptedEvidence.message.id !== input.targetId) {
      throw new BadRequestError(
        'Encrypted evidence does not match the reported message',
        'INVALID_REPORT_EVIDENCE',
      )
    }
    if (
      encryptedEvidence &&
      encryptedEvidence.context.some(
        (message) => message.channelId !== encryptedEvidence.message.channelId,
      )
    ) {
      throw new BadRequestError(
        'Encrypted report context must come from the reported channel',
        'INVALID_REPORT_EVIDENCE',
      )
    }
    const { db } = requireDatabase(this.#app)
    const [report] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(userReports)
        .values({
          category: input.category.trim().toLowerCase(),
          description: input.description?.trim() || null,
          encryptedEvidence,
          id: createId(),
          reporterId,
          serverId,
          targetId: input.targetId,
          targetType: input.targetType,
        })
        .returning()
      if (!created) throw new Error('Report insert returned no row')
      await tx.insert(outboxEvents).values({
        aggregateId: created.id,
        aggregateType: 'report',
        id: createId(),
        payload: {
          audience: {
            ...(serverId ? { serverId } : {}),
            userIds: [reporterId],
          },
          data: { reportId: created.id, serverId },
        },
        topic: 'moderation.report_created',
      })
      return [created]
    })
    if (!report) throw new Error('Report transaction returned no row')
    return reportResponse(report)
  }

  async listReports(
    actorId: string,
    serverId: string,
    limit: number,
    before?: string,
    status?: string,
  ) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageReports,
    )
    const cursor = before ? decodeCursor(before) : null
    const conditions = [eq(userReports.serverId, serverId)]
    if (status) conditions.push(eq(userReports.status, status))
    if (cursor) {
      const date = new Date(cursor.createdAt)
      conditions.push(
        or(
          lt(userReports.createdAt, date),
          and(eq(userReports.createdAt, date), lt(userReports.id, cursor.id)),
        )!,
      )
    }
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(userReports)
      .where(and(...conditions))
      .orderBy(desc(userReports.createdAt), desc(userReports.id))
      .limit(limit + 1)
    const page = rows.slice(0, limit)
    const last = page.at(-1)
    return {
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
      reports: page.map(reportResponse),
    }
  }

  async updateReport(
    actorId: string,
    serverId: string,
    reportId: string,
    input: UpdateReportBody,
  ) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageReports,
    )
    if (input.assignedTo) {
      await authorizeServer(
        this.#app,
        input.assignedTo,
        serverId,
        Permission.ManageReports,
      )
    }
    const { db } = requireDatabase(this.#app)
    if (input.assignedTo) {
      const [member] = await db
        .select({ id: serverMembers.id })
        .from(serverMembers)
        .where(
          and(
            eq(serverMembers.serverId, serverId),
            eq(serverMembers.userId, input.assignedTo),
            eq(serverMembers.state, 'active'),
          ),
        )
        .limit(1)
      if (!member) throw new BadRequestError('Assignee is not an active member')
    }
    return db.transaction(async (tx) => {
      const [report] = await tx
        .update(userReports)
        .set({
          ...(input.assignedTo !== undefined
            ? { assignedTo: input.assignedTo }
            : {}),
          ...(input.resolutionNote !== undefined
            ? { resolutionNote: input.resolutionNote.trim() }
            : {}),
          ...(input.status !== undefined
            ? {
                resolvedAt: ['resolved', 'dismissed'].includes(input.status)
                  ? new Date()
                  : null,
                status: input.status,
              }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          and(eq(userReports.id, reportId), eq(userReports.serverId, serverId)),
        )
        .returning()
      if (!report) throw new NotFoundError('Report not found')
      await tx.insert(auditLog).values({
        action: 'moderation.report_updated',
        actorId,
        id: createId(),
        metadata: { changedFields: Object.keys(input).sort() },
        serverId,
        targetId: reportId,
        targetType: 'report',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: reportId,
        aggregateType: 'report',
        id: createId(),
        payload: {
          audience: { serverId, userIds: [report.reporterId] },
          data: { reportId, status: report.status },
        },
        topic: 'moderation.report_updated',
      })
      return reportResponse(report)
    })
  }

  async listCases(
    actorId: string,
    serverId: string,
    limit: number,
    before?: string,
  ) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageModerationCases,
    )
    const cursor = before ? decodeCursor(before) : null
    const conditions = [eq(moderationCases.serverId, serverId)]
    if (cursor) {
      const date = new Date(cursor.createdAt)
      conditions.push(
        or(
          lt(moderationCases.createdAt, date),
          and(
            eq(moderationCases.createdAt, date),
            lt(moderationCases.id, cursor.id),
          ),
        )!,
      )
    }
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(moderationCases)
      .where(and(...conditions))
      .orderBy(desc(moderationCases.createdAt), desc(moderationCases.id))
      .limit(limit + 1)
    const page = rows.slice(0, limit)
    const last = page.at(-1)
    return {
      cases: page.map(caseResponse),
      nextCursor:
        rows.length > limit && last
          ? encodeCursor({
              createdAt: last.createdAt.toISOString(),
              id: last.id,
            })
          : null,
    }
  }

  async getCase(actorId: string, serverId: string, caseId: string) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageModerationCases,
    )
    const { db } = requireDatabase(this.#app)
    const [moderationCase] = await db
      .select()
      .from(moderationCases)
      .where(
        and(
          eq(moderationCases.id, caseId),
          eq(moderationCases.serverId, serverId),
        ),
      )
      .limit(1)
    if (!moderationCase) throw new NotFoundError('Moderation case not found')
    const [actions, appeals] = await Promise.all([
      db
        .select()
        .from(moderationActions)
        .where(eq(moderationActions.caseId, caseId))
        .orderBy(desc(moderationActions.createdAt)),
      db
        .select()
        .from(moderationAppeals)
        .where(eq(moderationAppeals.caseId, caseId))
        .orderBy(desc(moderationAppeals.createdAt)),
    ])
    return {
      actions: actions.map(actionResponse),
      appeals: appeals.map((appeal) => appealResponse(appeal, serverId)),
      case: caseResponse(moderationCase),
    }
  }

  async listOwnAppeals(userId: string) {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select({ appeal: moderationAppeals, serverId: moderationCases.serverId })
      .from(moderationAppeals)
      .innerJoin(
        moderationCases,
        eq(moderationCases.id, moderationAppeals.caseId),
      )
      .where(eq(moderationAppeals.userId, userId))
      .orderBy(desc(moderationAppeals.createdAt))
      .limit(500)
    return {
      appeals: rows.map((row) => appealResponse(row.appeal, row.serverId)),
    }
  }

  async createAppeal(userId: string, caseId: string, input: CreateAppealBody) {
    const { db } = requireDatabase(this.#app)
    return db.transaction(async (tx) => {
      const [moderationCase] = await tx
        .select()
        .from(moderationCases)
        .where(
          and(
            eq(moderationCases.id, caseId),
            eq(moderationCases.subjectType, 'user'),
            eq(moderationCases.subjectId, userId),
          ),
        )
        .limit(1)
        .for('update')
      if (!moderationCase) throw new NotFoundError('Moderation case not found')
      const [appeal] = await tx
        .insert(moderationAppeals)
        .values({ caseId, id: createId(), reason: input.reason.trim(), userId })
        .onConflictDoNothing()
        .returning()
      if (!appeal) throw new BadRequestError('A pending appeal already exists')
      await tx
        .update(moderationCases)
        .set({ status: 'appealed', updatedAt: new Date() })
        .where(eq(moderationCases.id, caseId))
      await tx.insert(outboxEvents).values({
        aggregateId: appeal.id,
        aggregateType: 'moderation_appeal',
        id: createId(),
        payload: {
          audience: { serverId: moderationCase.serverId, userIds: [userId] },
          data: { appealId: appeal.id, caseId },
        },
        topic: 'moderation.appeal_created',
      })
      return { appealId: appeal.id, caseId, status: 'pending' as const }
    })
  }

  async decideAppeal(
    actorId: string,
    serverId: string,
    appealId: string,
    input: DecideAppealBody,
  ) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageModerationCases,
    )
    const { db } = requireDatabase(this.#app)
    return db.transaction(async (tx) => {
      const [appeal] = await tx
        .select({ appeal: moderationAppeals, case: moderationCases })
        .from(moderationAppeals)
        .innerJoin(
          moderationCases,
          eq(moderationCases.id, moderationAppeals.caseId),
        )
        .where(
          and(
            eq(moderationAppeals.id, appealId),
            eq(moderationAppeals.status, 'pending'),
            eq(moderationCases.serverId, serverId),
          ),
        )
        .limit(1)
        .for('update')
      if (!appeal) throw new NotFoundError('Pending appeal not found')
      await tx
        .update(moderationAppeals)
        .set({
          decidedAt: new Date(),
          decidedBy: actorId,
          decisionNote: input.note?.trim() || null,
          status: input.decision,
        })
        .where(eq(moderationAppeals.id, appealId))
      await tx
        .update(moderationCases)
        .set({
          closedAt: new Date(),
          status: input.decision === 'accepted' ? 'dismissed' : 'resolved',
          updatedAt: new Date(),
        })
        .where(eq(moderationCases.id, appeal.case.id))
      await tx.insert(moderationActions).values({
        action: 'note',
        actorId,
        caseId: appeal.case.id,
        id: createId(),
        metadata: { appealDecision: input.decision, appealId },
        reason: input.note?.trim() || null,
      })
      await tx.insert(auditLog).values({
        action: 'moderation.appeal_decided',
        actorId,
        id: createId(),
        metadata: { decision: input.decision },
        serverId,
        targetId: appealId,
        targetType: 'appeal',
      })
      await tx.insert(outboxEvents).values({
        aggregateId: appealId,
        aggregateType: 'moderation_appeal',
        id: createId(),
        payload: {
          audience: { serverId, userIds: [appeal.appeal.userId] },
          data: { appealId, decision: input.decision },
        },
        topic: 'moderation.appeal_decided',
      })
      return { appealId, caseId: appeal.case.id, status: input.decision }
    })
  }

  async listBlocks(userId: string) {
    const { db } = requireDatabase(this.#app)
    const rows = await db
      .select()
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, userId))
      .orderBy(desc(userBlocks.createdAt))
    return {
      blocks: rows.map((block) => ({
        blockedId: block.blockedId,
        createdAt: block.createdAt.toISOString(),
        reason: block.reason,
      })),
    }
  }

  async blockUser(userId: string, blockedId: string, input: UserBlockBody) {
    if (userId === blockedId)
      throw new BadRequestError('You cannot block yourself')
    const { db } = requireDatabase(this.#app)
    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, blockedId), isNull(users.deletedAt)))
      .limit(1)
    if (!target) throw new NotFoundError('User not found')
    const [block] = await db
      .insert(userBlocks)
      .values({
        blockedId,
        blockerId: userId,
        reason: input.reason?.trim() || null,
      })
      .onConflictDoUpdate({
        set: { reason: input.reason?.trim() || null },
        target: [userBlocks.blockerId, userBlocks.blockedId],
      })
      .returning()
    if (!block) throw new Error('Block upsert returned no row')
    return {
      blockedId,
      createdAt: block.createdAt.toISOString(),
      reason: block.reason,
    }
  }

  async unblockUser(userId: string, blockedId: string) {
    const { db } = requireDatabase(this.#app)
    const removed = await db
      .delete(userBlocks)
      .where(
        and(
          eq(userBlocks.blockerId, userId),
          eq(userBlocks.blockedId, blockedId),
        ),
      )
      .returning({ blockedId: userBlocks.blockedId })
    return { removed: removed.length > 0 }
  }

  async listAutomodRules(actorId: string, serverId: string) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageAutomod,
    )
    const { db } = requireDatabase(this.#app)
    const rules = await db
      .select()
      .from(automodRules)
      .where(eq(automodRules.serverId, serverId))
      .orderBy(desc(automodRules.createdAt))
    return { rules: rules.map(ruleResponse) }
  }

  async createAutomodRule(
    actorId: string,
    serverId: string,
    input: CreateAutomodRuleBody,
  ) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageAutomod,
    )
    const config = validateAutomodConfig(input.triggerType, input.config)
    const { db } = requireDatabase(this.#app)
    return db.transaction(async (tx) => {
      const [rule] = await tx
        .insert(automodRules)
        .values({
          action: input.action,
          config,
          createdBy: actorId,
          enabled: input.enabled ?? true,
          id: createId(),
          name: input.name.trim(),
          serverId,
          triggerType: input.triggerType,
        })
        .returning()
      if (!rule) throw new Error('Automod rule insert returned no row')
      await this.#automodMutation(tx, actorId, serverId, rule.id, 'created')
      return ruleResponse(rule)
    })
  }

  async updateAutomodRule(
    actorId: string,
    serverId: string,
    ruleId: string,
    input: UpdateAutomodRuleBody,
  ) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageAutomod,
    )
    const { db } = requireDatabase(this.#app)
    const [existing] = await db
      .select()
      .from(automodRules)
      .where(
        and(eq(automodRules.id, ruleId), eq(automodRules.serverId, serverId)),
      )
      .limit(1)
    if (!existing) throw new NotFoundError('Automod rule not found')
    const triggerType =
      input.triggerType ??
      (existing.triggerType as CreateAutomodRuleBody['triggerType'])
    const config = input.config
      ? validateAutomodConfig(triggerType, input.config)
      : existing.config
    return db.transaction(async (tx) => {
      const [rule] = await tx
        .update(automodRules)
        .set({
          ...(input.action !== undefined ? { action: input.action } : {}),
          config,
          ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          triggerType,
          updatedAt: new Date(),
        })
        .where(eq(automodRules.id, ruleId))
        .returning()
      if (!rule) throw new Error('Automod rule update returned no row')
      await this.#automodMutation(tx, actorId, serverId, ruleId, 'updated')
      return ruleResponse(rule)
    })
  }

  async deleteAutomodRule(actorId: string, serverId: string, ruleId: string) {
    await authorizeServer(
      this.#app,
      actorId,
      serverId,
      Permission.ManageAutomod,
    )
    const { db } = requireDatabase(this.#app)
    return db.transaction(async (tx) => {
      const removed = await tx
        .delete(automodRules)
        .where(
          and(eq(automodRules.id, ruleId), eq(automodRules.serverId, serverId)),
        )
        .returning({ id: automodRules.id })
      if (removed.length === 0)
        throw new NotFoundError('Automod rule not found')
      await this.#automodMutation(tx, actorId, serverId, ruleId, 'deleted')
      return { deleted: true as const, ruleId }
    })
  }

  async evaluateMessage(
    serverId: string | null,
    channelId: string,
    userId: string,
    messageId: string,
    content: string,
    encrypted = false,
  ): Promise<{ blocked: boolean }> {
    if (!serverId) return { blocked: false }
    const { db } = requireDatabase(this.#app)
    const rules = await db
      .select()
      .from(automodRules)
      .where(
        and(
          eq(automodRules.serverId, serverId),
          eq(automodRules.enabled, true),
        ),
      )
    for (const rule of rules) {
      // The API only sees ciphertext in encrypted channels. Content-dependent
      // rules are intentionally not presented as if they were enforceable.
      if (
        encrypted &&
        automodEnforcementScope(rule.triggerType) === 'plaintext'
      )
        continue
      if (!(await this.#matches(rule, channelId, userId, content))) continue
      const blocked = rule.action === 'block' || rule.action === 'timeout'
      await db.transaction(async (tx) => {
        await tx.insert(automodEvents).values({
          actionTaken: rule.action,
          id: createId(),
          metadata: { channelId, triggerType: rule.triggerType },
          ruleId: rule.id,
          targetId: messageId,
          userId,
        })
        if (rule.action === 'timeout') {
          const expiresAt = new Date(Date.now() + 10 * 60_000)
          await tx
            .update(serverMembers)
            .set({
              permissionsVersion: sql`${serverMembers.permissionsVersion} + 1`,
              timeoutUntil: expiresAt,
            })
            .where(
              and(
                eq(serverMembers.serverId, serverId),
                eq(serverMembers.userId, userId),
                eq(serverMembers.state, 'active'),
              ),
            )
          const caseId = createId()
          await tx.insert(moderationCases).values({
            id: caseId,
            reason: `Automod: ${rule.name}`,
            serverId,
            subjectId: userId,
            subjectType: 'user',
          })
          await tx.insert(moderationActions).values({
            action: 'timeout',
            caseId,
            expiresAt,
            id: createId(),
            metadata: { channelId, messageId, ruleId: rule.id },
            reason: `Triggered ${rule.triggerType} rule`,
          })
        }
        await tx.insert(outboxEvents).values({
          aggregateId: rule.id,
          aggregateType: 'automod_rule',
          id: createId(),
          payload: {
            audience: { serverId, userIds: [userId] },
            data: {
              action: rule.action,
              channelId,
              messageId,
              ruleId: rule.id,
            },
          },
          topic: 'moderation.automod_triggered',
        })
      })
      if (blocked) return { blocked: true }
    }
    return { blocked: false }
  }

  async evaluateJoin(
    serverId: string,
    userId: string,
  ): Promise<{ blocked: boolean }> {
    const { db } = requireDatabase(this.#app)
    const rules = await db
      .select()
      .from(automodRules)
      .where(
        and(
          eq(automodRules.serverId, serverId),
          eq(automodRules.enabled, true),
          eq(automodRules.triggerType, 'raid'),
        ),
      )

    for (const rule of rules) {
      const intervalMs = Number(rule.config.intervalSeconds) * 1_000
      const maxJoins = Number(rule.config.maxJoins)
      const key = `automod:raid:${rule.id}:${serverId}`
      let count: number
      if (this.#app.redis) {
        count = await this.#app.redis.command.incr(key)
        if (count === 1) await this.#app.redis.command.pexpire(key, intervalMs)
      } else {
        const now = Date.now()
        const recent = (this.#localSpam.get(key) ?? []).filter(
          (timestamp) => timestamp > now - intervalMs,
        )
        recent.push(now)
        this.#localSpam.set(key, recent)
        count = recent.length
      }
      if (count <= maxJoins) continue

      const blocked = rule.action !== 'flag'
      await db.transaction(async (tx) => {
        await tx.insert(automodEvents).values({
          actionTaken: rule.action,
          id: createId(),
          metadata: { count, intervalMs, triggerType: 'raid' },
          ruleId: rule.id,
          targetId: userId,
          userId,
        })
        const caseId = createId()
        await tx.insert(moderationCases).values({
          id: caseId,
          reason: `Automod raid detection: ${rule.name}`,
          serverId,
          subjectId: userId,
          subjectType: 'user',
        })
        await tx.insert(moderationActions).values({
          action: 'note',
          caseId,
          id: createId(),
          metadata: { blockedJoin: blocked, count, ruleId: rule.id },
          reason: 'Automod detected a rapid join spike',
        })
        await tx.insert(outboxEvents).values({
          aggregateId: rule.id,
          aggregateType: 'automod_rule',
          id: createId(),
          payload: {
            audience: { serverId, userIds: [userId] },
            data: { action: rule.action, count, ruleId: rule.id, userId },
          },
          topic: 'moderation.raid_detected',
        })
      })
      if (blocked) return { blocked: true }
    }

    return { blocked: false }
  }

  async #matches(
    rule: typeof automodRules.$inferSelect,
    channelId: string,
    userId: string,
    content: string,
  ): Promise<boolean> {
    const config = rule.config
    switch (rule.triggerType) {
      case 'keyword': {
        const keywords = config.keywords as string[]
        const haystack = config.caseSensitive ? content : content.toLowerCase()
        return keywords.some((keyword) =>
          haystack.includes(
            config.caseSensitive ? keyword : keyword.toLowerCase(),
          ),
        )
      }
      case 'link': {
        const matches = content.match(/https?:\/\/[^\s<>()]+/gi) ?? []
        if (matches.length === 0) return false
        if (config.blockAll) return true
        const allowed = new Set(config.allowedDomains as string[])
        return matches.some((match) => {
          try {
            const host = new URL(match).hostname.toLowerCase()
            return ![...allowed].some(
              (domain) => host === domain || host.endsWith(`.${domain}`),
            )
          } catch {
            return true
          }
        })
      }
      case 'flood': {
        const mentions = content.match(/<@[0-9a-f-]{36}>/gi)?.length ?? 0
        return (
          content.length > Number(config.maxCharacters) ||
          content.split(/\r?\n/).length > Number(config.maxLines) ||
          mentions > Number(config.maxMentions)
        )
      }
      case 'spam': {
        const intervalMs = Number(config.intervalSeconds) * 1_000
        const maxMessages = Number(config.maxMessages)
        const key = `automod:spam:${rule.id}:${channelId}:${userId}`
        if (this.#app.redis) {
          const count = await this.#app.redis.command.incr(key)
          if (count === 1)
            await this.#app.redis.command.pexpire(key, intervalMs)
          return count > maxMessages
        }
        const now = Date.now()
        const recent = (this.#localSpam.get(key) ?? []).filter(
          (timestamp) => timestamp > now - intervalMs,
        )
        recent.push(now)
        this.#localSpam.set(key, recent)
        return recent.length > maxMessages
      }
      case 'raid':
        return false
      default:
        return false
    }
  }

  async #validateReportTarget(reporterId: string, input: CreateReportBody) {
    const { db } = requireDatabase(this.#app)
    switch (input.targetType) {
      case 'message': {
        const [message] = await db
          .select({
            authorId: messages.authorId,
            channelId: messages.channelId,
            channelFlags: channels.flags,
            serverId: channels.serverId,
          })
          .from(messages)
          .innerJoin(channels, eq(channels.id, messages.channelId))
          .where(eq(messages.id, input.targetId))
          .limit(1)
        if (!message) throw new NotFoundError('Message not found')
        const encrypted = (message.channelFlags & EncryptedChannelFlag) !== 0
        if (encrypted !== Boolean(input.encryptedEvidence)) {
          throw new BadRequestError(
            encrypted
              ? 'Reporting an encrypted message requires explicitly shared evidence'
              : 'Encrypted evidence is only accepted for encrypted channels',
            'INVALID_REPORT_EVIDENCE',
          )
        }
        if (
          input.encryptedEvidence &&
          (input.encryptedEvidence.message.channelId !== message.channelId ||
            input.encryptedEvidence.message.authorId !== message.authorId)
        ) {
          throw new BadRequestError(
            'Encrypted evidence metadata does not match the reported message',
            'INVALID_REPORT_EVIDENCE',
          )
        }
        if (input.serverId && input.serverId !== message.serverId) {
          throw new BadRequestError('Report server does not match its target')
        }
        await authorizeChannel(
          this.#app,
          reporterId,
          message.channelId,
          Permission.ReadMessageHistory,
        )
        return message.serverId
      }
      case 'channel': {
        const authorization = await authorizeChannel(
          this.#app,
          reporterId,
          input.targetId,
          Permission.ViewChannel,
        )
        if (
          input.serverId &&
          input.serverId !== authorization.channel.serverId
        ) {
          throw new BadRequestError('Report server does not match its target')
        }
        return authorization.channel.serverId
      }
      case 'server':
        if (input.serverId && input.serverId !== input.targetId) {
          throw new BadRequestError('Report server does not match its target')
        }
        await authorizeServer(this.#app, reporterId, input.targetId)
        return input.targetId
      case 'user': {
        const [target] = await db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.id, input.targetId), isNull(users.deletedAt)))
          .limit(1)
        if (!target) throw new NotFoundError('User not found')
        if (input.serverId) {
          await authorizeServer(this.#app, reporterId, input.serverId)
          const [member] = await db
            .select({ id: serverMembers.id })
            .from(serverMembers)
            .where(
              and(
                eq(serverMembers.serverId, input.serverId),
                eq(serverMembers.userId, input.targetId),
                eq(serverMembers.state, 'active'),
              ),
            )
            .limit(1)
          if (!member)
            throw new BadRequestError('Reported user is not in the server')
        }
        return input.serverId ?? null
      }
    }
  }

  async #automodMutation(
    tx: Parameters<
      Parameters<ReturnType<typeof requireDatabase>['db']['transaction']>[0]
    >[0],
    actorId: string,
    serverId: string,
    ruleId: string,
    mutation: 'created' | 'deleted' | 'updated',
  ) {
    await tx.insert(auditLog).values({
      action: `automod.rule_${mutation}`,
      actorId,
      id: createId(),
      serverId,
      targetId: ruleId,
      targetType: 'automod_rule',
    })
    await tx.insert(outboxEvents).values({
      aggregateId: ruleId,
      aggregateType: 'automod_rule',
      id: createId(),
      payload: { audience: { serverId }, data: { ruleId } },
      topic: `automod.rule_${mutation}`,
    })
  }
}
