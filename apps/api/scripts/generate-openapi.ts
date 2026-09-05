import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import openapiTS, { astToString } from 'openapi-typescript'

import { filterBotOpenApi } from '../src/lib/bot-openapi.js'
import { buildServer } from '../src/server.js'

const apiRoot = resolve(import.meta.dirname, '..')
const specificationPath = resolve(apiRoot, 'openapi/openapi.json')
const botSpecificationPath = resolve(apiRoot, 'openapi/bot-openapi.json')
const clientSchemaPath = resolve(apiRoot, '../web/src/lib/api/schema.d.ts')
const botSdkSchemaPath = resolve(
  apiRoot,
  '../../packages/bot-sdk/src/schema.d.ts',
)

const app = await buildServer({ logger: false })

try {
  await app.ready()
  const fullSpecification = app.swagger()
  const botSpecification = filterBotOpenApi(fullSpecification)

  const [clientSchema, botSdkSchema] = await Promise.all([
    openapiTS(fullSpecification).then((ast) => astToString(ast)),
    openapiTS(botSpecification).then((ast) => astToString(ast)),
  ])

  await Promise.all([
    mkdir(resolve(apiRoot, 'openapi'), { recursive: true }),
    mkdir(resolve(clientSchemaPath, '..'), { recursive: true }),
    mkdir(resolve(botSdkSchemaPath, '..'), { recursive: true }),
  ])

  await Promise.all([
    writeFile(
      specificationPath,
      `${JSON.stringify(fullSpecification, null, 2)}\n`,
    ),
    writeFile(
      botSpecificationPath,
      `${JSON.stringify(botSpecification, null, 2)}\n`,
    ),
    writeFile(clientSchemaPath, clientSchema),
    writeFile(botSdkSchemaPath, botSdkSchema),
  ])
} finally {
  await app.close()
}
