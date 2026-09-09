import { EventEmitter } from 'node:events'
import createClient from 'openapi-fetch'

import type { paths } from './schema.js'

type CreateMessageBody =
  paths['/api/channels/{channelId}/messages']['post']['requestBody']['content']['application/json']
type UpdateMessageBody =
  paths['/api/messages/{messageId}']['patch']['requestBody']['content']['application/json']

export interface StrafeBotOptions {
  baseUrl?: string
  gatewayUrl?: string
  token: string
  webSocketFactory?: (url: string) => WebSocket
}

export interface ConnectOptions {
  lastStreamId?: string
  signal?: AbortSignal
  timeoutMs?: number
}

export interface GatewayEvent<T = Record<string, unknown>> {
  data: T
  eventId: string
  occurredAt: string
  streamId: string | null
  type: string
  version: number
}

export interface GatewayError {
  code: string
  message: string
}

export class StrafeApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly requestId?: string,
    readonly retryAfter?: number,
  ) {
    super(message)
    this.name = 'StrafeApiError'
  }
}

function apiError(response: Response, error: unknown): StrafeApiError {
  const body = error as {
    error?: { code?: string; message?: string; requestId?: string }
  }
  const retryAfter = Number(response.headers.get('retry-after'))
  return new StrafeApiError(
    body.error?.message ??
      `Strafe API request failed with HTTP ${response.status}`,
    response.status,
    body.error?.code,
    body.error?.requestId,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
  )
}

export class StrafeBot extends EventEmitter {
  readonly api: ReturnType<typeof createClient<paths>>
  readonly baseUrl: string
  readonly gatewayUrl: string
  #heartbeatInterval: ReturnType<typeof setInterval> | null = null
  #options: StrafeBotOptions
  #ws: WebSocket | null = null

  constructor(options: StrafeBotOptions) {
    super()
    if (!/^strafe_bot_[A-Za-z0-9_-]{32,}$/u.test(options.token)) {
      throw new TypeError('Invalid bot token format')
    }
    this.#options = options
    this.baseUrl = (options.baseUrl ?? 'https://strafe.app').replace(/\/$/u, '')
    this.gatewayUrl =
      options.gatewayUrl ??
      `${this.baseUrl.replace(/^http/u, 'ws')}/api/gateway`
    this.api = createClient<paths>({
      baseUrl: this.baseUrl,
      headers: { authorization: `Bearer ${options.token}` },
    })
  }

  get connected(): boolean {
    return this.#ws?.readyState === WebSocket.OPEN
  }

