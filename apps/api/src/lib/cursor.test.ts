import { describe, expect, it } from 'vitest'

import { decodeCursor, encodeCursor } from '../../dist/lib/cursor.js'

describe('message cursor', () => {
  it('round-trips the stable timestamp and UUID pair', () => {
    const cursor = {
      createdAt: '2026-08-28T12:00:00.000Z',
      id: '0198f000-0000-7000-8000-000000000001',
    }

    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
  })

  it('rejects malformed input without leaking parser errors', () => {
    expect(() => decodeCursor('not-a-cursor')).toThrow(
      'The pagination cursor is invalid',
    )
  })
})
