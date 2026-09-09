import { describe, expect, it } from 'vitest'

import { filterBotOpenApi } from './bot-openapi.js'

describe('filterBotOpenApi', () => {
  it('keeps bot-enabled operations and documents their scopes', () => {
    const result = filterBotOpenApi({
      info: { version: '1.2.3' },
      paths: {
        '/bot-route': {
          get: { operationId: 'botRoute', 'x-bot-scopes': ['servers:read'] },
        },
        '/human-route': { post: { operationId: 'humanRoute' } },
      },
    })

    expect(result.paths?.['/human-route']).toBeUndefined()
    expect(result.paths?.['/bot-route']?.get).toMatchObject({
      description: '**Required Scopes:** `servers:read`',
      security: [{ StrafeBotToken: [] }],
    })
    expect(result.components?.securitySchemes?.StrafeBotToken).toMatchObject({
      scheme: 'bearer',
      type: 'http',
    })
  })

  it('marks a bot-enabled operation without an additional scope', () => {
    const result = filterBotOpenApi({
      paths: { '/me': { get: { 'x-bot-enabled': true, 'x-bot-scopes': [] } } },
    })
    expect(result.paths?.['/me']?.get?.description).toContain('None')
  })
})
