import createClient from 'openapi-fetch'
import type { paths } from './schema.js'

export interface StrafeBotOptions {
  token: string
  baseUrl?: string
}

export class StrafeBot {
  public api: ReturnType<typeof createClient<paths>>

  constructor(options: StrafeBotOptions) {
    if (!options.token.startsWith('strafe_bot_')) {
      throw new Error('Invalid bot token format. Must start with "strafe_bot_"')
    }
    
    this.api = createClient<paths>({
      baseUrl: options.baseUrl ?? 'https://strafe.app',
      headers: {
        Authorization: `Bearer ${options.token}`
      }
    })
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
