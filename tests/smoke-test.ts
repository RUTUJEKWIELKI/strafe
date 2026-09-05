// File generated from our OpenAPI spec by Scalar. See README.md for details.

// Smoke test: calls every generated operation once to confirm the SDK can reach each endpoint.
// Run it from this repo with `bun tests/smoke-test.ts`. Each case below calls one SDK method
// exactly the way the SDK exposes it (positional params, request body, pagination, streaming).
//
// Two environment variables tune a run:
//   - SCALAR_SMOKE_FILTER: comma-separated needles; only operations whose name or path contains
//     one of them run, so you can smoke-test a subset without editing this file.
//   - SCALAR_SMOKE_REPORT: a file path; when set, the run writes a JSON report there instead of
//     printing a table. The generator uses this to collect per-operation results.
import { writeFileSync } from 'node:fs';

// The package exports the client class. The client reads auth and the base URL from the
// environment, so it needs no constructor options to point at a server.
import StrafeBotAPI from '@strafe/strafe-bot-api';

// One shared client runs every case.
const client = new StrafeBotAPI();

// The result of running one case, collected for the JSON report or the printed table.
type SmokeResult = {
  operation: string;
  method: string;
  path: string;
  label?: string;
  status: 'passed' | 'failed';
  durationMs: number;
  error?: string;
};

