export interface paths {
    "/api/users/@me/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List active account devices and sessions */
        get: operations["listCurrentUserSessions"];
        put?: never;
        post?: never;
        /** Revoke all account sessions */
        delete: operations["revokeAllCurrentUserSessions"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/sessions/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke one account session */
        delete: operations["revokeCurrentUserSession"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Change the local account password */
        post: operations["changeCurrentUserPassword"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/password/reset/request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Request a one-time password reset link */
        post: operations["requestPasswordReset"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/password/reset/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Consume a reset token and replace the password */
        post: operations["completePasswordReset"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/email/verification": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Send an email verification link */
        post: operations["requestEmailVerification"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/email/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Consume an email verification token */
        post: operations["verifyEmail"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/email/change": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Send a confirmation link to a new email address */
        post: operations["requestCurrentUserEmailChange"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/email/change/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Consume a token and safely replace the account email */
        post: operations["confirmEmailChange"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/security-events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List the account security audit trail */
        get: operations["listCurrentUserSecurityEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a user account and session */
        post: operations["register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a session using local credentials */
        post: operations["login"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Rotate a refresh token and issue a new access token */
        post: operations["refreshSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Revoke the current session */
        post: operations["logout"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Return the authenticated user */
        get: operations["getCurrentUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a server visible to the current member */
        get: operations["getServer"];
        put?: never;
        post?: never;
        /** Soft-delete a server and deactivate its memberships */
        delete: operations["deleteServer"];
        options?: never;
        head?: never;
        /** Update server settings using ManageServer permission */
        patch: operations["updateServer"];
        trace?: never;
    };
    "/api/servers/{serverId}/transfer-ownership": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Transfer ownership to another active member */
        post: operations["transferServerOwnership"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/channels/{channelId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Soft-delete a channel and detach its children */
        delete: operations["deleteChannel"];
        options?: never;
        head?: never;
        /** Update a server channel without changing its type */
        patch: operations["updateChannel"];
        trace?: never;
    };
    "/api/servers/{serverId}/channels/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace the complete channel and category order */
        put: operations["reorderServerChannels"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/channels/{channelId}/permission-overwrites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List channel role and member permission overwrites */
        get: operations["listChannelPermissionOverwrites"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/channels/{channelId}/permission-overwrites/{subjectType}/{subjectId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Create or replace a channel permission overwrite */
        put: operations["upsertChannelPermissionOverwrite"];
        post?: never;
        /** Delete a channel permission overwrite */
        delete: operations["deleteChannelPermissionOverwrite"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List roles from highest to lowest */
        get: operations["listServerRoles"];
        put?: never;
        /** Create a role without privilege escalation */
        post: operations["createRole"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/roles/{roleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete an unmanaged non-default role */
        delete: operations["deleteServerRole"];
        options?: never;
        head?: never;
        /** Update a role without permission escalation */
        patch: operations["updateServerRole"];
        trace?: never;
    };
    "/api/servers/{serverId}/roles/order": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace the complete role hierarchy as server owner */
        put: operations["reorderServerRoles"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/audit-log": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List the permission-protected server audit trail */
        get: operations["listServerAuditLog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/dms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List private conversations for the current user */
        get: operations["listDirectMessages"];
        put?: never;
        /** Create or return a canonical two-user conversation */
        post: operations["createDirectMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/files/uploads": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a quarantined S3 multipart upload */
        post: operations["initiateFileUpload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/files/uploads/{uploadId}/parts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Sign one multipart upload part */
        post: operations["presignFileUploadPart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/files/uploads/{uploadId}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Complete upload and move the file into quarantine */
        post: operations["completeFileUpload"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/files/uploads/{uploadId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Abort and remove a pending multipart upload */
        delete: operations["abortFileUpload"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/files/{fileId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Return authorized file metadata and processing state */
        get: operations["getFile"];
        put?: never;
        post?: never;
        /** Delete an unused owned file */
        delete: operations["deleteFile"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/files/{fileId}/download": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Create a short authorized download URL */
        get: operations["downloadFile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/files/{fileId}/reprocess": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Retry scanning and processing an owned quarantined file */
        post: operations["reprocessFile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Report service health */
        get: operations["getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Report whether dependencies are ready */
        get: operations["getReadiness"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List active server members using cursor pagination */
        get: operations["listServerMembers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/members/@me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Leave a server after transferring ownership if necessary */
        delete: operations["leaveServer"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/members/{userId}/kick": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Kick a lower-permission member and record the action */
        post: operations["kickServerMember"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/members/{userId}/timeout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Apply a server timeout with a moderation case */
        post: operations["timeoutMember"];
        /** Clear an active or stale server timeout */
        delete: operations["clearMemberTimeout"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/bans/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove a server ban and record the action */
        delete: operations["unbanServerMember"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/members/{userId}/roles": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Replace member roles without permission escalation */
        put: operations["replaceMemberRoles"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/members/{userId}/ban": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Ban a member atomically and write the audit trail */
        post: operations["banMember"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/channels/{channelId}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Read channel history using keyset pagination */
        get: operations["listMessages"];
        put?: never;
        /** Send an idempotent message */
        post: operations["createMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/messages/{messageId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Replace a message with a stable tombstone */
        delete: operations["deleteMessage"];
        options?: never;
        head?: never;
        /** Edit a message and retain its moderation history */
        patch: operations["updateMessage"];
        trace?: never;
    };
    "/api/messages/{messageId}/reactions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Add an idempotent reaction to a message */
        put: operations["addMessageReaction"];
        post?: never;
        /** Remove the current user reaction */
        delete: operations["removeMessageReaction"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/channels/{channelId}/read-state": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Move the current user read cursor atomically */
        put: operations["markChannelRead"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Report visible content, a user or a community */
        post: operations["createReport"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/reports": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List the server moderation report queue */
        get: operations["listServerReports"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/reports/{reportId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Assign, review or resolve a report */
        patch: operations["updateServerReport"];
        trace?: never;
    };
    "/api/servers/{serverId}/moderation/cases": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List complete server moderation history */
        get: operations["listModerationCases"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/moderation/cases/{caseId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a moderation case with actions and appeals */
        get: operations["getModerationCase"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/moderation/appeals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List the current user moderation appeal history */
        get: operations["listCurrentUserModerationAppeals"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/moderation/cases/{caseId}/appeals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Appeal a moderation case concerning the current user */
        post: operations["createModerationAppeal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/moderation/appeals/{appealId}/decision": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Accept or reject a moderation appeal */
        post: operations["decideModerationAppeal"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/blocks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List blocked users */
        get: operations["listCurrentUserBlocks"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/blocks/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Block a user and prevent direct interaction */
        put: operations["blockUser"];
        post?: never;
        /** Remove a user block */
        delete: operations["unblockUser"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/automod/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List server automod rules */
        get: operations["listAutomodRules"];
        put?: never;
        /** Create a validated server automod rule */
        post: operations["createAutomodRule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/automod/rules/{ruleId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Delete a server automod rule */
        delete: operations["deleteAutomodRule"];
        options?: never;
        head?: never;
        /** Update a server automod rule */
        patch: operations["updateAutomodRule"];
        trace?: never;
    };
    "/api/users/@me/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List the current user notification inbox */
        get: operations["listNotifications"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/notifications/{notificationId}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark one notification as read */
        post: operations["markNotificationRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Mark every current user notification as read */
        post: operations["markAllNotificationsRead"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/notification-preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List notification delivery and mute preferences */
        get: operations["listNotificationPreferences"];
        /** Create or replace a scoped notification preference */
        put: operations["upsertNotificationPreference"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/push-subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List current user web push subscriptions */
        get: operations["listPushSubscriptions"];
        put?: never;
        /** Register or rotate a web push subscription */
        post: operations["createPushSubscription"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/push-subscriptions/{subscriptionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke a web push subscription */
        delete: operations["deletePushSubscription"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/search/messages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search only messages visible to the current user */
        get: operations["searchMessages"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/search/servers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search public and joined communities */
        get: operations["searchServers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a server with default text and voice channels */
        post: operations["createServer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/@me/servers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List servers joined by the authenticated user */
        get: operations["listCurrentUserServers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/channels": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List channels visible to the current member */
        get: operations["listServerChannels"];
        put?: never;
        /** Create a channel using server role permissions */
        post: operations["createChannel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/servers/{serverId}/invites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create a hashed, optionally expiring server invite */
        post: operations["createInvite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/invites/{code}/join": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Join a server using an invite in one locked transaction */
        post: operations["joinServerInvite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/channels/{channelId}/voice/token": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Issue a short-lived LiveKit token after permission checks */
        post: operations["createVoiceToken"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: never;
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listCurrentUserSessions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        sessions: {
                            city: string | null;
                            countryCode: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            current: boolean;
                            device: {
                                /** Format: uuid */
                                id: string;
                                name: string;
                                platform: string;
                                trustedAt: string | null;
                            };
                            /** Format: date-time */
                            expiresAt: string;
                            /** Format: uuid */
                            id: string;
                            ipAddress: string | null;
                            /** Format: date-time */
                            lastSeenAt: string;
                            userAgent: string | null;
                        }[];
                    };
                };
            };
        };
    };
    revokeAllCurrentUserSessions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    keepCurrent?: boolean;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        revoked: number;
                    };
                };
            };
        };
    };
    revokeCurrentUserSession: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        revoked: number;
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    changeCurrentUserPassword: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    currentPassword: string;
                    newPassword: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        revokedSessions: number;
                        /** @enum {boolean} */
                        updated: true;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    requestPasswordReset: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: email */
                    email: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        accepted: true;
                        testToken?: string;
                    };
                };
            };
        };
    };
    completePasswordReset: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    newPassword: string;
                    token: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        accepted: true;
                        testToken?: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    requestEmailVerification: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        accepted: true;
                        testToken?: string;
                    };
                };
            };
            /** @description Default Response */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    verifyEmail: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    token: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        accepted: true;
                        testToken?: string;
                    };
                };
            };
        };
    };
    requestCurrentUserEmailChange: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: email */
                    newEmail: string;
                    password: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        accepted: true;
                        testToken?: string;
                    };
                };
            };
            /** @description Default Response */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    confirmEmailChange: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    token: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        accepted: true;
                        testToken?: string;
                    };
                };
            };
            /** @description Default Response */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    listCurrentUserSecurityEvents: {
        parameters: {
            query?: {
                before?: string;
                limit?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        events: {
                            action: string;
                            /** Format: date-time */
                            createdAt: string;
                            /** Format: uuid */
                            id: string;
                            metadata: {
                                [key: string]: unknown;
                            };
                        }[];
                        nextCursor: string | null;
                    };
                };
            };
        };
    };
    register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    displayName: string;
                    /** Format: email */
                    email: string;
                    handle: string;
                    password: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        tokens: {
                            accessToken: string;
                            /** Format: date-time */
                            accessTokenExpiresAt: string;
                            refreshToken: string;
                            /** Format: date-time */
                            refreshTokenExpiresAt: string;
                            /** Format: uuid */
                            deviceId: string;
                            /** Format: uuid */
                            sessionId: string;
                            /** @enum {string} */
                            tokenType: "Bearer";
                        };
                        /** CurrentUser */
                        user: {
                            avatarUrl: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            displayName: string;
                            handle: string;
                            /** Format: uuid */
                            id: string;
                            status: "active" | "disabled" | "pending_deletion";
                        } & {
                            /** Format: email */
                            email: string;
                            emailVerified: boolean;
                        };
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    login: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: email */
                    email: string;
                    password: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        tokens: {
                            accessToken: string;
                            /** Format: date-time */
                            accessTokenExpiresAt: string;
                            refreshToken: string;
                            /** Format: date-time */
                            refreshTokenExpiresAt: string;
                            /** Format: uuid */
                            deviceId: string;
                            /** Format: uuid */
                            sessionId: string;
                            /** @enum {string} */
                            tokenType: "Bearer";
                        };
                        user: {
                            avatarUrl: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            displayName: string;
                            handle: string;
                            /** Format: uuid */
                            id: string;
                            status: "active" | "disabled" | "pending_deletion";
                        } & {
                            /** Format: email */
                            email: string;
                            emailVerified: boolean;
                        };
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    refreshSession: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    refreshToken: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        tokens: {
                            accessToken: string;
                            /** Format: date-time */
                            accessTokenExpiresAt: string;
                            refreshToken: string;
                            /** Format: date-time */
                            refreshTokenExpiresAt: string;
                            /** Format: uuid */
                            deviceId: string;
                            /** Format: uuid */
                            sessionId: string;
                            /** @enum {string} */
                            tokenType: "Bearer";
                        };
                        user: {
                            avatarUrl: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            displayName: string;
                            handle: string;
                            /** Format: uuid */
                            id: string;
                            status: "active" | "disabled" | "pending_deletion";
                        } & {
                            /** Format: email */
                            email: string;
                            emailVerified: boolean;
                        };
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    logout: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    refreshToken?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        revoked: boolean;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    getCurrentUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        avatarUrl: string | null;
                        /** Format: date-time */
                        createdAt: string;
                        displayName: string;
                        handle: string;
                        /** Format: uuid */
                        id: string;
                        status: "active" | "disabled" | "pending_deletion";
                    } & {
                        /** Format: email */
                        email: string;
                        emailVerified: boolean;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    getServer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        createdAt: string;
                        description: string | null;
                        /** Format: uuid */
                        id: string;
                        memberCount: number;
                        name: string;
                        /** Format: uuid */
                        ownerId: string;
                        slug: string;
                        version: number;
                        visibility: "private" | "unlisted" | "public";
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    deleteServer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        deleted: true;
                        /** Format: uuid */
                        serverId: string;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    updateServer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    description?: string | null;
                    name?: string;
                    visibility?: "private" | "unlisted" | "public";
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        createdAt: string;
                        description: string | null;
                        /** Format: uuid */
                        id: string;
                        memberCount: number;
                        name: string;
                        /** Format: uuid */
                        ownerId: string;
                        slug: string;
                        version: number;
                        visibility: "private" | "unlisted" | "public";
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    transferServerOwnership: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    newOwnerId: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        createdAt: string;
                        description: string | null;
                        /** Format: uuid */
                        id: string;
                        memberCount: number;
                        name: string;
                        /** Format: uuid */
                        ownerId: string;
                        slug: string;
                        version: number;
                        visibility: "private" | "unlisted" | "public";
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    deleteChannel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        channelId: string;
                        /** @enum {boolean} */
                        deleted: true;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    updateChannel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name?: string;
                    parentId?: string | null;
                    slowmodeSeconds?: number;
                    topic?: string | null;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        archivedAt: string | null;
                        /** Format: uuid */
                        id: string;
                        name: string;
                        parentId: string | null;
                        positionKey: string;
                        serverId: string | null;
                        slowmodeSeconds: number;
                        topic: string | null;
                        type: "category" | "text" | "announcement" | "forum" | "voice" | "stage" | "thread_public" | "thread_private" | "dm" | "group_dm";
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    reorderServerChannels: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Every active server channel in display order, including categories. */
                    items: {
                        /** Format: uuid */
                        channelId: string;
                        parentId: string | null;
                    }[];
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        channels: {
                            archivedAt: string | null;
                            /** Format: uuid */
                            id: string;
                            name: string;
                            parentId: string | null;
                            positionKey: string;
                            serverId: string | null;
                            slowmodeSeconds: number;
                            topic: string | null;
                            type: "category" | "text" | "announcement" | "forum" | "voice" | "stage" | "thread_public" | "thread_private" | "dm" | "group_dm";
                        }[];
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    listChannelPermissionOverwrites: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        overwrites: {
                            allowBits: string;
                            /** Format: uuid */
                            channelId: string;
                            denyBits: string;
                            /** Format: uuid */
                            subjectId: string;
                            subjectType: "role" | "member";
                        }[];
                    };
                };
            };
        };
    };
    upsertChannelPermissionOverwrite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
                subjectId: string;
                subjectType: "role" | "member";
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    allowBits: string;
                    denyBits: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        allowBits: string;
                        /** Format: uuid */
                        channelId: string;
                        denyBits: string;
                        /** Format: uuid */
                        subjectId: string;
                        subjectType: "role" | "member";
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    deleteChannelPermissionOverwrite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
                subjectId: string;
                subjectType: "role" | "member";
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        channelId: string;
                        removed: boolean;
                        /** Format: uuid */
                        subjectId: string;
                        subjectType: "role" | "member";
                    };
                };
            };
        };
    };
    listServerRoles: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        roles: {
                            color: string | null;
                            /** Format: uuid */
                            id: string;
                            isDefault: boolean;
                            name: string;
                            permissions: string;
                            positionKey: string;
                            /** Format: uuid */
                            serverId: string;
                        }[];
                    };
                };
            };
        };
    };
    createRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    color?: string;
                    name: string;
                    permissions?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        color: string | null;
                        /** Format: uuid */
                        id: string;
                        isDefault: boolean;
                        name: string;
                        permissions: string;
                        positionKey: string;
                        /** Format: uuid */
                        serverId: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    deleteServerRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                roleId: string;
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        deleted: true;
                        /** Format: uuid */
                        roleId: string;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    updateServerRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                roleId: string;
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    color?: string | null;
                    name?: string;
                    permissions?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        color: string | null;
                        /** Format: uuid */
                        id: string;
                        isDefault: boolean;
                        name: string;
                        permissions: string;
                        positionKey: string;
                        /** Format: uuid */
                        serverId: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    reorderServerRoles: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** @description Every non-default role ID, ordered from highest to lowest. */
                    roleIds: string[];
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        roles: {
                            color: string | null;
                            /** Format: uuid */
                            id: string;
                            isDefault: boolean;
                            name: string;
                            permissions: string;
                            positionKey: string;
                            /** Format: uuid */
                            serverId: string;
                        }[];
                    };
                };
            };
        };
    };
    listServerAuditLog: {
        parameters: {
            query?: {
                before?: string;
                limit?: number;
            };
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        entries: {
                            action: string;
                            actorId: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            /** Format: uuid */
                            id: string;
                            metadata: {
                                [key: string]: unknown;
                            };
                            reason: string | null;
                            /** Format: uuid */
                            serverId: string;
                            targetId: string | null;
                            targetType: string | null;
                        }[];
                    } & {
                        nextCursor: string | null;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    listDirectMessages: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        channels: {
                            archivedAt: string | null;
                            /** Format: uuid */
                            id: string;
                            name: string;
                            parentId: string | null;
                            positionKey: string;
                            serverId: string | null;
                            slowmodeSeconds: number;
                            topic: string | null;
                            type: "category" | "text" | "announcement" | "forum" | "voice" | "stage" | "thread_public" | "thread_private" | "dm" | "group_dm";
                        }[];
                    };
                };
            };
        };
    };
    createDirectMessage: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    recipientId: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        archivedAt: string | null;
                        /** Format: uuid */
                        id: string;
                        name: string;
                        parentId: string | null;
                        positionKey: string;
                        serverId: string | null;
                        slowmodeSeconds: number;
                        topic: string | null;
                        type: "category" | "text" | "announcement" | "forum" | "voice" | "stage" | "thread_public" | "thread_private" | "dm" | "group_dm";
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    initiateFileUpload: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    mimeType: string;
                    originalName: string;
                    purpose: "attachment" | "avatar" | "banner" | "server_icon" | "emoji";
                    /** Format: uuid */
                    serverId?: string;
                    sizeBytes: number;
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        expiresAt: string;
                        /** Format: uuid */
                        fileId: string;
                        partSizeBytes: number;
                        parts: {
                            partNumber: number;
                            url: string;
                        }[];
                        /** Format: uuid */
                        uploadId: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    presignFileUploadPart: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                uploadId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    partNumber: number;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        expiresAt: string;
                        url: string;
                    };
                };
            };
        };
    };
    completeFileUpload: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                uploadId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    parts: {
                        etag: string;
                        partNumber: number;
                    }[];
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        fileId: string;
                        status: "pending" | "quarantined" | "processing" | "ready" | "rejected" | "deleted";
                    };
                };
            };
        };
    };
    abortFileUpload: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                uploadId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        fileId: string;
                        status: "pending" | "quarantined" | "processing" | "ready" | "rejected" | "deleted";
                    };
                };
            };
        };
    };
    getFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                fileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        createdAt: string;
                        durationMs: number | null;
                        height: number | null;
                        /** Format: uuid */
                        id: string;
                        mimeType: string;
                        originalName: string;
                        purpose: "attachment" | "avatar" | "banner" | "server_icon" | "emoji";
                        rejectionReason: string | null;
                        scanStatus: string;
                        serverId: string | null;
                        sizeBytes: number;
                        status: "pending" | "quarantined" | "processing" | "ready" | "rejected" | "deleted";
                        variants: {
                            height: number | null;
                            /** Format: uuid */
                            id: string;
                            mimeType: string;
                            sizeBytes: number;
                            type: string;
                            width: number | null;
                        }[];
                        width: number | null;
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    deleteFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                fileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        fileId: string;
                        status: "pending" | "quarantined" | "processing" | "ready" | "rejected" | "deleted";
                    };
                };
            };
        };
    };
    downloadFile: {
        parameters: {
            query?: {
                variant?: string;
            };
            header?: never;
            path: {
                fileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        expiresAt: string;
                        url: string;
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    reprocessFile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                fileId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        fileId: string;
                        status: "pending" | "quarantined" | "processing" | "ready" | "rejected" | "deleted";
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        services: {
                            database: "available" | "disabled" | "unavailable";
                            redis: "available" | "disabled" | "unavailable";
                        };
                        status: "ok" | "degraded";
                        /** Format: date-time */
                        timestamp: string;
                    };
                };
            };
        };
    };
    getReadiness: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        services: {
                            database: "available" | "disabled" | "unavailable";
                            redis: "available" | "disabled" | "unavailable";
                        };
                        status: "ok" | "degraded";
                        /** Format: date-time */
                        timestamp: string;
                    };
                };
            };
            /** @description Default Response */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        services: {
                            database: "available" | "disabled" | "unavailable";
                            redis: "available" | "disabled" | "unavailable";
                        };
                        status: "ok" | "degraded";
                        /** Format: date-time */
                        timestamp: string;
                    };
                };
            };
        };
    };
    listServerMembers: {
        parameters: {
            query?: {
                before?: string;
                limit?: number;
            };
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        members: {
                            /** Format: uuid */
                            id: string;
                            /** Format: date-time */
                            joinedAt: string;
                            nickname: string | null;
                            permissionsVersion: number;
                            roleIds: string[];
                            timeoutUntil: string | null;
                            user: {
                                avatarUrl: string | null;
                                /** Format: date-time */
                                createdAt: string;
                                displayName: string;
                                handle: string;
                                /** Format: uuid */
                                id: string;
                                status: "active" | "disabled" | "pending_deletion";
                            };
                        }[];
                    } & {
                        nextCursor: string | null;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    leaveServer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        serverId: string;
                        /** @enum {string} */
                        state: "left";
                        /** Format: uuid */
                        userId: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    kickServerMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        serverId: string;
                        /** @enum {string} */
                        state: "left";
                        /** Format: uuid */
                        userId: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    timeoutMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    durationSeconds: number;
                    reason?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        applied: boolean;
                        /** Format: uuid */
                        targetUserId: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    clearMemberTimeout: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        cleared: boolean;
                        /** Format: uuid */
                        serverId: string;
                        /** Format: uuid */
                        userId: string;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    unbanServerMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        removed: boolean;
                        /** Format: uuid */
                        serverId: string;
                        /** Format: uuid */
                        userId: string;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    replaceMemberRoles: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    roleIds: string[];
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        memberId: string;
                        permissionsVersion: number;
                        roleIds: string[];
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    banMember: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    expiresInSeconds?: number;
                    reason?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        applied: boolean;
                        /** Format: uuid */
                        targetUserId: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    listMessages: {
        parameters: {
            query?: {
                before?: string;
                limit?: number;
            };
            header?: never;
            path: {
                channelId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        messages: {
                            attachmentIds: string[];
                            author: {
                                avatarUrl: string | null;
                                /** Format: date-time */
                                createdAt: string;
                                displayName: string;
                                handle: string;
                                /** Format: uuid */
                                id: string;
                                status: "active" | "disabled" | "pending_deletion";
                            } | null;
                            authorId: string | null;
                            /** Format: uuid */
                            channelId: string;
                            content: string;
                            /** Format: date-time */
                            createdAt: string;
                            deletedAt: string | null;
                            editedAt: string | null;
                            flags: number;
                            /** Format: uuid */
                            id: string;
                            replyToMessageId: string | null;
                            type: string;
                        }[];
                        nextCursor: string | null;
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    createMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    attachmentIds?: string[];
                    /** Format: uuid */
                    clientNonce: string;
                    content: string;
                    /** Format: uuid */
                    replyToMessageId?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        attachmentIds: string[];
                        author: {
                            avatarUrl: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            displayName: string;
                            handle: string;
                            /** Format: uuid */
                            id: string;
                            status: "active" | "disabled" | "pending_deletion";
                        } | null;
                        authorId: string | null;
                        /** Format: uuid */
                        channelId: string;
                        content: string;
                        /** Format: date-time */
                        createdAt: string;
                        deletedAt: string | null;
                        editedAt: string | null;
                        flags: number;
                        /** Format: uuid */
                        id: string;
                        replyToMessageId: string | null;
                        type: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    deleteMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                messageId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        deleted: boolean;
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    updateMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                messageId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    content: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        attachmentIds: string[];
                        author: {
                            avatarUrl: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            displayName: string;
                            handle: string;
                            /** Format: uuid */
                            id: string;
                            status: "active" | "disabled" | "pending_deletion";
                        } | null;
                        authorId: string | null;
                        /** Format: uuid */
                        channelId: string;
                        content: string;
                        /** Format: date-time */
                        createdAt: string;
                        deletedAt: string | null;
                        editedAt: string | null;
                        flags: number;
                        /** Format: uuid */
                        id: string;
                        replyToMessageId: string | null;
                        type: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    addMessageReaction: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                messageId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    emojiKey: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        active: boolean;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    removeMessageReaction: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                messageId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    emojiKey: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        active: boolean;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    markChannelRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    lastReadMessageId: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        channelId: string;
                        /** Format: date-time */
                        lastReadAt: string;
                        /** Format: uuid */
                        lastReadMessageId: string;
                        mentionCount: number;
                        /** Format: uuid */
                        userId: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    createReport: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    category: string;
                    description?: string;
                    /** Format: uuid */
                    serverId?: string;
                    /** Format: uuid */
                    targetId: string;
                    targetType: "user" | "message" | "server" | "channel";
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        assignedTo: string | null;
                        category: string;
                        /** Format: date-time */
                        createdAt: string;
                        description: string | null;
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        reporterId: string;
                        resolutionNote: string | null;
                        serverId: string | null;
                        status: "open" | "reviewing" | "resolved" | "dismissed";
                        /** Format: uuid */
                        targetId: string;
                        targetType: "user" | "message" | "server" | "channel";
                        /** Format: date-time */
                        updatedAt: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    listServerReports: {
        parameters: {
            query?: {
                before?: string;
                limit?: number;
                status?: "open" | "reviewing" | "resolved" | "dismissed";
            };
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        reports: {
                            assignedTo: string | null;
                            category: string;
                            /** Format: date-time */
                            createdAt: string;
                            description: string | null;
                            /** Format: uuid */
                            id: string;
                            /** Format: uuid */
                            reporterId: string;
                            resolutionNote: string | null;
                            serverId: string | null;
                            status: "open" | "reviewing" | "resolved" | "dismissed";
                            /** Format: uuid */
                            targetId: string;
                            targetType: "user" | "message" | "server" | "channel";
                            /** Format: date-time */
                            updatedAt: string;
                        }[];
                    } & {
                        nextCursor: string | null;
                    };
                };
            };
        };
    };
    updateServerReport: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                reportId: string;
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    assignedTo?: string | null;
                    resolutionNote?: string;
                    status?: "open" | "reviewing" | "resolved" | "dismissed";
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        assignedTo: string | null;
                        category: string;
                        /** Format: date-time */
                        createdAt: string;
                        description: string | null;
                        /** Format: uuid */
                        id: string;
                        /** Format: uuid */
                        reporterId: string;
                        resolutionNote: string | null;
                        serverId: string | null;
                        status: "open" | "reviewing" | "resolved" | "dismissed";
                        /** Format: uuid */
                        targetId: string;
                        targetType: "user" | "message" | "server" | "channel";
                        /** Format: date-time */
                        updatedAt: string;
                    };
                };
            };
        };
    };
    listModerationCases: {
        parameters: {
            query?: {
                before?: string;
                limit?: number;
            };
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        cases: {
                            assignedTo: string | null;
                            closedAt: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            /** Format: uuid */
                            id: string;
                            openedBy: string | null;
                            reason: string | null;
                            /** Format: uuid */
                            serverId: string;
                            status: string;
                            /** Format: uuid */
                            subjectId: string;
                            subjectType: "user" | "message" | "server" | "channel";
                            /** Format: date-time */
                            updatedAt: string;
                        }[];
                    } & {
                        nextCursor: string | null;
                    };
                };
            };
        };
    };
    getModerationCase: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                caseId: string;
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        actions: {
                            action: string;
                            actorId: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            expiresAt: string | null;
                            /** Format: uuid */
                            id: string;
                            metadata: {
                                [key: string]: unknown;
                            };
                            reason: string | null;
                        }[];
                        appeals: {
                            /** Format: uuid */
                            caseId: string;
                            /** Format: date-time */
                            createdAt: string;
                            decidedAt: string | null;
                            decidedBy: string | null;
                            decisionNote: string | null;
                            /** Format: uuid */
                            id: string;
                            reason: string;
                            /** Format: uuid */
                            serverId: string;
                            status: "pending" | "accepted" | "rejected";
                            /** Format: uuid */
                            userId: string;
                        }[];
                        case: {
                            assignedTo: string | null;
                            closedAt: string | null;
                            /** Format: date-time */
                            createdAt: string;
                            /** Format: uuid */
                            id: string;
                            openedBy: string | null;
                            reason: string | null;
                            /** Format: uuid */
                            serverId: string;
                            status: string;
                            /** Format: uuid */
                            subjectId: string;
                            subjectType: "user" | "message" | "server" | "channel";
                            /** Format: date-time */
                            updatedAt: string;
                        };
                    };
                };
            };
        };
    };
    listCurrentUserModerationAppeals: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        appeals: {
                            /** Format: uuid */
                            caseId: string;
                            /** Format: date-time */
                            createdAt: string;
                            decidedAt: string | null;
                            decidedBy: string | null;
                            decisionNote: string | null;
                            /** Format: uuid */
                            id: string;
                            reason: string;
                            /** Format: uuid */
                            serverId: string;
                            status: "pending" | "accepted" | "rejected";
                            /** Format: uuid */
                            userId: string;
                        }[];
                    };
                };
            };
        };
    };
    createModerationAppeal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                caseId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        appealId: string;
                        /** Format: uuid */
                        caseId: string;
                        status: string;
                    };
                };
            };
        };
    };
    decideModerationAppeal: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                appealId: string;
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    decision: "accepted" | "rejected";
                    note?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        appealId: string;
                        /** Format: uuid */
                        caseId: string;
                        status: string;
                    };
                };
            };
        };
    };
    listCurrentUserBlocks: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        blocks: {
                            /** Format: uuid */
                            blockedId: string;
                            /** Format: date-time */
                            createdAt: string;
                            reason: string | null;
                        }[];
                    };
                };
            };
        };
    };
    blockUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    reason?: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        blockedId: string;
                        /** Format: date-time */
                        createdAt: string;
                        reason: string | null;
                    };
                };
            };
        };
    };
    unblockUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                userId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        removed: boolean;
                    };
                };
            };
        };
    };
    listAutomodRules: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        rules: {
                            action: "block" | "flag" | "timeout";
                            config: {
                                [key: string]: unknown;
                            };
                            /** Format: date-time */
                            createdAt: string;
                            enabled: boolean;
                            /** Format: uuid */
                            id: string;
                            name: string;
                            /** Format: uuid */
                            serverId: string;
                            triggerType: "keyword" | "spam" | "link" | "flood" | "raid";
                            /** Format: date-time */
                            updatedAt: string;
                        }[];
                    };
                };
            };
        };
    };
    createAutomodRule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    action: "block" | "flag" | "timeout";
                    config: {
                        [key: string]: unknown;
                    };
                    enabled?: boolean;
                    name: string;
                    triggerType: "keyword" | "spam" | "link" | "flood" | "raid";
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        action: "block" | "flag" | "timeout";
                        config: {
                            [key: string]: unknown;
                        };
                        /** Format: date-time */
                        createdAt: string;
                        enabled: boolean;
                        /** Format: uuid */
                        id: string;
                        name: string;
                        /** Format: uuid */
                        serverId: string;
                        triggerType: "keyword" | "spam" | "link" | "flood" | "raid";
                        /** Format: date-time */
                        updatedAt: string;
                    };
                };
            };
        };
    };
    deleteAutomodRule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ruleId: string;
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @enum {boolean} */
                        deleted: true;
                        /** Format: uuid */
                        ruleId: string;
                    };
                };
            };
        };
    };
    updateAutomodRule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                ruleId: string;
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    action?: "block" | "flag" | "timeout";
                    config?: {
                        [key: string]: unknown;
                    };
                    enabled?: boolean;
                    name?: string;
                    triggerType?: "keyword" | "spam" | "link" | "flood" | "raid";
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        action: "block" | "flag" | "timeout";
                        config: {
                            [key: string]: unknown;
                        };
                        /** Format: date-time */
                        createdAt: string;
                        enabled: boolean;
                        /** Format: uuid */
                        id: string;
                        name: string;
                        /** Format: uuid */
                        serverId: string;
                        triggerType: "keyword" | "spam" | "link" | "flood" | "raid";
                        /** Format: date-time */
                        updatedAt: string;
                    };
                };
            };
        };
    };
    listNotifications: {
        parameters: {
            query?: {
                before?: string;
                limit?: number;
                unreadOnly?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        nextCursor: string | null;
                        notifications: {
                            /** Format: date-time */
                            createdAt: string;
                            data: {
                                [key: string]: unknown;
                            };
                            groupCount: number;
                            groupKey: string | null;
                            /** Format: uuid */
                            id: string;
                            readAt: string | null;
                            seenAt: string | null;
                            type: string;
                            /** Format: uuid */
                            userId: string;
                        }[];
                    };
                };
            };
        };
    };
    markNotificationRead: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                notificationId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated: number;
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    markAllNotificationsRead: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        updated: number;
                    };
                };
            };
        };
    };
    listNotificationPreferences: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        preferences: {
                            channelId: string | null;
                            config: {
                                digest: "off" | "hourly" | "daily";
                                email: boolean;
                                muted: boolean;
                                push: boolean;
                            };
                            /** Format: uuid */
                            id: string;
                            serverId: string | null;
                            type: string;
                            /** Format: date-time */
                            updatedAt: string;
                            /** Format: uuid */
                            userId: string;
                        }[];
                    };
                };
            };
        };
    };
    upsertNotificationPreference: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    channelId?: string | null;
                    config: {
                        digest?: "off" | "hourly" | "daily";
                        email?: boolean;
                        muted?: boolean;
                        push?: boolean;
                    };
                    serverId?: string | null;
                    type: string;
                };
            };
        };
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        channelId: string | null;
                        config: {
                            digest: "off" | "hourly" | "daily";
                            email: boolean;
                            muted: boolean;
                            push: boolean;
                        };
                        /** Format: uuid */
                        id: string;
                        serverId: string | null;
                        type: string;
                        /** Format: date-time */
                        updatedAt: string;
                        /** Format: uuid */
                        userId: string;
                    };
                };
            };
        };
    };
    listPushSubscriptions: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        subscriptions: {
                            /** Format: date-time */
                            createdAt: string;
                            endpoint: string;
                            /** Format: uuid */
                            id: string;
                            lastError: string | null;
                            lastUsedAt: string | null;
                        }[];
                    };
                };
            };
        };
    };
    createPushSubscription: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    endpoint: string;
                    keys: {
                        auth: string;
                        p256dh: string;
                    };
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: date-time */
                        createdAt: string;
                        endpoint: string;
                        /** Format: uuid */
                        id: string;
                        lastError: string | null;
                        lastUsedAt: string | null;
                    };
                };
            };
        };
    };
    deletePushSubscription: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subscriptionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        removed: boolean;
                    };
                };
            };
        };
    };
    searchMessages: {
        parameters: {
            query: {
                channelId?: string;
                limit?: number;
                offset?: number;
                q: string;
                serverId?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        estimatedTotalHits: number;
                        hits: {
                            authorId: string | null;
                            /** Format: uuid */
                            channelId: string;
                            content: string;
                            /** Format: date-time */
                            createdAt: string;
                            /** Format: uuid */
                            id: string;
                            serverId: string | null;
                        }[];
                        limit: number;
                        offset: number;
                    };
                };
            };
        };
    };
    searchServers: {
        parameters: {
            query: {
                limit?: number;
                offset?: number;
                q: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        estimatedTotalHits: number;
                        hits: {
                            description: string | null;
                            /** Format: uuid */
                            id: string;
                            memberCount: number;
                            name: string;
                            slug: string;
                        }[];
                        limit: number;
                        offset: number;
                    };
                };
            };
        };
    };
    createServer: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    description?: string;
                    name: string;
                    visibility?: "private" | "unlisted" | "public";
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        defaultChannelId: string;
                        /** Server */
                        server: {
                            /** Format: date-time */
                            createdAt: string;
                            description: string | null;
                            /** Format: uuid */
                            id: string;
                            memberCount: number;
                            name: string;
                            /** Format: uuid */
                            ownerId: string;
                            slug: string;
                            version: number;
                            visibility: "private" | "unlisted" | "public";
                        };
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    listCurrentUserServers: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        servers: {
                            /** Format: date-time */
                            createdAt: string;
                            description: string | null;
                            /** Format: uuid */
                            id: string;
                            memberCount: number;
                            name: string;
                            /** Format: uuid */
                            ownerId: string;
                            slug: string;
                            version: number;
                            visibility: "private" | "unlisted" | "public";
                        }[];
                    };
                };
            };
        };
    };
    listServerChannels: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        channels: {
                            archivedAt: string | null;
                            /** Format: uuid */
                            id: string;
                            name: string;
                            parentId: string | null;
                            positionKey: string;
                            serverId: string | null;
                            slowmodeSeconds: number;
                            topic: string | null;
                            type: "category" | "text" | "announcement" | "forum" | "voice" | "stage" | "thread_public" | "thread_private" | "dm" | "group_dm";
                        }[];
                    };
                };
            };
        };
    };
    createChannel: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    name: string;
                    /** Format: uuid */
                    parentId?: string;
                    slowmodeSeconds?: number;
                    topic?: string;
                    type: "category" | "text" | "announcement" | "forum" | "voice" | "stage" | "thread_public" | "thread_private" | "dm" | "group_dm";
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        archivedAt: string | null;
                        /** Format: uuid */
                        id: string;
                        name: string;
                        parentId: string | null;
                        positionKey: string;
                        serverId: string | null;
                        slowmodeSeconds: number;
                        topic: string | null;
                        type: "category" | "text" | "announcement" | "forum" | "voice" | "stage" | "thread_public" | "thread_private" | "dm" | "group_dm";
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    createInvite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                serverId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    /** Format: uuid */
                    channelId?: string;
                    expiresInSeconds?: number;
                    maxUses?: number;
                };
            };
        };
        responses: {
            /** @description Default Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        code: string;
                        expiresAt: string | null;
                        /** Format: uuid */
                        id: string;
                        maxUses: number | null;
                        /** Format: uuid */
                        serverId: string;
                        uses: number;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    joinServerInvite: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        joined: boolean;
                        server: {
                            /** Format: date-time */
                            createdAt: string;
                            description: string | null;
                            /** Format: uuid */
                            id: string;
                            memberCount: number;
                            name: string;
                            /** Format: uuid */
                            ownerId: string;
                            slug: string;
                            version: number;
                            visibility: "private" | "unlisted" | "public";
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
    createVoiceToken: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                channelId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Default Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** Format: uuid */
                        channelId: string;
                        /** Format: date-time */
                        expiresAt: string;
                        /** Format: uri */
                        livekitUrl: string;
                        token: string;
                    };
                };
            };
            /** @description Default Response */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
            /** @description Default Response */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        error: {
                            code: string;
                            details?: {
                                field?: string;
                                message: string;
                            }[];
                            message: string;
                            requestId: string;
                        };
                    };
                };
            };
        };
    };
}
