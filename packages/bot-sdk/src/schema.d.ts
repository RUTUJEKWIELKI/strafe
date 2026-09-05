export interface paths {
    "/api/users/@me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Return the authenticated user
         * @description **Required Scopes:** None (accessible to any valid bot token)
         */
        get: operations["getCurrentUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Update current user profile
         * @description **Required Scopes:** `users:write`
         */
        patch: operations["updateUser"];
        trace?: never;
    };
    "/api/servers/{serverId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get a server visible to the current member
         * @description **Required Scopes:** `servers:read`
         */
        get: operations["getServer"];
        put?: never;
        post?: never;
        /**
         * Soft-delete a server and deactivate its memberships
         * @description **Required Scopes:** `servers:write`
         */
        delete: operations["deleteServer"];
        options?: never;
        head?: never;
        /**
         * Update server settings using ManageServer permission
         * @description **Required Scopes:** `servers:write`
         */
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
        /**
         * Transfer ownership to another active member
         * @description **Required Scopes:** `servers:write`
         */
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
        /**
         * Soft-delete a channel and detach its children
         * @description **Required Scopes:** `channels:write`
         */
        delete: operations["deleteChannel"];
        options?: never;
        head?: never;
        /**
         * Update a server channel without changing its type
         * @description **Required Scopes:** `channels:write`
         */
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
        /**
         * Replace the complete channel and category order
         * @description **Required Scopes:** `channels:write`
         */
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
        /**
         * List channel role and member permission overwrites
         * @description **Required Scopes:** `roles:read`
         */
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
        /**
         * Create or replace a channel permission overwrite
         * @description **Required Scopes:** `roles:write`
         */
        put: operations["upsertChannelPermissionOverwrite"];
        post?: never;
        /**
         * Delete a channel permission overwrite
         * @description **Required Scopes:** `roles:write`
         */
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
        /**
         * List roles from highest to lowest
         * @description **Required Scopes:** `roles:read`
         */
        get: operations["listServerRoles"];
        put?: never;
        /**
         * Create a role without privilege escalation
         * @description **Required Scopes:** `roles:write`
         */
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
        /**
         * Delete an unmanaged non-default role
         * @description **Required Scopes:** `roles:write`
         */
        delete: operations["deleteServerRole"];
        options?: never;
        head?: never;
        /**
         * Update a role without permission escalation
         * @description **Required Scopes:** `roles:write`
         */
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
        /**
         * Replace the complete role hierarchy as server owner
         * @description **Required Scopes:** `roles:write`
         */
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
        /**
         * List the permission-protected server audit trail
         * @description **Required Scopes:** `servers:read`
         */
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
        /**
         * List private conversations for the current user
         * @description **Required Scopes:** `channels:read`
         */
        get: operations["listDirectMessages"];
        put?: never;
        /**
         * Create or return a canonical two-user conversation
         * @description **Required Scopes:** `messages:write`
         */
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
        /**
         * Create a quarantined S3 multipart upload
         * @description **Required Scopes:** `messages:write`
         */
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
        /**
         * Sign one multipart upload part
         * @description **Required Scopes:** `messages:write`
         */
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
        /**
         * Complete upload and move the file into quarantine
         * @description **Required Scopes:** `messages:write`
         */
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
        /**
         * Abort and remove a pending multipart upload
         * @description **Required Scopes:** `messages:write`
         */
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
        /**
         * Return authorized file metadata and processing state
         * @description **Required Scopes:** `messages:read`
         */
        get: operations["getFile"];
        put?: never;
        post?: never;
        delete?: never;
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
        /**
         * Create a short authorized download URL
         * @description **Required Scopes:** `messages:read`
         */
        get: operations["downloadFile"];
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
        /**
         * List active server members using cursor pagination
         * @description **Required Scopes:** `members:read`
         */
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
        /**
         * Leave a server after transferring ownership if necessary
         * @description **Required Scopes:** `servers:read`
         */
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
        /**
         * Kick a lower-permission member and record the action
         * @description **Required Scopes:** `members:write`
         */
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
        /**
         * Apply a server timeout with a moderation case
         * @description **Required Scopes:** `members:write`
         */
        post: operations["timeoutMember"];
        /**
         * Clear an active or stale server timeout
         * @description **Required Scopes:** `members:write`
         */
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
        /**
         * Remove a server ban and record the action
         * @description **Required Scopes:** `members:write`
         */
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
        /**
         * Replace member roles without permission escalation
         * @description **Required Scopes:** `roles:write`
         */
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
        /**
         * Ban a member atomically and write the audit trail
         * @description **Required Scopes:** `members:write`
         */
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
        /**
         * Read channel history using keyset pagination
         * @description **Required Scopes:** `messages:read`
         */
        get: operations["listMessages"];
        put?: never;
        /**
         * Send an idempotent message
         * @description **Required Scopes:** `messages:write`
         */
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
        /**
         * Replace a message with a stable tombstone
         * @description **Required Scopes:** `messages:write`
         */
        delete: operations["deleteMessage"];
        options?: never;
        head?: never;
        /**
         * Edit a message and retain its moderation history
         * @description **Required Scopes:** `messages:write`
         */
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
        /**
         * Add an idempotent reaction to a message
         * @description **Required Scopes:** `messages:write`
         */
        put: operations["addMessageReaction"];
        post?: never;
        /**
         * Remove the current user reaction
         * @description **Required Scopes:** `messages:write`
         */
        delete: operations["removeMessageReaction"];
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
        /**
         * Search only messages visible to the current user
         * @description **Required Scopes:** `messages:read`
         */
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
        /**
         * Search public and joined communities
         * @description **Required Scopes:** `servers:read`
         */
        get: operations["searchServers"];
        put?: never;
        post?: never;
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
        /**
         * List servers joined by the authenticated user
         * @description **Required Scopes:** `servers:read`
         */
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
        /**
         * List channels visible to the current member
         * @description **Required Scopes:** `channels:read`
         */
        get: operations["listServerChannels"];
        put?: never;
        /**
         * Create a channel using server role permissions
         * @description **Required Scopes:** `channels:write`
         */
        post: operations["createChannel"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/users/{userId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Get public user profile
         * @description **Required Scopes:** `users:read`
         */
        get: operations["getUser"];
        put?: never;
        post?: never;
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
        /**
         * Issue a short-lived LiveKit token after permission checks
         * @description **Required Scopes:** `channels:read`
         */
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
    updateUser: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    displayName?: string;
                    bio?: string | null;
                    pronouns?: string | null;
                    avatarFileId?: string | null;
                    bannerFileId?: string | null;
                };
            };
        };
        responses: {
            /** @description Default Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
                        flags: number;
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
                            flags: number;
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
                            flags: number;
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
                        flags: number;
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
                    chunkSizeBytes?: number;
                    /** @enum {string} */
                    encryptionMode?: "e2ee-v1";
                    mimeType?: string;
                    originalName?: string;
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
                        encryptionMode: "none" | "e2ee-v1";
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
                            attachmentEnvelopes: {
                                envelope: string;
                                /** Format: uuid */
                                fileId: string;
                            }[];
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
                            envelope: {
                                authenticationTag: string;
                                ciphertext: string;
                                contentType: string;
                                epoch: number;
                                nonce: string;
                                /** @enum {number} */
                                protocolVersion: 1;
                                /** Format: uuid */
                                senderDeviceId: string;
                            } | null;
                            migrationState: "encrypted" | "legacy_unconvertible";
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
                    attachmentEnvelopes?: {
                        [key: string]: string;
                    };
                    /** Format: uuid */
                    clientNonce: string;
                    envelope: {
                        authenticationTag: string;
                        ciphertext: string;
                        contentType: string;
                        epoch: number;
                        nonce: string;
                        /** @enum {number} */
                        protocolVersion: 1;
                        /** Format: uuid */
                        senderDeviceId: string;
                    };
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
                        attachmentEnvelopes: {
                            envelope: string;
                            /** Format: uuid */
                            fileId: string;
                        }[];
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
                        envelope: {
                            authenticationTag: string;
                            ciphertext: string;
                            contentType: string;
                            epoch: number;
                            nonce: string;
                            /** @enum {number} */
                            protocolVersion: 1;
                            /** Format: uuid */
                            senderDeviceId: string;
                        } | null;
                        migrationState: "encrypted" | "legacy_unconvertible";
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
                    envelope: {
                        authenticationTag: string;
                        ciphertext: string;
                        contentType: string;
                        epoch: number;
                        nonce: string;
                        /** @enum {number} */
                        protocolVersion: 1;
                        /** Format: uuid */
                        senderDeviceId: string;
                    };
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
                        attachmentEnvelopes: {
                            envelope: string;
                            /** Format: uuid */
                            fileId: string;
                        }[];
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
                        envelope: {
                            authenticationTag: string;
                            ciphertext: string;
                            contentType: string;
                            epoch: number;
                            nonce: string;
                            /** @enum {number} */
                            protocolVersion: 1;
                            /** Format: uuid */
                            senderDeviceId: string;
                        } | null;
                        migrationState: "encrypted" | "legacy_unconvertible";
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
                            flags: number;
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
                    encrypted?: boolean;
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
                        flags: number;
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
    getUser: {
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
                        avatarUrl: string | null;
                        /** Format: date-time */
                        createdAt: string;
                        displayName: string;
                        handle: string;
                        /** Format: uuid */
                        id: string;
                        status: "active" | "disabled" | "pending_deletion";
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
