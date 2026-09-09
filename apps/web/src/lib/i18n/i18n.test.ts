import { afterEach, describe, expect, it, vi } from 'vitest'

import { i18n, initializeI18n, languageStorageKey } from './i18n.js'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('landing page locale detection', () => {
  it('uses the IP-derived locale on the first visit and stores it', async () => {
    const detectLocale = vi.fn().mockResolvedValue('pl')

    await expect(initializeI18n(detectLocale)).resolves.toBe('pl')
    expect(detectLocale).toHaveBeenCalledOnce()
    expect(localStorage.getItem(languageStorageKey)).toBe('pl')
    expect(i18n.resolvedLanguage).toBe('pl')
  })

  it('prefers a remembered language and skips IP detection', async () => {
    localStorage.setItem(languageStorageKey, 'en')
    const detectLocale = vi.fn()

    await expect(initializeI18n(detectLocale)).resolves.toBe('en')
    expect(detectLocale).not.toHaveBeenCalled()
    expect(document.documentElement.lang).toBe('en')
  })
})
