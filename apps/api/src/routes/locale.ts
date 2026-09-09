import type { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { Type } from 'typebox'

type LandingLocale = 'en' | 'pl'

const polishCountryCodes = new Set(['PL'])

function header(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name]
  return typeof value === 'string' ? value.trim() : undefined
}

export function resolveLandingLocale(
  request: FastifyRequest,
  trustGeoHeaders: boolean,
): { locale: LandingLocale; source: 'default' | 'header' | 'ip' } {
  const countryCode = trustGeoHeaders
    ? header(request, 'cf-ipcountry') || header(request, 'x-vercel-ip-country')
    : undefined

  if (countryCode) {
    return {
      locale: polishCountryCodes.has(countryCode.toUpperCase()) ? 'pl' : 'en',
      source: 'ip',
    }
  }

  const acceptedLanguage = header(request, 'accept-language')
  if (acceptedLanguage) {
    return {
      locale: acceptedLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en',
      source: 'header',
    }
  }

  return { locale: 'en', source: 'default' }
}

const localeRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    '/locale',
    {
      schema: {
        operationId: 'getLandingLocale',
        response: {
          200: Type.Object({
            locale: Type.Union([Type.Literal('en'), Type.Literal('pl')]),
            source: Type.Union([
              Type.Literal('default'),
              Type.Literal('header'),
              Type.Literal('ip'),
            ]),
          }),
        },
        summary: 'Resolve the initial landing page locale',
        tags: ['system'],
      },
    },
    async (request) =>
      resolveLandingLocale(request, app.config.SESSION_TRUST_GEO_HEADERS),
  )
}

export default localeRoutes
