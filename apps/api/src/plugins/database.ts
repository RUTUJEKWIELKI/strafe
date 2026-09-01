import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { Pool } from 'pg'

import * as schema from '../db/schema.js'

export interface DatabaseService {
  db: NodePgDatabase<typeof schema>
  pool: Pool
}

const databasePlugin: FastifyPluginAsync = async (app) => {
  if (!app.config.DATABASE_URL) {
    if (app.config.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required in production')
    }
    app.decorate('database', null)
    app.log.warn('Database disabled: DATABASE_URL is not configured')
    return
  }

  const pool = new Pool({
    connectionString: app.config.DATABASE_URL,
    max: app.config.DATABASE_POOL_MAX,
    ...(app.config.DATABASE_SSL === 'require'
      ? { ssl: { rejectUnauthorized: false } }
      : {}),
  })

  pool.on('error', (error) => {
    app.log.error({ err: error }, 'Unexpected PostgreSQL pool error')
    app.reportError(error, { component: 'database' })
  })

  app.decorate('database', {
    db: drizzle({ client: pool, schema }),
    pool,
  })

  app.addHook('onClose', async () => {
    await pool.end()
  })
}

export default fp(databasePlugin, { name: 'database' })
