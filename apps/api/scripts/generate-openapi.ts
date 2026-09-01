import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import openapiTS, { astToString } from 'openapi-typescript'

import { buildServer } from '../src/server.js'

const apiRoot = resolve(import.meta.dirname, '..')
const specificationPath = resolve(apiRoot, 'openapi/openapi.json')
const clientSchemaPath = resolve(apiRoot, '../web/src/lib/api/schema.d.ts')
const app = await buildServer({ logger: false })

try {
  await app.ready()
  const specification = app.swagger()
  const clientSchema = astToString(await openapiTS(specification))

  await Promise.all([
    mkdir(resolve(apiRoot, 'openapi'), { recursive: true }),
    mkdir(resolve(clientSchemaPath, '..'), { recursive: true }),
  ])
  await Promise.all([
    writeFile(specificationPath, `${JSON.stringify(specification, null, 2)}\n`),
    writeFile(clientSchemaPath, clientSchema),
  ])
} finally {
  await app.close()
}
