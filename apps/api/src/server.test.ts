import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildServer } from '../dist/server.js'

let server: Awaited<ReturnType<typeof buildServer>>

beforeAll(async () => {
  server = await buildServer({ logger: false })
}, 30_000)

afterAll(async () => {
  await server.close()
})

describe('API server', () => {
  it('loads routes automatically', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      status: 'ok',
    })
    expect(['available', 'disabled']).toContain(
      response.json().services.database,
    )
    expect(['available', 'disabled']).toContain(response.json().services.redis)
  })

  it('returns a consistent response for unknown routes', async () => {
    const response = await server.inject({ method: 'GET', url: '/missing' })

    expect(response.statusCode).toBe(404)
    expect(response.headers['x-request-id']).toBeDefined()
    expect(response.json()).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        requestId: response.headers['x-request-id'],
      },
    })
  })

  it('reports readiness without requiring optional local dependencies', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/health/ready',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      status: 'ok',
    })
    expect(['available', 'disabled']).toContain(
      response.json().services.database,
    )
    expect(['available', 'disabled']).toContain(response.json().services.redis)
  })

  it('documents Strafe token authentication for protected routes', () => {
    const specification = server.swagger() as {
      components?: { securitySchemes?: Record<string, unknown> }
      paths?: Record<
        string,
        Record<string, { security?: Array<Record<string, unknown>> }>
      >
    }

    expect(
      specification.components?.securitySchemes?.StrafeToken,
    ).toMatchObject({
      bearerFormat: 'JWT or Strafe bot token',
      scheme: 'bearer',
      type: 'http',
    })
    expect(specification.paths?.['/api/users/@me']?.get?.security).toEqual([
      { StrafeToken: [] },
    ])
    expect(
      specification.paths?.['/api/auth/login']?.post?.security,
    ).toBeUndefined()
  })

  it('publishes the complete community management API', () => {
    const specification = server.swagger() as {
      paths?: Record<
        string,
        Record<
          string,
          {
            operationId?: string
            security?: Array<Record<string, unknown>>
          }
        >
      >
    }
    const expectedOperations = [
      ['/api/servers/{serverId}', 'patch', 'updateServer'],
      [
        '/api/servers/{serverId}/transfer-ownership',
        'post',
        'transferServerOwnership',
      ],
      ['/api/servers/{serverId}/members', 'get', 'listServerMembers'],
      [
        '/api/servers/{serverId}/channels/order',
        'put',
        'reorderServerChannels',
      ],
      [
        '/api/channels/{channelId}/permission-overwrites/{subjectType}/{subjectId}',
        'put',
        'upsertChannelPermissionOverwrite',
      ],
      ['/api/servers/{serverId}/roles/order', 'put', 'reorderServerRoles'],
      ['/api/servers/{serverId}/audit-log', 'get', 'listServerAuditLog'],
    ] as const

    for (const [path, method, operationId] of expectedOperations) {
      const operation = specification.paths?.[path]?.[method]
      expect(operation?.operationId).toBe(operationId)
      expect(operation?.security).toEqual([{ StrafeToken: [] }])
    }
  })

  it('publishes the platform hardening API', () => {
    const specification = server.swagger() as {
      paths?: Record<
        string,
        Record<
          string,
          {
            operationId?: string
            security?: Array<Record<string, unknown>>
          }
        >
      >
    }
    const protectedOperations = [
      ['/api/users/@me/sessions', 'get', 'listCurrentUserSessions'],
      ['/api/users/@me/password', 'post', 'changeCurrentUserPassword'],
      ['/api/files/uploads', 'post', 'initiateFileUpload'],
      ['/api/reports', 'post', 'createReport'],
      ['/api/servers/{serverId}/automod/rules', 'post', 'createAutomodRule'],
      ['/api/search/messages', 'get', 'searchMessages'],
      [
        '/api/users/@me/notification-preferences',
        'put',
        'upsertNotificationPreference',
      ],
      ['/api/users/@me/push-subscriptions', 'post', 'createPushSubscription'],
    ] as const
    for (const [path, method, operationId] of protectedOperations) {
      const operation = specification.paths?.[path]?.[method]
      expect(operation?.operationId).toBe(operationId)
      expect(operation?.security).toEqual([{ StrafeToken: [] }])
    }

    expect(
      specification.paths?.['/api/auth/password/reset/request']?.post
        ?.operationId,
    ).toBe('requestPasswordReset')
    expect(
      specification.paths?.['/api/auth/password/reset/request']?.post?.security,
    ).toBeUndefined()
  })
})
