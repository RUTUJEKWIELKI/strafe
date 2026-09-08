import type { FastifyRequest } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildServer } from '../dist/server.js'
import { resolveLandingLocale } from './routes/locale.js'

let server: Awaited<ReturnType<typeof buildServer>>

beforeAll(async () => {
  server = await buildServer({ logger: false })
}, 30_000)

afterAll(async () => server.close())

describe('landing locale route', () => {
  it('maps trusted IP country metadata to Polish', () => {
    const request = {
      headers: { 'accept-language': 'en-US', 'cf-ipcountry': 'PL' },
    } as FastifyRequest

    expect(resolveLandingLocale(request, true)).toEqual({
      locale: 'pl',
      source: 'ip',
    })
  })

  it('uses the accepted language when trusted geo headers are unavailable', async () => {
    const response = await server.inject({
      headers: { 'accept-language': 'pl-PL,pl;q=0.9,en;q=0.8' },
      method: 'GET',
      url: '/api/locale',
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ locale: 'pl', source: 'header' })
  })

  it('does not trust a caller-provided country header by default', async () => {
    const response = await server.inject({
      headers: { 'accept-language': 'en-US', 'cf-ipcountry': 'PL' },
      method: 'GET',
      url: '/api/locale',
    })
    expect(response.json()).toEqual({ locale: 'en', source: 'header' })
  })
})