// One or two entries per generated operation: the first passes only the arguments the method
// requires, the second also fills every optional parameter and body property. `label` says which
// is which, and is absent when the operation has no optional argument and so has only one case.
// `run` performs the real SDK call; the other fields are metadata used for filtering and
// reporting. This list is generated, so it stays in sync with the SDK surface.
const cases: {
  operation: string;
  method: string;
  path: string;
  label?: string;
  run: () => Promise<unknown>;
}[] = [
  {
    operation: 'listCurrent',
    method: 'GET',
    path: '/api/users/@me',
    run: async () => {
      const user = await client.users.listCurrent();
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/users/@me',
    label: 'required params',
    run: async () => {
      await client.users.update({});
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/users/@me',
    label: 'all params',
    run: async () => {
      await client.users.update({
        displayName: 'x',
        bio: '',
        pronouns: '',
        avatarFileId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        bannerFileId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/api/users/{userId}',
    run: async () => {
      const user = await client.users.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/servers/{serverId}',
    label: 'required params',
    run: async () => {
      const server = await client.servers.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {});
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/servers/{serverId}',
    label: 'all params',
    run: async () => {
      const server = await client.servers.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        description: '',
        name: 'x',
        visibility: 'private',
      });
    },
  },

  {
    operation: 'delete',
    method: 'DELETE',
    path: '/api/servers/{serverId}',
    run: async () => {
      const server = await client.servers.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/api/servers/{serverId}',
    run: async () => {
      const server = await client.servers.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'transferOwnership',
    method: 'POST',
    path: '/api/servers/{serverId}/transfer-ownership',
    run: async () => {
      const server = await client.servers.transferOwnership('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        newOwnerId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'listCurrentUser',
    method: 'GET',
    path: '/api/users/@me/servers',
    run: async () => {
      const server = await client.servers.listCurrentUser();
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/channels/{channelId}',
    label: 'required params',
    run: async () => {
      const channel = await client.channels.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {});
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/channels/{channelId}',
    label: 'all params',
    run: async () => {
      const channel = await client.channels.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        name: 'x',
        parentId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        slowmodeSeconds: 0,
        topic: '',
      });
    },
  },

  {
    operation: 'delete',
    method: 'DELETE',
    path: '/api/channels/{channelId}',
    run: async () => {
      const channel = await client.channels.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'reorderServer',
    method: 'PUT',
    path: '/api/servers/{serverId}/channels/order',
    run: async () => {
      const channel = await client.channels.reorderServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        items: [],
      });
    },
  },

  {
    operation: 'listServer',
    method: 'GET',
    path: '/api/servers/{serverId}/channels',
    run: async () => {
      const channel = await client.channels.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/servers/{serverId}/channels',
    label: 'required params',
    run: async () => {
      const channel = await client.channels.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        name: 'x',
        type: 'category',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/servers/{serverId}/channels',
    label: 'all params',
    run: async () => {
      const channel = await client.channels.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        encrypted: false,
        name: 'x',
        parentId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        slowmodeSeconds: 0,
        topic: '',
        type: 'category',
      });
    },
  },

  {
    operation: 'listChannelOverwrites',
    method: 'GET',
    path: '/api/channels/{channelId}/permission-overwrites',
    run: async () => {
      const permission = await client.permissions.listChannelOverwrites(
        '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      );
    },
  },

  {
    operation: 'upsertChannelOverwrite',
    method: 'PUT',
    path: '/api/channels/{channelId}/permission-overwrites/{subjectType}/{subjectId}',
    run: async () => {
      const permission = await client.permissions.upsertChannelOverwrite(
        '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        {
          channelId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
          subjectType: 'role',
          allowBits: '',
          denyBits: '',
        },
      );
    },
  },

  {
    operation: 'deleteChannelOverwrite',
    method: 'DELETE',
    path: '/api/channels/{channelId}/permission-overwrites/{subjectType}/{subjectId}',
    run: async () => {
      const permission = await client.permissions.deleteChannelOverwrite(
        '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        {
          channelId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
          subjectType: 'role',
        },
      );
    },
  },

  {
    operation: 'listServer',
    method: 'GET',
    path: '/api/servers/{serverId}/roles',
    run: async () => {
      const role = await client.roles.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/servers/{serverId}/roles',
    label: 'required params',
    run: async () => {
      const role = await client.roles.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        name: 'x',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/servers/{serverId}/roles',
    label: 'all params',
    run: async () => {
      const role = await client.roles.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        color: '',
        name: 'x',
        permissions: '',
      });
    },
  },

  {
    operation: 'updateServer',
    method: 'PATCH',
    path: '/api/servers/{serverId}/roles/{roleId}',
    label: 'required params',
    run: async () => {
      const role = await client.roles.updateServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'updateServer',
    method: 'PATCH',
    path: '/api/servers/{serverId}/roles/{roleId}',
    label: 'all params',
    run: async () => {
      const role = await client.roles.updateServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        color: '',
        name: 'x',
        permissions: '',
      });
    },
  },

  {
    operation: 'deleteServer',
    method: 'DELETE',
    path: '/api/servers/{serverId}/roles/{roleId}',
    run: async () => {
      const role = await client.roles.deleteServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'reorderServer',
    method: 'PUT',
    path: '/api/servers/{serverId}/roles/order',
    run: async () => {
      const role = await client.roles.reorderServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        roleIds: [],
      });
    },
  },

  {
    operation: 'listServerLog',
    method: 'GET',
    path: '/api/servers/{serverId}/audit-log',
    label: 'required params',
    run: async () => {
      const audit = await client.audit.listServerLog('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        limit: 50,
      });
    },
  },

  {
    operation: 'listServerLog',
    method: 'GET',
    path: '/api/servers/{serverId}/audit-log',
    label: 'all params',
    run: async () => {
      const audit = await client.audit.listServerLog('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        before: 'before',
        limit: 50,
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/users/@me/dms',
    run: async () => {
      const directMessage = await client.directMessages.list();
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/users/@me/dms',
    run: async () => {
      const directMessage = await client.directMessages.create({
        recipientId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'initiateUpload',
    method: 'POST',
    path: '/api/files/uploads',
    label: 'required params',
    run: async () => {
      const file = await client.files.initiateUpload({
        purpose: 'attachment',
        sizeBytes: 0,
      });
    },
  },

  {
    operation: 'initiateUpload',
    method: 'POST',
    path: '/api/files/uploads',
    label: 'all params',
    run: async () => {
      const file = await client.files.initiateUpload({
        chunkSizeBytes: 0,
        encryptionMode: 'e2ee-v1',
        mimeType: 'x',
        originalName: 'x',
        purpose: 'attachment',
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        sizeBytes: 0,
      });
    },
  },

  {
    operation: 'presignUploadPart',
    method: 'POST',
    path: '/api/files/uploads/{uploadId}/parts',
    run: async () => {
      const file = await client.files.presignUploadPart('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        partNumber: 0,
      });
    },
  },

  {
    operation: 'completeUpload',
    method: 'POST',
    path: '/api/files/uploads/{uploadId}/complete',
    run: async () => {
      const file = await client.files.completeUpload('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        parts: [],
      });
    },
  },

  {
    operation: 'abortUpload',
    method: 'DELETE',
    path: '/api/files/uploads/{uploadId}',
    run: async () => {
      const file = await client.files.abortUpload('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/api/files/{fileId}',
    run: async () => {
      const file = await client.files.retrieve('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'download',
    method: 'GET',
    path: '/api/files/{fileId}/download',
    label: 'required params',
    run: async () => {
      const file = await client.files.download('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'download',
    method: 'GET',
    path: '/api/files/{fileId}/download',
    label: 'all params',
    run: async () => {
      const file = await client.files.download('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        variant: 'variant',
      });
    },
  },

  {
    operation: 'listServer',
    method: 'GET',
    path: '/api/servers/{serverId}/members',
    label: 'required params',
    run: async () => {
      const member = await client.members.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        limit: 50,
      });
    },
  },

  {
    operation: 'listServer',
    method: 'GET',
    path: '/api/servers/{serverId}/members',
    label: 'all params',
    run: async () => {
      const member = await client.members.listServer('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        before: 'before',
        limit: 50,
      });
    },
  },

  {
    operation: 'leaveServer',
    method: 'DELETE',
    path: '/api/servers/{serverId}/members/@me',
    run: async () => {
      const member = await client.members.leaveServer('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'replaceRoles',
    method: 'PUT',
    path: '/api/servers/{serverId}/members/{userId}/roles',
    run: async () => {
      const member = await client.members.replaceRoles('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        roleIds: [],
      });
    },
  },

  {
    operation: 'kickServerMember',
    method: 'POST',
    path: '/api/servers/{serverId}/members/{userId}/kick',
    label: 'required params',
    run: async () => {
      const moderation = await client.moderation.kickServerMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'kickServerMember',
    method: 'POST',
    path: '/api/servers/{serverId}/members/{userId}/kick',
    label: 'all params',
    run: async () => {
      const moderation = await client.moderation.kickServerMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        reason: '',
      });
    },
  },

  {
    operation: 'clearMemberTimeout',
    method: 'DELETE',
    path: '/api/servers/{serverId}/members/{userId}/timeout',
    run: async () => {
      const moderation = await client.moderation.clearMemberTimeout('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'timeoutMember',
    method: 'POST',
    path: '/api/servers/{serverId}/members/{userId}/timeout',
    label: 'required params',
    run: async () => {
      const moderation = await client.moderation.timeoutMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        durationSeconds: 0,
      });
    },
  },

  {
    operation: 'timeoutMember',
    method: 'POST',
    path: '/api/servers/{serverId}/members/{userId}/timeout',
    label: 'all params',
    run: async () => {
      const moderation = await client.moderation.timeoutMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        durationSeconds: 0,
        reason: '',
      });
    },
  },

  {
    operation: 'unbanServerMember',
    method: 'DELETE',
    path: '/api/servers/{serverId}/bans/{userId}',
    run: async () => {
      const moderation = await client.moderation.unbanServerMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'banMember',
    method: 'POST',
    path: '/api/servers/{serverId}/members/{userId}/ban',
    label: 'required params',
    run: async () => {
      const moderation = await client.moderation.banMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'banMember',
    method: 'POST',
    path: '/api/servers/{serverId}/members/{userId}/ban',
    label: 'all params',
    run: async () => {
      const moderation = await client.moderation.banMember('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        expiresInSeconds: 0,
        reason: '',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/channels/{channelId}/messages',
    label: 'required params',
    run: async () => {
      const message = await client.messages.list('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/api/channels/{channelId}/messages',
    label: 'all params',
    run: async () => {
      const message = await client.messages.list('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        before: 'before',
        limit: 1,
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/channels/{channelId}/messages',
    label: 'required params',
    run: async () => {
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
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/api/channels/{channelId}/messages',
    label: 'all params',
    run: async () => {
      const message = await client.messages.create('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        attachmentIds: [],
        attachmentEnvelopes: {},
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
        replyToMessageId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/api/messages/{messageId}',
    run: async () => {
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
    },
  },

  {
    operation: 'delete',
    method: 'DELETE',
    path: '/api/messages/{messageId}',
    run: async () => {
      const message = await client.messages.delete('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },

  {
    operation: 'createReaction',
    method: 'PUT',
    path: '/api/messages/{messageId}/reactions',
    run: async () => {
      const message = await client.messages.createReaction('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        emojiKey: 'x',
      });
    },
  },

  {
    operation: 'deleteReaction',
    method: 'DELETE',
    path: '/api/messages/{messageId}/reactions',
    run: async () => {
      const message = await client.messages.deleteReaction('7c9e6679-7425-40de-944b-e07fc1f90ae7', {
        emojiKey: 'x',
      });
    },
  },

  {
    operation: 'messages',
    method: 'GET',
    path: '/api/search/messages',
    label: 'required params',
    run: async () => {
      const search = await client.search.messages({
        q: 'q',
      });
    },
  },

  {
    operation: 'messages',
    method: 'GET',
    path: '/api/search/messages',
    label: 'all params',
    run: async () => {
      const search = await client.search.messages({
        channelId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        limit: 1,
        offset: 1,
        q: 'q',
        serverId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    },
  },

  {
    operation: 'servers',
    method: 'GET',
    path: '/api/search/servers',
    label: 'required params',
    run: async () => {
      const search = await client.search.servers({
        q: 'q',
      });
    },
  },

  {
    operation: 'servers',
    method: 'GET',
    path: '/api/search/servers',
    label: 'all params',
    run: async () => {
      const search = await client.search.servers({
        limit: 1,
        offset: 1,
        q: 'q',
      });
    },
  },

  {
    operation: 'createToken',
    method: 'POST',
    path: '/api/channels/{channelId}/voice/token',
    run: async () => {
      const voice = await client.voice.createToken('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    },
  },
];

const main = async (): Promise<void> => {
  // SCALAR_SMOKE_FILTER (comma-separated) keeps only cases whose operation name or path matches
  // one of the needles, so a caller can smoke-test a subset. With no filter, every case runs.
  const filter = process.env['SCALAR_SMOKE_FILTER'];
  const needles = filter
    ? filter
        .split(',')
        .map((needle) => needle.trim())
        .filter(Boolean)
    : [];
  const selected =
    needles.length > 0
      ? cases.filter((testCase) =>
          needles.some((needle) => testCase.operation.includes(needle) || testCase.path.includes(needle)),
        )
      : cases;

  // Run every selected case concurrently. Promise.allSettled means one failing operation never
  // blocks the others, so a single run reports the status of every endpoint.
  const settled = await Promise.allSettled(
    selected.map(async (testCase): Promise<SmokeResult> => {
      const startedAt = Date.now();
      // `label` distinguishes the required-params run from the all-params run of the same
      // operation; it is omitted entirely when the operation contributed only one case.
      const identity = {
        operation: testCase.operation,
        method: testCase.method,
        path: testCase.path,
        ...(testCase.label ? { label: testCase.label } : {}),
      };
      try {
        await testCase.run();
        return { ...identity, status: 'passed', durationMs: Date.now() - startedAt };
      } catch (error) {
        // Prefer the stack so a failure points at the failing SDK call; fall back to the message.
        const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
        return { ...identity, status: 'failed', durationMs: Date.now() - startedAt, error: message };
      }
    }),
  );

  // allSettled never rejects, but defensively map any rejected slot to a failed result.
  const results: SmokeResult[] = settled.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : {
          operation: 'unknown',
          method: '',
          path: '',
          status: 'failed',
          durationMs: 0,
          error: String(result.reason),
        },
  );
  const failed = results.filter((result) => result.status === 'failed');

  // With SCALAR_SMOKE_REPORT set, write a machine-readable report; otherwise print a table.
  const reportPath = process.env['SCALAR_SMOKE_REPORT'];
  if (reportPath) {
    writeFileSync(reportPath, JSON.stringify({ total: results.length, failed: failed.length, results }));
  } else {
    for (const result of results) {
      const suffix = result.label ? ` [${result.label}]` : '';
      if (result.status === 'passed')
        console.log(
          `\u2714 ${result.operation}${suffix} (${result.method} ${result.path}) ${result.durationMs}ms`,
        );
      else
        console.error(
          `\u2718 ${result.operation}${suffix} (${result.method} ${result.path})\n${result.error ?? ''}`,
        );
    }
    if (results.length === 0) {
      console.error('No code samples ran (empty SDK or a SCALAR_SMOKE_FILTER that matched nothing).');
    } else {
      console.log(`\n${results.length - failed.length}/${results.length} samples passed`);
    }
  }

  // An empty run (no operations, or a filter that matched nothing) is a failure, not a vacuous pass.
  if (failed.length > 0 || results.length === 0) process.exitCode = 1;
};

void main();
