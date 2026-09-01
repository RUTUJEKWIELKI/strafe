import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const docsRoot = resolve(scriptDir, '..')
const repositoryRoot = resolve(docsRoot, '../..')

const copies = [
  ['ROADMAP.md', 'guide/roadmap.md'],
  ['docs/introduction.md', 'guide/introduction.md'],
  ['docs/quickstart.md', 'guide/quickstart.md'],
  ['docs/core-concepts.md', 'guide/core-concepts.md'],
  ['docs/system-overview.md', 'guide/system-overview.md'],
  ['docs/backend-api.md', 'guide/backend-api.md'],
  ['docs/data-realtime-architecture.md', 'guide/data-realtime-architecture.md'],
  ['docs/guides/authentication.md', 'guide/guides/authentication.md'],
  ['docs/guides/community-setup.md', 'guide/guides/community-setup.md'],
  ['docs/guides/permissions.md', 'guide/guides/permissions.md'],
  ['docs/guides/realtime.md', 'guide/guides/realtime.md'],
  ['docs/guides/files.md', 'guide/guides/files.md'],
  ['AGENTS.md', 'guide/contributing.md'],
  ['SECURITY.md', 'guide/security.md'],
]

await Promise.all(
  copies.map(async ([source, destination]) => {
    const target = resolve(docsRoot, destination)
    await mkdir(dirname(target), { recursive: true })
    await copyFile(resolve(repositoryRoot, source), target)
  }),
)

const readme = await readFile(resolve(repositoryRoot, 'README.md'), 'utf8')
const repositoryGuide = readme
  .replaceAll('](ROADMAP.md)', '](./roadmap.md)')
  .replaceAll('](docs/backend-api.md)', '](./backend-api.md)')
  .replaceAll(
    '](docs/data-realtime-architecture.md)',
    '](./data-realtime-architecture.md)',
  )
  .replaceAll('](AGENTS.md)', '](./contributing.md)')
  .replace(/^# /, '# Repository — ')
await writeFile(resolve(docsRoot, 'guide/repository.md'), repositoryGuide)

const openapiSource = resolve(repositoryRoot, 'apps/api/openapi/openapi.json')
const openapiTarget = resolve(docsRoot, 'public/openapi.json')

let openapiText
try {
  openapiText = await readFile(openapiSource, 'utf8')
  const openapiDocument = JSON.parse(openapiText)
  if (
    typeof openapiDocument !== 'object' ||
    openapiDocument === null ||
    typeof openapiDocument.openapi !== 'string' ||
    typeof openapiDocument.info?.title !== 'string' ||
    typeof openapiDocument.paths !== 'object' ||
    openapiDocument.paths === null
  ) {
    throw new Error('required OpenAPI fields are missing')
  }
} catch (error) {
  throw new Error(
    'Unable to prepare apps/api/openapi/openapi.json. Run `pnpm contracts:generate` and retry the documentation command.',
    { cause: error },
  )
}

await mkdir(dirname(openapiTarget), { recursive: true })
await writeFile(openapiTarget, openapiText)

const generatedRoot = resolve(docsRoot, 'api/generated')
await rm(generatedRoot, { force: true, recursive: true })
await mkdir(generatedRoot, { recursive: true })
await writeFile(
  resolve(generatedRoot, '.gitignore'),
  '*\n!.gitignore\n!index.md\n',
)
await writeFile(
  resolve(generatedRoot, 'index.md'),
  '# Generated TypeScript API\n\nTypeDoc generates the shared TypeScript contract pages into this directory during `pnpm docs:build`.\n',
)
