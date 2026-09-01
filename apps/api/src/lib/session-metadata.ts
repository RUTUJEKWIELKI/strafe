import type { FastifyRequest } from 'fastify'
import { UAParser } from 'ua-parser-js'

import type { SessionMetadata } from '../modules/auth/auth.service.js'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function header(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name]
  return typeof value === 'string' ? value.trim().slice(0, 255) : undefined
}

export function sessionMetadata(request: FastifyRequest): SessionMetadata {
  const userAgent = request.headers['user-agent']?.slice(0, 1_000)
  const parsed = new UAParser(userAgent).getResult()
  const requestedDeviceId = header(request, 'x-strafe-device-id')
  const deviceName =
    header(request, 'x-strafe-device-name') ||
    [parsed.browser.name, parsed.device.model].filter(Boolean).join(' on ') ||
    'Unknown device'
  const platform =
    header(request, 'x-strafe-device-platform') ||
    parsed.os.name ||
    parsed.device.type ||
    'unknown'

  const city =
    header(request, 'cf-ipcity') || header(request, 'x-vercel-ip-city')
  const countryCode =
    header(request, 'cf-ipcountry') || header(request, 'x-vercel-ip-country')
  return {
    ...(request.server.config.SESSION_TRUST_GEO_HEADERS && city
      ? { city }
      : {}),
    ...(request.server.config.SESSION_TRUST_GEO_HEADERS && countryCode
      ? { countryCode }
      : {}),
    ...(requestedDeviceId && uuidPattern.test(requestedDeviceId)
      ? { deviceId: requestedDeviceId }
      : {}),
    deviceName: deviceName.slice(0, 100),
    ipAddress: request.ip.slice(0, 64),
    platform: platform.slice(0, 100),
    ...(userAgent ? { userAgent } : {}),
  }
}
