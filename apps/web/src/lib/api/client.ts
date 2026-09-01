import createClient from 'openapi-fetch'

import type { paths } from './schema.js'

export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

export async function getHealth() {
  const { data } = await api.GET('/api/health')

  if (!data) {
    throw new Error('The API did not return health data')
  }

  return data
}
