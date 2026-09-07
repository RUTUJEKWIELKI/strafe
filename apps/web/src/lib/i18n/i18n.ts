import { createInstance } from 'i18next'

import { getLandingLocale } from '../api/client.js'
import { resources } from './resources.js'

export type SupportedLocale = keyof typeof resources

export const languageStorageKey = 'strafe.language'
export const supportedLocales: SupportedLocale[] = ['pl', 'en']

export const i18n = createInstance()
const initialized = i18n.init({
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  lng: 'en',
  resources,
  supportedLngs: supportedLocales,
})

function toSupportedLocale(
  locale: string | null | undefined,
): SupportedLocale | null {
  const normalized = locale?.trim().toLowerCase().split('-')[0]
  return normalized === 'pl' || normalized === 'en' ? normalized : null
}

function browserLocale(): SupportedLocale {
  return (
    toSupportedLocale(navigator.languages?.[0] ?? navigator.language) ?? 'en'
  )
}

async function localeFromIp(): Promise<SupportedLocale | null> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 1_500)
  try {
    return toSupportedLocale(
      await getLandingLocale({ signal: controller.signal }),
    )
  } catch {
    return null
  } finally {
    window.clearTimeout(timeout)
  }
}

function savedLocale(): SupportedLocale | null {
  try {
    return toSupportedLocale(localStorage.getItem(languageStorageKey))
  } catch {
    return null
  }
}

function rememberLocale(locale: SupportedLocale): void {
  try {
    localStorage.setItem(languageStorageKey, locale)
  } catch {
    // A blocked storage API must not prevent the page from loading.
  }
}

function updateDocumentLanguage(locale: SupportedLocale): void {
  document.documentElement.lang = locale
  document.title = i18n.t('meta.title')
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', i18n.t('meta.description'))
}

export async function initializeI18n(
  detectLocale: () => Promise<SupportedLocale | null> = localeFromIp,
): Promise<SupportedLocale> {
  await initialized
  const existing = savedLocale()
  const locale = existing ?? (await detectLocale()) ?? browserLocale()
  if (!existing) rememberLocale(locale)
  await i18n.changeLanguage(locale)
  updateDocumentLanguage(locale)
  return locale
}

export async function changeLanguage(locale: SupportedLocale): Promise<void> {
  await initialized
  rememberLocale(locale)
  await i18n.changeLanguage(locale)
  updateDocumentLanguage(locale)
}
