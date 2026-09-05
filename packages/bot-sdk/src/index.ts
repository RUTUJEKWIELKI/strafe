import createClient from 'openapi-fetch'
import type { paths } from './schema.js'
import { EventEmitter } from 'node:events'

export interface StrafeBotOptions {
  token: string
  baseUrl?: string
}

export class StrafeBot extends EventEmitter {
  public api: ReturnType<typeof createClient<paths>>
  private ws: WebSocket | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null
  private options: StrafeBotOptions

  constructor(options: StrafeBotOptions) {
    super()
    if (!options.token.startsWith('strafe_bot_')) {
      throw new Error('Invalid bot token format. Must start with "strafe_bot_"')
    }
    this.options = options
    this.api = createClient<paths>({
      baseUrl: options.baseUrl ?? 'https://strafe.app',
      headers: {
        Authorization: `Bearer ${options.token}`
      }
    })
  }

  /**
   * Connect to the Strafe Realtime Gateway to receive events.
   * Requires `servers:read` scope.
   */
  async connect() {
    if (this.ws) throw new Error('Already connected')
    
    const wsUrl = (this.options.baseUrl ?? 'https://strafe.app').replace('http', 'ws') + '/api/gateway'
    this.ws = new WebSocket(wsUrl)
    
    return new Promise<void>((resolve, reject) => {
      this.ws!.addEventListener('open', () => {
        // Wait for hello before identifying? Actually we can identify immediately or wait for op: hello.
        // For simplicity, wait for hello.
      })

      this.ws!.addEventListener('message', (event) => {
        const payload = JSON.parse(event.data as string)
        
        switch (payload.op) {
          case 'hello':
            // Send identify
            this.ws!.send(JSON.stringify({
              op: 'identify',
              d: { token: this.options.token }
            }))
            
            // Start heartbeat
            const intervalMs = payload.d.heartbeatIntervalMs ?? 25000
            this.heartbeatInterval = setInterval(() => {
              this.ws?.send(JSON.stringify({ op: 'heartbeat' }))
            }, intervalMs - 5000)
            break
            
          case 'ready':
            resolve()
            this.emit('ready', payload.d)
            break
            
          case 'event':
            this.emit('event', payload.d)
            this.emit(payload.d.type, payload.d) // E.g., bot.on('message.create', ...)
            break
            
          case 'error':
            this.emit('error', payload.d)
            break
        }
      })

      this.ws!.addEventListener('close', (event) => {
        this.emit('disconnect', event)
        this.cleanup()
      })

      this.ws!.addEventListener('error', (error) => {
        if (!this.ws || this.ws.readyState === WebSocket.CONNECTING) reject(error)
        this.emit('error', error)
      })
    })
  }

  disconnect() {
    this.ws?.close()
    this.cleanup()
  }

  private cleanup() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval)
    this.ws = null
    this.heartbeatInterval = null
  }

  /**
   * Send a raw encrypted message payload to a specific channel.
   * Requires `messages:write` scope.
   */
  async sendRawMessage(channelId: string, body: paths['/api/channels/{channelId}/messages']['post']['requestBody']['content']['application/json']) {
    const { data, error } = await this.api.POST('/api/channels/{channelId}/messages', {
      params: { path: { channelId } },
      body
    })
    
    if (error) {
      throw new Error(`Failed to send message: ${JSON.stringify(error)}`)
    }
    
    return data
  }

  /**
   * Get the current bot user profile
   */
  async getMe() {
    const { data, error } = await this.api.GET('/api/users/@me', {})
    if (error) throw new Error(`Failed to fetch profile: ${JSON.stringify(error)}`)
    return data
  }

  /**
   * Get messages from a channel
   * Requires `messages:read` scope.
   */
  async getMessages(channelId: string, limit: number = 50) {
    const { data, error } = await this.api.GET('/api/channels/{channelId}/messages', {
      params: { path: { channelId }, query: { limit } }
    })
    if (error) throw new Error(`Failed to fetch messages: ${JSON.stringify(error)}`)
    return data
  }
}
