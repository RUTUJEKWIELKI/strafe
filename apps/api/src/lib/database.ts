import type { FastifyInstance } from 'fastify'

import type { DatabaseService } from '../plugins/database.js'
import { ServiceUnavailableError } from './errors.js'

export function requireDatabase(app: FastifyInstance): DatabaseService {
  if (!app.database) {
    throw new ServiceUnavailableError('Database is not configured')
  }

  return app.database
}

export function isPostgresError(
  error: unknown,
): error is Error & { code: string; constraint?: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  )
}
