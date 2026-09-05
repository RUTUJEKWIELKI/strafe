export interface OpenApiDocument {
  openapi?: string
  info?: {
    title?: string
    description?: string
    version?: string
    [key: string]: unknown
  }
  servers?: Array<{ url: string; description?: string }>
  paths?: Record<string, Record<string, Record<string, unknown>>>
  components?: {
    securitySchemes?: Record<string, Record<string, unknown>>
    schemas?: Record<string, Record<string, unknown>>
    [key: string]: unknown
  }
  [key: string]: unknown
}

/**
 * Filters a full Strafe OpenAPI specification down to only operations
 * that are permitted for scoped Bot identities.
 */
export function filterBotOpenApi(document: OpenApiDocument): OpenApiDocument {
  const botPaths: Record<string, Record<string, Record<string, unknown>>> = {}

  for (const [path, methods] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (
        operation &&
        typeof operation === 'object' &&
        (operation['x-bot-scopes'] !== undefined ||
          operation['x-bot-enabled'] === true)
      ) {
        if (!botPaths[path]) {
          botPaths[path] = {}
        }

        const scopes: string[] = Array.isArray(operation['x-bot-scopes'])
          ? operation['x-bot-scopes']
          : []

        const scopeDescription =
          scopes.length > 0
            ? `**Required Scopes:** ${scopes.map((scope) => `\`${scope}\``).join(', ')}`
            : '**Required Scopes:** None (accessible to any valid bot token)'

        botPaths[path][method] = {
          ...operation,
          description: operation.description
            ? `${operation.description}\n\n${scopeDescription}`
            : scopeDescription,
          security: [{ StrafeBotToken: [] }],
        }
      }
    }
  }

  return {
    ...document,
    info: {
      title: 'Strafe Bot API',
      description:
        'Official scoped OpenAPI specification for Strafe Bots and Automated Integrations. Use a bot token (strafe_bot_...) as a Bearer token.',
      version: document.info?.version ?? '0.0.0',
    },
    components: {
      ...document.components,
      securitySchemes: {
        StrafeBotToken: {
          bearerFormat: 'strafe_bot_<token>',
          description:
            'Authenticate using a scoped Strafe bot token with Bearer authorization.',
          scheme: 'bearer',
          type: 'http',
        },
      },
    },
    paths: botPaths,
  }
}