  async connect(options: ConnectOptions = {}): Promise<void> {
    if (this.#ws)
      throw new Error('The bot gateway is already connecting or connected')
    if (options.lastStreamId && !/^\d+-\d+$/u.test(options.lastStreamId)) {
      throw new TypeError('lastStreamId must use the Redis stream ID format')
    }
    const createWebSocket =
      this.#options.webSocketFactory ?? ((url: string) => new WebSocket(url))
    const socket = createWebSocket(this.gatewayUrl)
    this.#ws = socket

    return new Promise((resolve, reject) => {
      let settled = false
      const finishWithError = (error: unknown) => {
        if (settled) return
        settled = true
        this.disconnect()
        reject(
          error instanceof Error
            ? error
            : new Error('Gateway connection failed'),
        )
      }
      const timeout = setTimeout(
        () => finishWithError(new Error('Gateway handshake timed out')),
        options.timeoutMs ?? 15_000,
      )
      const abort = () =>
        finishWithError(
          options.signal?.reason ?? new Error('Gateway connection aborted'),
        )
      options.signal?.addEventListener('abort', abort, { once: true })

      socket.addEventListener('message', (event) => {
        let frame: { d?: unknown; op?: string }
        try {
          frame = JSON.parse(String(event.data)) as typeof frame
        } catch {
          this.emit('gatewayError', {
            code: 'INVALID_JSON',
            message: 'Gateway returned invalid JSON',
          } satisfies GatewayError)
          return
        }
        if (!frame || typeof frame.op !== 'string') return

        if (frame.op === 'hello') {
          const hello = frame.d as { heartbeatIntervalMs?: number }
          socket.send(
            JSON.stringify({
              d: {
                token: this.#options.token,
                ...(options.lastStreamId
                  ? { lastStreamId: options.lastStreamId }
                  : {}),
              },
              op: 'identify',
            }),
          )
          const heartbeatMs = Math.max(
            5_000,
            hello?.heartbeatIntervalMs ?? 25_000,
          )
          this.#heartbeatInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN)
              socket.send(JSON.stringify({ d: {}, op: 'heartbeat' }))
          }, heartbeatMs)
          return
        }
        if (frame.op === 'ready') {
          clearTimeout(timeout)
          options.signal?.removeEventListener('abort', abort)
          if (!settled) {
            settled = true
            resolve()
          }
          this.emit('ready', frame.d)
          return
        }
        if (frame.op === 'event') {
          const gatewayEvent = frame.d as GatewayEvent
          this.emit('event', gatewayEvent)
          this.emit(gatewayEvent.type, gatewayEvent)
          return
        }
        if (frame.op === 'error')
          this.emit('gatewayError', frame.d as GatewayError)
        else if (frame.op === 'resync_required')
          this.emit('resyncRequired', frame.d)
        else if (frame.op === 'resumed') this.emit('resumed', frame.d)
      })
      socket.addEventListener('close', (event) => {
        clearTimeout(timeout)
        options.signal?.removeEventListener('abort', abort)
        const wasPending = !settled
        this.#cleanup()
        this.emit('disconnect', event)
        if (wasPending)
          finishWithError(
            new Error(`Gateway closed before ready (${event.code})`),
          )
      })
      socket.addEventListener('error', () =>
        finishWithError(new Error('Gateway connection failed')),
      )
    })
  }

  disconnect(code = 1000, reason = 'Client disconnect'): void {
    const socket = this.#ws
    this.#cleanup()
    if (socket && socket.readyState < WebSocket.CLOSING)
      socket.close(code, reason)
  }

  subscribe(channelId: string): void {
    this.#send('subscribe', { channelId })
  }
  unsubscribe(channelId: string): void {
    this.#send('unsubscribe', { channelId })
  }
  startTyping(channelId: string): void {
    this.#send('typing', { channelId })
  }
  setPresence(status: 'dnd' | 'idle' | 'invisible' | 'online'): void {
    this.#send('presence_update', { status })
  }

  async getMe() {
    const result = await this.api.GET('/api/users/@me')
    if (result.error) throw apiError(result.response, result.error)
    return result.data
  }

  async listServers() {
    const result = await this.api.GET('/api/users/@me/servers')
    if (result.error) throw apiError(result.response, result.error)
    return result.data.servers
  }

  async getServer(serverId: string) {
    const result = await this.api.GET('/api/servers/{serverId}', {
      params: { path: { serverId } },
    })
    if (result.error) throw apiError(result.response, result.error)
    return result.data
  }

  async listChannels(serverId: string) {
    const result = await this.api.GET('/api/servers/{serverId}/channels', {
      params: { path: { serverId } },
    })
    if (result.error) throw apiError(result.response, result.error)
    return result.data.channels
  }

  async getMessages(
    channelId: string,
    options: { before?: string; limit?: number } = {},
  ) {
    const result = await this.api.GET('/api/channels/{channelId}/messages', {
      params: { path: { channelId }, query: { ...options } },
    })
    if (result.error) throw apiError(result.response, result.error)
    return result.data
  }

  async sendMessage(channelId: string, body: CreateMessageBody) {
    const result = await this.api.POST('/api/channels/{channelId}/messages', {
      params: { path: { channelId } },
      body,
    })
    if (result.error) throw apiError(result.response, result.error)
    return result.data
  }

  /** @deprecated Use sendMessage. The API transports an encrypted envelope, not plaintext. */
  sendRawMessage(channelId: string, body: CreateMessageBody) {
    return this.sendMessage(channelId, body)
  }

  async updateMessage(messageId: string, body: UpdateMessageBody) {
    const result = await this.api.PATCH('/api/messages/{messageId}', {
      params: { path: { messageId } },
      body,
    })
    if (result.error) throw apiError(result.response, result.error)
    return result.data
  }

  async deleteMessage(messageId: string) {
    const result = await this.api.DELETE('/api/messages/{messageId}', {
      params: { path: { messageId } },
    })
    if (result.error) throw apiError(result.response, result.error)
    return result.data
  }

  #send(op: string, data: Record<string, string>): void {
    if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN)
      throw new Error('The bot gateway is not connected')
    this.#ws.send(JSON.stringify({ d: data, op }))
  }

  #cleanup(): void {
    if (this.#heartbeatInterval) clearInterval(this.#heartbeatInterval)
    this.#heartbeatInterval = null
    this.#ws = null
  }
}
