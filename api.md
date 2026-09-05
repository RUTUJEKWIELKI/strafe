# Strafe Bot TypeScript API

Complete reference of every operation, grouped by resource. See [the README](./README.md) for usage and configuration.

## Contents

- [`Users`](#users)
  - [Return the authenticated user](#return-the-authenticated-user)
  - [Update current user profile](#update-current-user-profile)
  - [Get public user profile](#get-public-user-profile)
- [`Servers`](#servers)
  - [Update server settings using ManageServer permission](#update-server-settings-using-manageserver-permission)
  - [Soft-delete a server and deactivate its memberships](#soft-delete-a-server-and-deactivate-its-memberships)
  - [Get a server visible to the current member](#get-a-server-visible-to-the-current-member)
  - [Transfer ownership to another active member](#transfer-ownership-to-another-active-member)
  - [List servers joined by the authenticated user](#list-servers-joined-by-the-authenticated-user)
- [`Channels`](#channels)
  - [Update a server channel without changing its type](#update-a-server-channel-without-changing-its-type)
  - [Soft-delete a channel and detach its children](#soft-delete-a-channel-and-detach-its-children)
  - [Replace the complete channel and category order](#replace-the-complete-channel-and-category-order)
  - [List channels visible to the current member](#list-channels-visible-to-the-current-member)
  - [Create a channel using server role permissions](#create-a-channel-using-server-role-permissions)
- [`Permissions`](#permissions)
  - [List channel role and member permission overwrites](#list-channel-role-and-member-permission-overwrites)
  - [Create or replace a channel permission overwrite](#create-or-replace-a-channel-permission-overwrite)
  - [Delete a channel permission overwrite](#delete-a-channel-permission-overwrite)
- [`Roles`](#roles)
  - [List roles from highest to lowest](#list-roles-from-highest-to-lowest)
  - [Create a role without privilege escalation](#create-a-role-without-privilege-escalation)
  - [Update a role without permission escalation](#update-a-role-without-permission-escalation)
  - [Delete an unmanaged non-default role](#delete-an-unmanaged-non-default-role)
  - [Replace the complete role hierarchy as server owner](#replace-the-complete-role-hierarchy-as-server-owner)
- [`Audit`](#audit)
  - [List the permission-protected server audit trail](#list-the-permission-protected-server-audit-trail)
- [`DirectMessages`](#directmessages)
  - [List private conversations for the current user](#list-private-conversations-for-the-current-user)
  - [Create or return a canonical two-user conversation](#create-or-return-a-canonical-two-user-conversation)
- [`Files`](#files)
  - [Create a quarantined S3 multipart upload](#create-a-quarantined-s3-multipart-upload)
  - [Sign one multipart upload part](#sign-one-multipart-upload-part)
  - [Complete upload and move the file into quarantine](#complete-upload-and-move-the-file-into-quarantine)
  - [Abort and remove a pending multipart upload](#abort-and-remove-a-pending-multipart-upload)
  - [Return authorized file metadata and processing state](#return-authorized-file-metadata-and-processing-state)
  - [Create a short authorized download URL](#create-a-short-authorized-download-url)
- [`Members`](#members)
  - [List active server members using cursor pagination](#list-active-server-members-using-cursor-pagination)
  - [Leave a server after transferring ownership if necessary](#leave-a-server-after-transferring-ownership-if-necessary)
  - [Replace member roles without permission escalation](#replace-member-roles-without-permission-escalation)
- [`Moderation`](#moderation)
  - [Kick a lower-permission member and record the action](#kick-a-lower-permission-member-and-record-the-action)
  - [Clear an active or stale server timeout](#clear-an-active-or-stale-server-timeout)
  - [Apply a server timeout with a moderation case](#apply-a-server-timeout-with-a-moderation-case)
  - [Remove a server ban and record the action](#remove-a-server-ban-and-record-the-action)
  - [Ban a member atomically and write the audit trail](#ban-a-member-atomically-and-write-the-audit-trail)
- [`Messages`](#messages)
  - [Read channel history using keyset pagination](#read-channel-history-using-keyset-pagination)
  - [Send an idempotent message](#send-an-idempotent-message)
  - [Edit a message and retain its moderation history](#edit-a-message-and-retain-its-moderation-history)
  - [Replace a message with a stable tombstone](#replace-a-message-with-a-stable-tombstone)
  - [Add an idempotent reaction to a message](#add-an-idempotent-reaction-to-a-message)
  - [Remove the current user reaction](#remove-the-current-user-reaction)
- [`Search`](#search)
  - [Search only messages visible to the current user](#search-only-messages-visible-to-the-current-user)
  - [Search public and joined communities](#search-public-and-joined-communities)
- [`Voice`](#voice)
  - [Issue a short-lived LiveKit token after permission checks](#issue-a-short-lived-livekit-token-after-permission-checks)

## Setup

```ts
import StrafeBotAPI from '@strafe/strafe-bot-api';

const client = new StrafeBotAPI();
```

## `Users`

### Return the authenticated user

**Required Scopes:** None (accessible to any valid bot token)

| Direction | Type |
| --- | --- |
| Response | [`UserListCurrentResponse`](./src/resources/users.ts) |

```ts
const user = await client.users.listCurrent();
```

### Update current user profile

**Required Scopes:** `users:write`

| Direction | Type |
| --- | --- |
| Request | [`UserUpdateParams`](./src/resources/users.ts) |

```ts
await client.users.update({});
```

### Get public user profile

**Required Scopes:** `users:read`

| Direction | Type |
| --- | --- |
| Response | [`UserRetrieveResponse`](./src/resources/users.ts) |

```ts
const user = await client.users.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

## `Servers`

### Update server settings using ManageServer permission

**Required Scopes:** `servers:write`

| Direction | Type |
| --- | --- |
| Request | [`ServerUpdateParams`](./src/resources/servers.ts) |
| Response | [`ServerUpdateResponse`](./src/resources/servers.ts) |

```ts
const server = await client.servers.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {});
```

### Soft-delete a server and deactivate its memberships

**Required Scopes:** `servers:write`

| Direction | Type |
| --- | --- |
| Response | [`ServerDeleteResponse`](./src/resources/servers.ts) |

```ts
const server = await client.servers.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Get a server visible to the current member

**Required Scopes:** `servers:read`

| Direction | Type |
| --- | --- |
| Response | [`ServerRetrieveResponse`](./src/resources/servers.ts) |

```ts
const server = await client.servers.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Transfer ownership to another active member

**Required Scopes:** `servers:write`

| Direction | Type |
| --- | --- |
| Request | [`ServerTransferOwnershipParams`](./src/resources/servers.ts) |
| Response | [`ServerTransferOwnershipResponse`](./src/resources/servers.ts) |

```ts
const server = await client.servers.transferOwnership('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  newOwnerId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
});
```

### List servers joined by the authenticated user

**Required Scopes:** `servers:read`

| Direction | Type |
| --- | --- |
| Response | [`ServerListCurrentUserResponse`](./src/resources/servers.ts) |

```ts
const server = await client.servers.listCurrentUser();
```

## `Channels`

### Update a server channel without changing its type

**Required Scopes:** `channels:write`

| Direction | Type |
| --- | --- |
| Request | [`ChannelUpdateParams`](./src/resources/channels.ts) |
| Response | [`ChannelUpdateResponse`](./src/resources/channels.ts) |

```ts
const channel = await client.channels.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {});
```

### Soft-delete a channel and detach its children

**Required Scopes:** `channels:write`

| Direction | Type |
| --- | --- |
| Response | [`ChannelDeleteResponse`](./src/resources/channels.ts) |

```ts
const channel = await client.channels.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Replace the complete channel and category order

**Required Scopes:** `channels:write`

| Direction | Type |
| --- | --- |
| Request | [`ChannelReorderServerParams`](./src/resources/channels.ts) |
| Response | [`ChannelReorderServerResponse`](./src/resources/channels.ts) |

```ts
const channel = await client.channels.reorderServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  items: [],
});
```

### List channels visible to the current member

**Required Scopes:** `channels:read`

| Direction | Type |
| --- | --- |
| Response | [`ChannelListServerResponse`](./src/resources/channels.ts) |

```ts
const channel = await client.channels.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Create a channel using server role permissions

**Required Scopes:** `channels:write`

| Direction | Type |
| --- | --- |
| Request | [`ChannelCreateParams`](./src/resources/channels.ts) |
| Response | [`ChannelCreateResponse`](./src/resources/channels.ts) |

```ts
const channel = await client.channels.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  name: 'x',
  type: 'category',
});
```

## `Permissions`

### List channel role and member permission overwrites

**Required Scopes:** `roles:read`

| Direction | Type |
| --- | --- |
| Response | [`PermissionListChannelOverwritesResponse`](./src/resources/permissions.ts) |

```ts
const permission = await client.permissions.listChannelOverwrites('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Create or replace a channel permission overwrite

**Required Scopes:** `roles:write`

| Direction | Type |
| --- | --- |
| Request | [`PermissionUpsertChannelOverwriteParams`](./src/resources/permissions.ts) |
| Response | [`PermissionUpsertChannelOverwriteResponse`](./src/resources/permissions.ts) |

```ts
const permission = await client.permissions.upsertChannelOverwrite('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  channelId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  subjectType: 'role',
  allowBits: '',
  denyBits: '',
});
```

### Delete a channel permission overwrite

**Required Scopes:** `roles:write`

| Direction | Type |
| --- | --- |
| Request | [`PermissionDeleteChannelOverwriteParams`](./src/resources/permissions.ts) |
| Response | [`PermissionDeleteChannelOverwriteResponse`](./src/resources/permissions.ts) |

```ts
const permission = await client.permissions.deleteChannelOverwrite('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  channelId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  subjectType: 'role',
});
```

## `Roles`

### List roles from highest to lowest

**Required Scopes:** `roles:read`

| Direction | Type |
| --- | --- |
| Response | [`RoleListServerResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Create a role without privilege escalation

**Required Scopes:** `roles:write`

| Direction | Type |
| --- | --- |
| Request | [`RoleCreateParams`](./src/resources/roles.ts) |
| Response | [`RoleCreateResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  name: 'x',
});
```

### Update a role without permission escalation

**Required Scopes:** `roles:write`

| Direction | Type |
| --- | --- |
| Request | [`RoleUpdateServerParams`](./src/resources/roles.ts) |
| Response | [`RoleUpdateServerResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.updateServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
});
```

### Delete an unmanaged non-default role

**Required Scopes:** `roles:write`

| Direction | Type |
| --- | --- |
| Request | [`RoleDeleteServerParams`](./src/resources/roles.ts) |
| Response | [`RoleDeleteServerResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.deleteServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
});
```

### Replace the complete role hierarchy as server owner

**Required Scopes:** `roles:write`

| Direction | Type |
| --- | --- |
| Request | [`RoleReorderServerParams`](./src/resources/roles.ts) |
| Response | [`RoleReorderServerResponse`](./src/resources/roles.ts) |

```ts
const role = await client.roles.reorderServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  roleIds: [],
});
```

## `Audit`

### List the permission-protected server audit trail

**Required Scopes:** `servers:read`

| Direction | Type |
| --- | --- |
| Request | [`AuditListServerLogParams`](./src/resources/audit.ts) |
| Response | [`AuditListServerLogResponse`](./src/resources/audit.ts) |

```ts
const audit = await client.audit.listServerLog('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  limit: 50,
});
```

## `DirectMessages`

### List private conversations for the current user

**Required Scopes:** `channels:read`

| Direction | Type |
| --- | --- |
| Response | [`DirectMessageListResponse`](./src/resources/direct-messages.ts) |

```ts
const directMessage = await client.directMessages.list();
```

### Create or return a canonical two-user conversation

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Request | [`DirectMessageCreateParams`](./src/resources/direct-messages.ts) |
| Response | [`DirectMessageCreateResponse`](./src/resources/direct-messages.ts) |

```ts
const directMessage = await client.directMessages.create({
  recipientId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
});
```

## `Files`

### Create a quarantined S3 multipart upload

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Request | [`FileInitiateUploadParams`](./src/resources/files.ts) |
| Response | [`FileInitiateUploadResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.initiateUpload({
  purpose: 'attachment',
  sizeBytes: 0,
});
```

### Sign one multipart upload part

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Request | [`FilePresignUploadPartParams`](./src/resources/files.ts) |
| Response | [`FilePresignUploadPartResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.presignUploadPart('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  partNumber: 0,
});
```

### Complete upload and move the file into quarantine

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Request | [`FileCompleteUploadParams`](./src/resources/files.ts) |
| Response | [`FileCompleteUploadResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.completeUpload('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  parts: [],
});
```

### Abort and remove a pending multipart upload

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Response | [`FileAbortUploadResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.abortUpload('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Return authorized file metadata and processing state

**Required Scopes:** `messages:read`

| Direction | Type |
| --- | --- |
| Response | [`FileRetrieveResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Create a short authorized download URL

**Required Scopes:** `messages:read`

| Direction | Type |
| --- | --- |
| Request | [`FileDownloadParams`](./src/resources/files.ts) |
| Response | [`FileDownloadResponse`](./src/resources/files.ts) |

```ts
const file = await client.files.download('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

## `Members`

### List active server members using cursor pagination

**Required Scopes:** `members:read`

| Direction | Type |
| --- | --- |
| Request | [`MemberListServerParams`](./src/resources/members.ts) |
| Response | [`MemberListServerResponse`](./src/resources/members.ts) |

```ts
const member = await client.members.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  limit: 50,
});
```

### Leave a server after transferring ownership if necessary

**Required Scopes:** `servers:read`

| Direction | Type |
| --- | --- |
| Response | [`MemberLeaveServerResponse`](./src/resources/members.ts) |

```ts
const member = await client.members.leaveServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Replace member roles without permission escalation

**Required Scopes:** `roles:write`

| Direction | Type |
| --- | --- |
| Request | [`MemberReplaceRolesParams`](./src/resources/members.ts) |
| Response | [`MemberReplaceRolesResponse`](./src/resources/members.ts) |

```ts
const member = await client.members.replaceRoles('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  roleIds: [],
});
```

## `Moderation`

### Kick a lower-permission member and record the action

**Required Scopes:** `members:write`

| Direction | Type |
| --- | --- |
| Request | [`ModerationKickServerMemberParams`](./src/resources/moderation.ts) |
| Response | [`ModerationKickServerMemberResponse`](./src/resources/moderation.ts) |

```ts
const moderation = await client.moderation.kickServerMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
});
```

### Clear an active or stale server timeout

**Required Scopes:** `members:write`

| Direction | Type |
| --- | --- |
| Request | [`ModerationClearMemberTimeoutParams`](./src/resources/moderation.ts) |
| Response | [`ModerationClearMemberTimeoutResponse`](./src/resources/moderation.ts) |

```ts
const moderation = await client.moderation.clearMemberTimeout('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
});
```

### Apply a server timeout with a moderation case

**Required Scopes:** `members:write`

| Direction | Type |
| --- | --- |
| Request | [`ModerationTimeoutMemberParams`](./src/resources/moderation.ts) |
| Response | [`ModerationTimeoutMemberResponse`](./src/resources/moderation.ts) |

```ts
const moderation = await client.moderation.timeoutMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  durationSeconds: 0,
});
```

### Remove a server ban and record the action

**Required Scopes:** `members:write`

| Direction | Type |
| --- | --- |
| Request | [`ModerationUnbanServerMemberParams`](./src/resources/moderation.ts) |
| Response | [`ModerationUnbanServerMemberResponse`](./src/resources/moderation.ts) |

```ts
const moderation = await client.moderation.unbanServerMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
});
```

### Ban a member atomically and write the audit trail

**Required Scopes:** `members:write`

| Direction | Type |
| --- | --- |
| Request | [`ModerationBanMemberParams`](./src/resources/moderation.ts) |
| Response | [`ModerationBanMemberResponse`](./src/resources/moderation.ts) |

```ts
const moderation = await client.moderation.banMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
});
```

## `Messages`

### Read channel history using keyset pagination

**Required Scopes:** `messages:read`

| Direction | Type |
| --- | --- |
| Request | [`MessageListParams`](./src/resources/messages.ts) |
| Response | [`MessageListResponse`](./src/resources/messages.ts) |

```ts
const message = await client.messages.list('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Send an idempotent message

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Request | [`MessageCreateParams`](./src/resources/messages.ts) |
| Response | [`MessageCreateResponse`](./src/resources/messages.ts) |

```ts
const message = await client.messages.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  clientNonce: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  envelope: {
    authenticationTag: 'xxxxxxxxxxxxxxxx',
    ciphertext: 'x',
    contentType: 'x',
    epoch: 0,
    nonce: 'xxxxxxxxxxxxxxxx',
    protocolVersion: 1,
    senderDeviceId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  },
});
```

### Edit a message and retain its moderation history

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Request | [`MessageUpdateParams`](./src/resources/messages.ts) |
| Response | [`MessageUpdateResponse`](./src/resources/messages.ts) |

```ts
const message = await client.messages.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  envelope: {
    authenticationTag: 'xxxxxxxxxxxxxxxx',
    ciphertext: 'x',
    contentType: 'x',
    epoch: 0,
    nonce: 'xxxxxxxxxxxxxxxx',
    protocolVersion: 1,
    senderDeviceId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  },
});
```

### Replace a message with a stable tombstone

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Response | [`MessageDeleteResponse`](./src/resources/messages.ts) |

```ts
const message = await client.messages.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```

### Add an idempotent reaction to a message

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Request | [`MessageCreateReactionParams`](./src/resources/messages.ts) |
| Response | [`MessageCreateReactionResponse`](./src/resources/messages.ts) |

```ts
const message = await client.messages.createReaction('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  emojiKey: 'x',
});
```

### Remove the current user reaction

**Required Scopes:** `messages:write`

| Direction | Type |
| --- | --- |
| Request | [`MessageDeleteReactionParams`](./src/resources/messages.ts) |
| Response | [`MessageDeleteReactionResponse`](./src/resources/messages.ts) |

```ts
const message = await client.messages.deleteReaction('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
  emojiKey: 'x',
});
```

## `Search`

### Search only messages visible to the current user

**Required Scopes:** `messages:read`

| Direction | Type |
| --- | --- |
| Request | [`SearchMessagesParams`](./src/resources/search.ts) |
| Response | [`SearchMessagesResponse`](./src/resources/search.ts) |

```ts
const search = await client.search.messages({
  q: 'q',
});
```

### Search public and joined communities

**Required Scopes:** `servers:read`

| Direction | Type |
| --- | --- |
| Request | [`SearchServersParams`](./src/resources/search.ts) |
| Response | [`SearchServersResponse`](./src/resources/search.ts) |

```ts
const search = await client.search.servers({
  q: 'q',
});
```

## `Voice`

### Issue a short-lived LiveKit token after permission checks

**Required Scopes:** `channels:read`

| Direction | Type |
| --- | --- |
| Response | [`VoiceCreateTokenResponse`](./src/resources/voice.ts) |

```ts
const voice = await client.voice.createToken('7c9e6679-7425-40de-944b-e07fc1f90ae7');
```
