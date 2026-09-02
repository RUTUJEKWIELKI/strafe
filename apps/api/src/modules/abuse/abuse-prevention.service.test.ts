import { describe, expect, it } from 'vitest'

import { AbusePreventionService } from './abuse-prevention.service.js'

describe('AbusePreventionService nonce semantics', () => {
  const service = new AbusePreventionService({} as never)

  it('accepts an exact retry', () => {
    expect(() =>
      service.assertSameNonce(
        { channelId: 'channel', content: 'hello', replyToMessageId: null },
        {
          channelId: 'channel',
          content: 'hello',
          replyToMessageId: undefined,
        },
      ),
    ).not.toThrow()
  })

  it('rejects reusing a nonce with a different payload', () => {
    expect(() =>
      service.assertSameNonce(
        { channelId: 'channel', content: 'hello', replyToMessageId: null },
        {
          channelId: 'channel',
          content: 'changed',
          replyToMessageId: undefined,
        },
      ),
    ).toThrowError(expect.objectContaining({ code: 'CLIENT_NONCE_REUSED' }))
  })
})
