import { Type, type Static } from 'typebox'

import { CursorPageSchema, DateTimeSchema, IdSchema } from './common.js'

export const ReportTargetTypeSchema = Type.Union([
  Type.Literal('user'),
  Type.Literal('message'),
  Type.Literal('server'),
  Type.Literal('channel'),
])

export const ReportStatusSchema = Type.Union([
  Type.Literal('open'),
  Type.Literal('reviewing'),
  Type.Literal('resolved'),
  Type.Literal('dismissed'),
])

export const ReportedMessageSchema = Type.Object({
  authorId: IdSchema,
  channelId: IdSchema,
  content: Type.String({ maxLength: 16_000 }),
  createdAt: DateTimeSchema,
  id: IdSchema,
})

export const EncryptedReportEvidenceSchema = Type.Object(
  {
    context: Type.Array(ReportedMessageSchema, { maxItems: 20 }),
    cryptographicMaterial: Type.Object({
      algorithm: Type.Literal('Ed25519'),
      authorPublicKey: Type.String({ maxLength: 1_024, minLength: 1 }),
      signature: Type.String({ maxLength: 1_024, minLength: 1 }),
    }),
    message: ReportedMessageSchema,
  },
  { additionalProperties: false },
)

export const ReportEvidenceSchema = Type.Object({
  authorKeyFingerprint: Type.String(),
  context: Type.Array(ReportedMessageSchema),
  cryptographicMaterial:
    EncryptedReportEvidenceSchema.properties.cryptographicMaterial,
  message: ReportedMessageSchema,
  verification: Type.Literal('signature_valid'),
})

export const ReportSchema = Type.Object({
  assignedTo: Type.Union([IdSchema, Type.Null()]),
  category: Type.String(),
  createdAt: DateTimeSchema,
  description: Type.Union([Type.String(), Type.Null()]),
  encryptedEvidence: Type.Union([ReportEvidenceSchema, Type.Null()]),
  id: IdSchema,
  reporterId: IdSchema,
  resolutionNote: Type.Union([Type.String(), Type.Null()]),
  serverId: Type.Union([IdSchema, Type.Null()]),
  status: ReportStatusSchema,
  targetId: IdSchema,
  targetType: ReportTargetTypeSchema,
  updatedAt: DateTimeSchema,
})

export const CreateReportBodySchema = Type.Object(
  {
    category: Type.String({ maxLength: 64, minLength: 1 }),
    description: Type.Optional(Type.String({ maxLength: 2_000 })),
    encryptedEvidence: Type.Optional(EncryptedReportEvidenceSchema),
    serverId: Type.Optional(IdSchema),
    targetId: IdSchema,
    targetType: ReportTargetTypeSchema,
  },
  { additionalProperties: false, $id: 'CreateReportBody' },
)

export const UpdateReportBodySchema = Type.Object(
  {
    assignedTo: Type.Optional(Type.Union([IdSchema, Type.Null()])),
    resolutionNote: Type.Optional(Type.String({ maxLength: 2_000 })),
    status: Type.Optional(ReportStatusSchema),
  },
  { additionalProperties: false, minProperties: 1, $id: 'UpdateReportBody' },
)

export const ReportListResponseSchema = Type.Intersect([
  Type.Object({ reports: Type.Array(ReportSchema) }),
  CursorPageSchema,
])

export const AutomodTriggerSchema = Type.Union([
  Type.Literal('keyword'),
  Type.Literal('spam'),
  Type.Literal('link'),
  Type.Literal('flood'),
  Type.Literal('raid'),
])

export const AutomodActionSchema = Type.Union([
  Type.Literal('block'),
  Type.Literal('flag'),
  Type.Literal('timeout'),
])

export const AutomodRuleSchema = Type.Object({
  action: AutomodActionSchema,
  config: Type.Record(Type.String(), Type.Unknown()),
  createdAt: DateTimeSchema,
  enabled: Type.Boolean(),
  id: IdSchema,
  enforcementScope: Type.Union([
    Type.Literal('metadata'),
    Type.Literal('plaintext'),
  ]),
  name: Type.String(),
  serverId: IdSchema,
  triggerType: AutomodTriggerSchema,
  updatedAt: DateTimeSchema,
})

