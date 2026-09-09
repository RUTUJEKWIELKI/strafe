import type { RealtimeEvent } from '@strafe/shared'
import { getApiAccessToken, onApiAccessToken } from '../api/client.js'

type Status = 'connecting' | 'online' | 'offline'

export class RealtimeClient {
  #socket?: WebSocket
  #listeners = new Set<(event: RealtimeEvent) => void>()
  #statusListeners = new Set<(status: Status) => void>()
  #subscriptions = new Set<string>()
  #seen = new Set<string>()
  #heartbeat?: number
  #reconnect?: number
  #attempt = 0
  #closed = true
  #lastStreamId?: string
  #removeTokenListener?: () => void

  start() {
    this.#closed = false
    this.#removeTokenListener = onApiAccessToken(() => this.reconnect())
    this.connect()
  }
  stop() {
    this.#closed = true
    this.#removeTokenListener?.()
    clearInterval(this.#heartbeat)
    clearTimeout(this.#reconnect)
    this.#socket?.close(1000, 'Client shutdown')
  }
  reconnect() {
    this.#socket?.close(4000, 'Access token changed')
    if (!this.#socket || this.#socket.readyState === WebSocket.CLOSED)
      this.connect()
  }
  connect() {
    const token = getApiAccessToken()
    if (this.#closed || !token || this.#socket?.readyState === WebSocket.OPEN)
      return
    this.#emitStatus('connecting')
    const url = new URL(
      '/api/gateway',
      import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    )
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    const socket = new WebSocket(url)
    this.#socket = socket
    socket.addEventListener('message', ({ data }) => {
      const frame = JSON.parse(String(data)) as { op: string; d?: unknown }
      if (frame.op === 'hello')
        socket.send(
          JSON.stringify({
            op: 'identify',
            d: {
              token,
              ...(this.#lastStreamId
                ? { lastStreamId: this.#lastStreamId }
                : {}),
            },
          }),
        )
      if (frame.op === 'ready' || frame.op === 'resumed') {
        this.#attempt = 0
        this.#emitStatus('online')
        for (const channelId of this.#subscriptions)
          this.#send('subscribe', { channelId })
        clearInterval(this.#heartbeat)
        this.#heartbeat = window.setInterval(
          () => this.#send('heartbeat', {}),
          25_000,
        )
      }
      if (frame.op === 'event') {
        const event = frame.d as RealtimeEvent
        if (!event?.eventId || this.#seen.has(event.eventId)) return
        this.#seen.add(event.eventId)
        if (event.streamId) this.#lastStreamId = event.streamId
        if (this.#seen.size > 2_000)
          this.#seen.delete(this.#seen.values().next().value!)
        for (const listener of this.#listeners) listener(event)
      }
      if (frame.op === 'resync_required') {
        this.#lastStreamId = undefined
        window.dispatchEvent(new Event('strafe:realtime-resync'))
      }
    })
    socket.addEventListener('close', () => {
      clearInterval(this.#heartbeat)
      this.#emitStatus('offline')
      if (!this.#closed)
        this.#reconnect = window.setTimeout(
          () => this.connect(),
          Math.min(30_000, 1_000 * 2 ** this.#attempt++),
        )
    })
  }
  subscribe(channelId: string) {
    this.#subscriptions.add(channelId)
    this.#send('subscribe', { channelId })
    return () => {
      this.#subscriptions.delete(channelId)
      this.#send('unsubscribe', { channelId })
    }
  }
  typing(channelId: string) {
    this.#send('typing', { channelId })
  }
  onEvent(listener: (event: RealtimeEvent) => void) {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }
  onStatus(listener: (status: Status) => void) {
    this.#statusListeners.add(listener)
    return () => this.#statusListeners.delete(listener)
  }
  #send(op: string, d: unknown) {
    if (this.#socket?.readyState === WebSocket.OPEN)
      this.#socket.send(JSON.stringify({ op, d }))
  }
  #emitStatus(status: Status) {
    for (const listener of this.#statusListeners) listener(status)
  }
}

export const realtime = new RealtimeClient()
