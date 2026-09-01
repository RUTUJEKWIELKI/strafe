import { defineConfig, devices } from '@playwright/test'

function normalizeBase(value: string | undefined) {
  const base = value ?? '/'
  return `/${base.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/')
}

const docsBase = normalizeBase(process.env.DOCS_BASE)
const docsOrigin = process.env.DOCS_ORIGIN ?? 'http://127.0.0.1:4173'
const baseURL = new URL(docsBase, docsOrigin).toString()

export default defineConfig({
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.CI ? {} : { channel: 'chrome' as const }),
      },
    },
  ],
  reporter: process.env.CI ? 'line' : 'list',
  retries: process.env.CI ? 1 : 0,
  testDir: './apps/docs/tests',
  timeout: 90_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'pnpm --filter @strafe/docs preview:serve --host 127.0.0.1 --port 4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
  workers: 1,
})
