import createClient from 'openapi-fetch'

import type { paths } from './schema.js'

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

api.use({
  onResponse({ response }) {
    if (response.status === 401) {
      window.dispatchEvent(new Event('strafe:device-invalidated'))
    }
  },
})

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
