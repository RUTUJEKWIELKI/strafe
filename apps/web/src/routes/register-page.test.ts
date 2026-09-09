import { describe, expect, it } from 'vitest'

import { isOldEnough } from './register-page.js'

describe('registration birth date validation', () => {
  const now = new Date(2026, 8, 7)

  it('requires the full thirteenth birthday to have passed', () => {
    expect(isOldEnough('2013-09-08', now)).toBe(false)
    expect(isOldEnough('2013-09-07', now)).toBe(true)
  })

  it('rejects impossible and future dates', () => {
    expect(isOldEnough('2013-02-31', now)).toBe(false)
    expect(isOldEnough('2030-01-01', now)).toBe(false)
  })
})
