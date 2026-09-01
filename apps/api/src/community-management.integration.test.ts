import { v7 as uuidv7 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { Permission } from '../dist/lib/permissions.js'
import { buildServer } from '../dist/server.js'

const databaseUrl = process.env.TEST_DATABASE_URL

describe.skipIf(!databaseUrl)('community management integration', () => {
  it('manages the full server lifecycle without allowing permission escalation', async () => {
    process.env.DATABASE_URL = databaseUrl
    process.env.AUTH_JWT_SECRET =
      process.env.AUTH_JWT_SECRET ?? 'integration-test-secret-at-least-32-chars'
    process.env.OUTBOX_ENABLED = 'false'
    process.env.REALTIME_ENABLED = 'true'

    const app = await buildServer({ logger: false })
    const suffix = uuidv7().replaceAll('-', '').slice(-12)
    const createdUserIds: string[] = []
    let createdServerId: string | null = null

    const register = async (label: string) => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          displayName: label,
          email: `${label.toLowerCase()}-${suffix}@example.test`,
          handle: `${label.toLowerCase()}_${suffix}`,
          password: 'correct horse battery staple',
        },
        url: '/api/auth/register',
      })
      expect(response.statusCode, response.body).toBe(201)
      const body = response.json()
      createdUserIds.push(body.user.id as string)
      return {
        id: body.user.id as string,
        token: body.tokens.accessToken as string,
      }
    }
    const auth = (token: string) => ({ authorization: `Bearer ${token}` })

    try {
      const owner = await register('Owner')
      const manager = await register('Manager')
      const target = await register('Target')

      const createdServer = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: { name: 'Managed Community' },
        url: '/api/servers',
      })
      expect(createdServer.statusCode, createdServer.body).toBe(201)
      const community = createdServer.json()
      createdServerId = community.server.id as string
      const serverId = createdServerId
      const defaultChannelId = community.defaultChannelId as string

      const updatedServer = await app.inject({
        headers: auth(owner.token),
        method: 'PATCH',
        payload: {
          description: 'Fully managed by the integration API',
          visibility: 'unlisted',
        },
        url: `/api/servers/${serverId}`,
      })
      expect(updatedServer.statusCode, updatedServer.body).toBe(200)
      expect(updatedServer.json()).toMatchObject({ visibility: 'unlisted' })

      const inviteResponse = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: { maxUses: 3 },
        url: `/api/servers/${serverId}/invites`,
      })
      expect(inviteResponse.statusCode, inviteResponse.body).toBe(201)
      const inviteCode = inviteResponse.json().code as string

      for (const member of [manager, target]) {
        const joined = await app.inject({
          headers: auth(member.token),
          method: 'POST',
          url: `/api/invites/${inviteCode}/join`,
        })
        expect(joined.statusCode, joined.body).toBe(200)
      }

      const firstMemberPage = await app.inject({
        headers: auth(owner.token),
        method: 'GET',
        url: `/api/servers/${serverId}/members?limit=2`,
      })
      expect(firstMemberPage.statusCode, firstMemberPage.body).toBe(200)
      expect(firstMemberPage.json().members).toHaveLength(2)
      expect(firstMemberPage.json().nextCursor).toEqual(expect.any(String))
      const secondMemberPage = await app.inject({
        headers: auth(owner.token),
        method: 'GET',
        url: `/api/servers/${serverId}/members?limit=2&before=${encodeURIComponent(
          firstMemberPage.json().nextCursor as string,
        )}`,
      })
      expect(secondMemberPage.statusCode, secondMemberPage.body).toBe(200)
      expect(secondMemberPage.json().members).toHaveLength(1)

      const managerPermissions = (
        Permission.ViewChannel |
        Permission.ManageChannels |
        Permission.ManageRoles |
        Permission.ViewAuditLog
      ).toString()
      const managerRoleResponse = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: { name: 'Community Manager', permissions: managerPermissions },
        url: `/api/servers/${serverId}/roles`,
      })
      expect(managerRoleResponse.statusCode, managerRoleResponse.body).toBe(201)
      const managerRoleId = managerRoleResponse.json().id as string

      const privilegedRoleResponse = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: {
          name: 'Privileged',
          permissions: (
            Permission.ViewChannel | Permission.ManageServer
          ).toString(),
        },
        url: `/api/servers/${serverId}/roles`,
      })
      expect(
        privilegedRoleResponse.statusCode,
        privilegedRoleResponse.body,
      ).toBe(201)
      const privilegedRoleId = privilegedRoleResponse.json().id as string

      const assignedManagerRole = await app.inject({
        headers: auth(owner.token),
        method: 'PUT',
        payload: { roleIds: [managerRoleId] },
        url: `/api/servers/${serverId}/members/${manager.id}/roles`,
      })
      expect(assignedManagerRole.statusCode, assignedManagerRole.body).toBe(200)

      const escalatedAssignment = await app.inject({
        headers: auth(manager.token),
        method: 'PUT',
        payload: { roleIds: [privilegedRoleId] },
        url: `/api/servers/${serverId}/members/${target.id}/roles`,
      })
      expect(escalatedAssignment.statusCode, escalatedAssignment.body).toBe(403)

      const escalatedRole = await app.inject({
        headers: auth(manager.token),
        method: 'PATCH',
        payload: { permissions: Permission.Administrator.toString() },
        url: `/api/servers/${serverId}/roles/${managerRoleId}`,
      })
      expect(escalatedRole.statusCode, escalatedRole.body).toBe(403)

      const escalatedOverwrite = await app.inject({
        headers: auth(manager.token),
        method: 'PUT',
        payload: {
          allowBits: Permission.Administrator.toString(),
          denyBits: '0',
        },
        url: `/api/channels/${defaultChannelId}/permission-overwrites/role/${managerRoleId}`,
      })
      expect(escalatedOverwrite.statusCode, escalatedOverwrite.body).toBe(403)

      const overwriteResponse = await app.inject({
        headers: auth(owner.token),
        method: 'PUT',
        payload: {
          allowBits: Permission.ManageMessages.toString(),
          denyBits: Permission.SendMessages.toString(),
        },
        url: `/api/channels/${defaultChannelId}/permission-overwrites/role/${managerRoleId}`,
      })
      expect(overwriteResponse.statusCode, overwriteResponse.body).toBe(200)
      const overwriteList = await app.inject({
        headers: auth(owner.token),
        method: 'GET',
        url: `/api/channels/${defaultChannelId}/permission-overwrites`,
      })
      expect(overwriteList.statusCode, overwriteList.body).toBe(200)
      expect(overwriteList.json().overwrites).toHaveLength(1)
      const removedOverwrite = await app.inject({
        headers: auth(owner.token),
        method: 'DELETE',
        url: `/api/channels/${defaultChannelId}/permission-overwrites/role/${managerRoleId}`,
      })
      expect(removedOverwrite.statusCode, removedOverwrite.body).toBe(200)
      expect(removedOverwrite.json()).toMatchObject({ removed: true })

      const categoryResponse = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: { name: 'Projects', type: 'category' },
        url: `/api/servers/${serverId}/channels`,
      })
      expect(categoryResponse.statusCode, categoryResponse.body).toBe(201)
      const categoryId = categoryResponse.json().id as string
      const channelResponse = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: {
          name: 'roadmap',
          parentId: categoryId,
          topic: 'Planning',
          type: 'text',
        },
        url: `/api/servers/${serverId}/channels`,
      })
      expect(channelResponse.statusCode, channelResponse.body).toBe(201)
      const managedChannelId = channelResponse.json().id as string
      const updatedChannel = await app.inject({
        headers: auth(owner.token),
        method: 'PATCH',
        payload: { name: 'product-roadmap', slowmodeSeconds: 5 },
        url: `/api/channels/${managedChannelId}`,
      })
      expect(updatedChannel.statusCode, updatedChannel.body).toBe(200)
      expect(updatedChannel.json()).toMatchObject({
        name: 'product-roadmap',
        slowmodeSeconds: 5,
      })

      const channelsResponse = await app.inject({
        headers: auth(owner.token),
        method: 'GET',
        url: `/api/servers/${serverId}/channels`,
      })
      expect(channelsResponse.statusCode, channelsResponse.body).toBe(200)
      const channelItems = (
        channelsResponse.json().channels as Array<{
          id: string
          parentId: string | null
        }>
      ).map((channel) => ({
        channelId: channel.id,
        parentId: channel.parentId,
      }))
      const reorderedChannels = await app.inject({
        headers: auth(owner.token),
        method: 'PUT',
        payload: { items: channelItems.reverse() },
        url: `/api/servers/${serverId}/channels/order`,
      })
      expect(reorderedChannels.statusCode, reorderedChannels.body).toBe(200)
      expect(reorderedChannels.json().channels).toHaveLength(
        channelItems.length,
      )

      const deletedCategory = await app.inject({
        headers: auth(owner.token),
        method: 'DELETE',
        url: `/api/channels/${categoryId}`,
      })
      expect(deletedCategory.statusCode, deletedCategory.body).toBe(200)
      const channelsAfterCategoryDelete = await app.inject({
        headers: auth(owner.token),
        method: 'GET',
        url: `/api/servers/${serverId}/channels`,
      })
      expect(
        (
          channelsAfterCategoryDelete.json().channels as Array<{
            id: string
            parentId: string | null
          }>
        ).find((channel) => channel.id === managedChannelId)?.parentId,
      ).toBeNull()

      const rolesResponse = await app.inject({
        headers: auth(owner.token),
        method: 'GET',
        url: `/api/servers/${serverId}/roles`,
      })
      expect(rolesResponse.statusCode, rolesResponse.body).toBe(200)
      const nonDefaultRoleIds = (
        rolesResponse.json().roles as Array<{ id: string; isDefault: boolean }>
      )
        .filter((role) => !role.isDefault)
        .map((role) => role.id)
      const forbiddenRoleReorder = await app.inject({
        headers: auth(manager.token),
        method: 'PUT',
        payload: { roleIds: nonDefaultRoleIds },
        url: `/api/servers/${serverId}/roles/order`,
      })
      expect(forbiddenRoleReorder.statusCode, forbiddenRoleReorder.body).toBe(
        403,
      )
      const reorderedRoles = await app.inject({
        headers: auth(owner.token),
        method: 'PUT',
        payload: { roleIds: nonDefaultRoleIds.reverse() },
        url: `/api/servers/${serverId}/roles/order`,
      })
      expect(reorderedRoles.statusCode, reorderedRoles.body).toBe(200)

      const updatedRole = await app.inject({
        headers: auth(owner.token),
        method: 'PATCH',
        payload: { color: '#3366FF', name: 'Lead Manager' },
        url: `/api/servers/${serverId}/roles/${managerRoleId}`,
      })
      expect(updatedRole.statusCode, updatedRole.body).toBe(200)
      const deletedRole = await app.inject({
        headers: auth(owner.token),
        method: 'DELETE',
        url: `/api/servers/${serverId}/roles/${privilegedRoleId}`,
      })
      expect(deletedRole.statusCode, deletedRole.body).toBe(200)

      const timeout = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: { durationSeconds: 60 },
        url: `/api/servers/${serverId}/members/${target.id}/timeout`,
      })
      expect(timeout.statusCode, timeout.body).toBe(200)
      const clearedTimeout = await app.inject({
        headers: auth(owner.token),
        method: 'DELETE',
        url: `/api/servers/${serverId}/members/${target.id}/timeout`,
      })
      expect(clearedTimeout.statusCode, clearedTimeout.body).toBe(200)
      expect(clearedTimeout.json()).toMatchObject({ cleared: true })

      const kicked = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: { reason: 'Lifecycle test' },
        url: `/api/servers/${serverId}/members/${target.id}/kick`,
      })
      expect(kicked.statusCode, kicked.body).toBe(200)
      const rejoined = await app.inject({
        headers: auth(target.token),
        method: 'POST',
        url: `/api/invites/${inviteCode}/join`,
      })
      expect(rejoined.statusCode, rejoined.body).toBe(200)

      const banned = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: { reason: 'Ban lifecycle test' },
        url: `/api/servers/${serverId}/members/${target.id}/ban`,
      })
      expect(banned.statusCode, banned.body).toBe(200)
      const unbanned = await app.inject({
        headers: auth(owner.token),
        method: 'DELETE',
        url: `/api/servers/${serverId}/bans/${target.id}`,
      })
      expect(unbanned.statusCode, unbanned.body).toBe(200)
      expect(unbanned.json()).toMatchObject({ removed: true })

      const transferred = await app.inject({
        headers: auth(owner.token),
        method: 'POST',
        payload: { newOwnerId: manager.id },
        url: `/api/servers/${serverId}/transfer-ownership`,
      })
      expect(transferred.statusCode, transferred.body).toBe(200)
      expect(transferred.json()).toMatchObject({ ownerId: manager.id })

      const auditResponse = await app.inject({
        headers: auth(manager.token),
        method: 'GET',
        url: `/api/servers/${serverId}/audit-log?limit=100`,
      })
      expect(auditResponse.statusCode, auditResponse.body).toBe(200)
      const auditActions = new Set(
        (auditResponse.json().entries as Array<{ action: string }>).map(
          (entry) => entry.action,
        ),
      )
      expect([...auditActions]).toEqual(
        expect.arrayContaining([
          'server.updated',
          'channel.updated',
          'channel.deleted',
          'role.updated',
          'role.deleted',
          'member.kicked',
          'member.unbanned',
          'server.ownership_transferred',
        ]),
      )

      const ownerLeft = await app.inject({
        headers: auth(owner.token),
        method: 'DELETE',
        url: `/api/servers/${serverId}/members/@me`,
      })
      expect(ownerLeft.statusCode, ownerLeft.body).toBe(200)

      const deletedServer = await app.inject({
        headers: auth(manager.token),
        method: 'DELETE',
        url: `/api/servers/${serverId}`,
      })
      expect(deletedServer.statusCode, deletedServer.body).toBe(200)
      expect(deletedServer.json()).toEqual({ deleted: true, serverId })

      const topics = await app.database?.pool.query<{ topic: string }>(
        'select distinct topic from outbox_events where payload::text like $1',
        [`%${serverId}%`],
      )
      expect(topics?.rows.map((row) => row.topic)).toEqual(
        expect.arrayContaining([
          'server.updated',
          'channel.updated',
          'channel.overwrite_updated',
          'role.updated',
          'server.member_kicked',
          'server.member_unbanned',
          'server.ownership_transferred',
          'server.deleted',
        ]),
      )
    } finally {
      if (app.database) {
        const cleanupIds = [
          ...createdUserIds,
          ...(createdServerId ? [createdServerId] : []),
        ]
        if (cleanupIds.length > 0) {
          await app.database.pool.query(
            'delete from outbox_events where payload::text like any($1::text[])',
            [cleanupIds.map((id) => `%${id}%`)],
          )
        }
        if (createdServerId) {
          await app.database.pool.query('delete from servers where id = $1', [
            createdServerId,
          ])
        }
        if (createdUserIds.length > 0) {
          await app.database.pool.query(
            'delete from users where id = any($1::uuid[])',
            [createdUserIds],
          )
        }
      }
      await app.close()
    }
  }, 45_000)
})
