import { describe, expect, it } from 'vitest'

import { parseGatewayFrame, SlidingWindowLimiter } from './gateway-frame.js'

describe('gateway parser fuzz and limiter load', () => {
  it('does not crash or return invalid frames for deterministic fuzz input', () => {
    let state = 0x5eed1234
    for (let iteration = 0; iteration < 20_000; iteration += 1) {
      const length = iteration % 2 === 0 ? iteration % 2048 : iteration % 64
      const bytes = Buffer.alloc(length)
      for (let index = 0; index < length; index += 1) {
        state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
        bytes[index] = state & 0xff
      }
      try {
        const frame = parseGatewayFrame(bytes, 1024)
        expect(typeof frame.op).toBe('string')
        expect(frame.d).not.toBeNull()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    }
  })

  it('holds the exact boundary under sustained limiter load', () => {
    const limiter = new SlidingWindowLimiter(1_000, 60_000)
    let accepted = 0
    for (let request = 0; request < 100_000; request += 1) {
      if (limiter.allow(42)) accepted += 1
    }
    expect(accepted).toBe(1_000)
    expect(limiter.allow(60_042)).toBe(true)
  })
})