export const CreateAutomodRuleBodySchema = Type.Object(
  {
    action: AutomodActionSchema,
    config: Type.Record(Type.String(), Type.Unknown()),
    enabled: Type.Optional(Type.Boolean()),
    name: Type.String({ maxLength: 100, minLength: 1 }),
    triggerType: AutomodTriggerSchema,
  },
  { additionalProperties: false, $id: 'CreateAutomodRuleBody' },
)

export const UpdateAutomodRuleBodySchema = Type.Partial(
  CreateAutomodRuleBodySchema,
  {
    additionalProperties: false,
    minProperties: 1,
    $id: 'UpdateAutomodRuleBody',
  },
)

export const AutomodRuleListResponseSchema = Type.Object({
  rules: Type.Array(AutomodRuleSchema),
})

export const ModerationCaseSchema = Type.Object({
  assignedTo: Type.Union([IdSchema, Type.Null()]),
  closedAt: Type.Union([DateTimeSchema, Type.Null()]),
  createdAt: DateTimeSchema,
  id: IdSchema,
  openedBy: Type.Union([IdSchema, Type.Null()]),
  reason: Type.Union([Type.String(), Type.Null()]),
  serverId: IdSchema,
  status: Type.String(),
  subjectId: IdSchema,
  subjectType: ReportTargetTypeSchema,
  updatedAt: DateTimeSchema,
})

export const ModerationCaseListResponseSchema = Type.Intersect([
  Type.Object({ cases: Type.Array(ModerationCaseSchema) }),
  CursorPageSchema,
])

export const ModerationActionSchema = Type.Object({
  action: Type.String(),
  actorId: Type.Union([IdSchema, Type.Null()]),
  createdAt: DateTimeSchema,
  expiresAt: Type.Union([DateTimeSchema, Type.Null()]),
  id: IdSchema,
  metadata: Type.Record(Type.String(), Type.Unknown()),
  reason: Type.Union([Type.String(), Type.Null()]),
})

export const ModerationAppealSchema = Type.Object({
  caseId: IdSchema,
  createdAt: DateTimeSchema,
  decidedAt: Type.Union([DateTimeSchema, Type.Null()]),
  decidedBy: Type.Union([IdSchema, Type.Null()]),
  decisionNote: Type.Union([Type.String(), Type.Null()]),
  id: IdSchema,
  reason: Type.String(),
  serverId: IdSchema,
  status: Type.Union([
    Type.Literal('pending'),
    Type.Literal('accepted'),
    Type.Literal('rejected'),
  ]),
  userId: IdSchema,
})

export const ModerationCaseDetailSchema = Type.Object({
  actions: Type.Array(ModerationActionSchema),
  appeals: Type.Array(ModerationAppealSchema),
  case: ModerationCaseSchema,
})

export const ModerationAppealListResponseSchema = Type.Object({
  appeals: Type.Array(ModerationAppealSchema),
})

export const CreateAppealBodySchema = Type.Object(
  { reason: Type.String({ maxLength: 2_000, minLength: 10 }) },
  { additionalProperties: false, $id: 'CreateAppealBody' },
)

export const DecideAppealBodySchema = Type.Object(
  {
    decision: Type.Union([Type.Literal('accepted'), Type.Literal('rejected')]),
    note: Type.Optional(Type.String({ maxLength: 2_000 })),
  },
  { additionalProperties: false, $id: 'DecideAppealBody' },
)

export const UserBlockBodySchema = Type.Object(
  { reason: Type.Optional(Type.String({ maxLength: 500 })) },
  { additionalProperties: false, $id: 'UserBlockBody' },
)

export const UserBlockSchema = Type.Object({
  blockedId: IdSchema,
  createdAt: DateTimeSchema,
  reason: Type.Union([Type.String(), Type.Null()]),
})

export type CreateAppealBody = Static<typeof CreateAppealBodySchema>
export type CreateAutomodRuleBody = Static<typeof CreateAutomodRuleBodySchema>
export type CreateReportBody = Static<typeof CreateReportBodySchema>
export type DecideAppealBody = Static<typeof DecideAppealBodySchema>
export type UpdateAutomodRuleBody = Static<typeof UpdateAutomodRuleBodySchema>
export type UpdateReportBody = Static<typeof UpdateReportBodySchema>
export type UserBlockBody = Static<typeof UserBlockBodySchema>
