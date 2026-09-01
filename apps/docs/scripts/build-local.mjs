import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    env,
    shell: isWindows,
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run(isWindows ? 'pnpm.cmd' : 'pnpm', ['run', 'generate'])
run(
  resolve(
    packageRoot,
    'node_modules',
    '.bin',
    isWindows ? 'vitepress.cmd' : 'vitepress',
  ),
  ['build', '.'],
  { ...process.env, DOCS_BASE: '/' },
)
