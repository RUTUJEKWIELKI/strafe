import { describe, expect, it } from 'vitest'

import { authErrorKey } from './errors.js'

describe('auth error presentation', () => {
  it('maps expected API failures without exposing backend response text', () => {
    expect(authErrorKey({ response: { status: 401 } })).toBe(
      'invalidCredentials',
    )
    expect(authErrorKey({ response: { status: 429 } })).toBe('rateLimit')
    expect(
      authErrorKey({
        error: { error: { code: 'HANDLE_TAKEN' } },
        response: { status: 409 },
      }),
    ).toBe('handleTaken')
  })

  it('uses a safe message key for network and unknown failures', () => {
    expect(authErrorKey(new TypeError('network details'))).toBe('networkError')
    expect(authErrorKey({ response: { status: 500 } })).toBe('unexpectedError')
  })
})
