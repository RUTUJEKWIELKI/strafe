import createClient from 'openapi-fetch'

import type { paths } from './schema.js'

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

let accessToken: string | null = null

api.use({
  onRequest({ request }) {
    if (accessToken)
      request.headers.set('authorization', `Bearer ${accessToken}`)
    return request
  },
  onResponse({ response }) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('strafe:device-invalidated'))
    }
  },
})

export function setApiAccessToken(token: string | null): void {
  accessToken = token
}

/** Call after a successful logout, before removing the in-memory session key. */
export function notifyLocalLogout(): void {
  window.dispatchEvent(new Event('strafe:logout'))
}

export async function getHealth() {
  const { data } = await api.GET('/api/health')

  if (!data) {
    throw new Error('The API did not return health data')
  }

  return data
}

export async function getLandingLocale(options?: {
  signal?: AbortSignal
}): Promise<'en' | 'pl'> {
  const { data } = await api.GET('/api/locale', {
    ...(options?.signal ? { signal: options.signal } : {}),
  })

  if (!data) {
    throw new Error('The API did not return a landing locale')
  }

  return data.locale
}
