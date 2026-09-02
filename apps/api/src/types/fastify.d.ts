import 'fastify'

import type { AppConfig } from '../config.js'
import type { AuthContext, AuthService } from '../modules/auth/auth.service.js'
import type { DatabaseService } from '../plugins/database.js'
import type { ServerService } from '../modules/servers/server.service.js'
import type { MessageService } from '../modules/messages/message.service.js'
import type { MemberService } from '../modules/members/member.service.js'
import type { ObservabilityContext } from '../plugins/observability.js'
import type { Registry } from 'prom-client'
import type { RedisService } from '../plugins/redis.js'
import type { RealtimeEventBus } from '../modules/realtime/event-bus.js'
import type { PresenceService } from '../modules/presence/presence.service.js'
import type { DirectMessageService } from '../modules/channels/direct-message.service.js'
import type { VoiceService } from '../modules/voice/voice.service.js'
import type { NotificationService } from '../modules/notifications/notification.service.js'
import type { ChannelManagementService } from '../modules/channels/channel-management.service.js'
import type { RoleService } from '../modules/roles/role.service.js'
import type { AuditService } from '../modules/audit/audit.service.js'
import type { AccountSecurityService } from '../modules/auth/account-security.service.js'
import type { MailService } from '../modules/notifications/mail.service.js'
import type { ObjectStorageService } from '../modules/files/object-storage.service.js'
import type { FileService } from '../modules/files/file.service.js'
import type { FileProcessingService } from '../modules/files/file-processing.service.js'
import type { ModerationService } from '../modules/moderation/moderation.service.js'
import type { NotificationDeliveryService } from '../modules/notifications/notification-delivery.service.js'
import type { SearchService } from '../modules/search/search.service.js'
import type { AbusePreventionService } from '../modules/abuse/abuse-prevention.service.js'
import type { BotService } from '../modules/bots/bot.service.js'
import type { EncryptionService } from '../modules/encryption/encryption.service.js'
import type { KeyBackupService } from '../modules/auth/key-backup.service.js'

declare module 'fastify' {
  interface FastifyContextConfig {
    botScopes?: string[]
  }

  interface FastifyInstance {
    abusePrevention: AbusePreventionService
    accountSecurityService: AccountSecurityService
    auditService: AuditService
    authenticate: (request: FastifyRequest) => Promise<void>
    authService: AuthService
    botService: BotService
    channelManagementService: ChannelManagementService
    config: AppConfig
    database: DatabaseService | null
    directMessageService: DirectMessageService
    encryptionService: EncryptionService
    eventBus: RealtimeEventBus
    fileProcessingService: FileProcessingService
    fileService: FileService
    keyBackupService: KeyBackupService
    metrics: Registry
    jwtSigningKey: { kid: string; privateKey: string }
    jwtVerificationKeys: ReadonlyMap<string, string>
    messageService: MessageService
    moderationService: ModerationService
    memberService: MemberService
    mailService: MailService
    notificationService: NotificationService
    notificationDeliveryService: NotificationDeliveryService
    objectStorage: ObjectStorageService
    presence: PresenceService
    reportError: (error: unknown, context?: ObservabilityContext) => void
    redis: RedisService | null
    roleService: RoleService
    searchService: SearchService
    serverService: ServerService
    voiceService: VoiceService
  }

  interface FastifyRequest {
    auth: AuthContext
  }
}
