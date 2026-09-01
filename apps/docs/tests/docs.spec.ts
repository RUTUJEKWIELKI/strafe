import { expect, test, type Page } from '@playwright/test'

function monitorPage(page: Page) {
  const failures: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      const location = message.location().url
      failures.push(
        `console: ${message.text()}${location ? ` (${location})` : ''}`,
      )
    }
  })
  page.on('pageerror', (error) => {
    failures.push(`page: ${error.message}`)
  })
  page.on('requestfailed', (request) => {
    failures.push(
      `request: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown error'})`,
    )
  })
  page.on('response', (response) => {
    if (response.status() === 404) {
      failures.push(`404: ${response.request().method()} ${response.url()}`)
    }
  })

  return () => expect(failures, failures.join('\n')).toEqual([])
}

test('renders the home page and Mermaid architecture diagram', async ({
  page,
}) => {
  const expectCleanPage = monitorPage(page)
  const response = await page.goto('./')

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: 'Strafe' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Explore Strafe' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start building' })).toBeVisible()
  await expect(page.locator('.mermaid svg')).toBeVisible()
  expectCleanPage()
})

test('renders the introduction, quickstart, and authentication guide', async ({
  page,
}) => {
  const expectCleanPage = monitorPage(page)
  const pages = [
    ['./guide/introduction', 'Introduction'],
    ['./guide/quickstart', 'Quickstart'],
    ['./guide/guides/authentication', 'Authentication'],
  ] as const

  for (const [path, heading] of pages) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(
      page.locator('main h1').filter({ hasText: heading }),
    ).toBeVisible()
  }

  expectCleanPage()
})

test('renders Scalar from the public OpenAPI document', async ({ page }) => {
  const expectCleanPage = monitorPage(page)
  const openapiResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith('/openapi.json'),
  )
  const response = await page.goto('./api/reference')

  expect(response?.status()).toBe(200)
  expect((await openapiResponse).status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: 'Interactive API Reference' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { exact: true, name: 'Strafe API' }),
  ).toBeVisible({ timeout: 45_000 })
  expectCleanPage()
})

test('renders the generated TypeDoc index', async ({ page }) => {
  const expectCleanPage = monitorPage(page)
  const response = await page.goto('./api/generated/')

  expect(response?.status()).toBe(200)
  await expect(
    page.getByRole('heading', { name: 'Strafe Shared API' }),
  ).toBeVisible()
  expectCleanPage()
})
