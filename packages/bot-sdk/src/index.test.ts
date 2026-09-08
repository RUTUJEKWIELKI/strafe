import { afterEach, describe, expect, it, vi } from 'vitest'

import { StrafeApiError, StrafeBot } from './index.js'

const token = `strafe_bot_${'a'.repeat(48)}`

class FakeWebSocket extends EventTarget {
  readyState: number = WebSocket.OPEN
  sent: string[] = []
  close(code = 1000, reason = '') {
    this.readyState = WebSocket.CLOSED
    const event = new Event('close') as Event & { code: number; reason: string }
    Object.assign(event, { code, reason })
    this.dispatchEvent(event)
  }
  send(data: string) {
    this.sent.push(data)
  }
  frame(op: string, data: unknown) {
    this.dispatchEvent(
      new MessageEvent('message', { data: JSON.stringify({ d: data, op }) }),
    )
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('StrafeBot', () => {
  it('rejects malformed credentials before making a request', () => {
    expect(() => new StrafeBot({ token: 'not-a-token' })).toThrow(TypeError)
  })

  it('surfaces structured API errors and retry metadata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'RATE_LIMITED',
              message: 'Slow down',
              requestId: 'request-1',
            },
          }),
          {
            headers: {
              'content-type': 'application/json',
              'retry-after': '12',
            },
            status: 429,
          },
        ),
      ),
    )
    const bot = new StrafeBot({ token })

    const error = await bot.getMe().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(StrafeApiError)
    expect(error).toMatchObject({
      code: 'RATE_LIMITED',
      requestId: 'request-1',
      retryAfter: 12,
      status: 429,
    })
  })

  it('identifies after hello and exposes gateway commands and events', async () => {
    const socket = new FakeWebSocket()
    const bot = new StrafeBot({
      token,
      webSocketFactory: () => socket as unknown as WebSocket,
    })
    const events: unknown[] = []
    bot.on('message.created', (event) => events.push(event))
    const connecting = bot.connect({ lastStreamId: '42-0', timeoutMs: 1_000 })

    socket.frame('hello', { heartbeatIntervalMs: 30_000 })
    expect(JSON.parse(socket.sent[0]!)).toEqual({
      d: { lastStreamId: '42-0', token },
      op: 'identify',
    })
    socket.frame('ready', { userId: 'bot-user' })
    await connecting
    bot.subscribe('channel-1')
    expect(JSON.parse(socket.sent[1]!)).toEqual({
      d: { channelId: 'channel-1' },
      op: 'subscribe',
    })
    socket.frame('event', {
      data: {},
      eventId: 'event-1',
      occurredAt: new Date().toISOString(),
      streamId: '43-0',
      type: 'message.created',
      version: 1,
    })
    expect(events).toHaveLength(1)
    bot.disconnect()
  })
})
