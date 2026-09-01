import websocket from '@fastify/websocket'
import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

const websocketPlugin: FastifyPluginAsync = async (app) => {
  await app.register(websocket, {
    errorHandler(error, socket, request) {
      request.log.warn({ err: error }, 'WebSocket handler failed')
      socket.close(1011, 'Internal error')
    },
    options: {
      maxPayload: app.config.GATEWAY_MAX_FRAME_BYTES,
    },
  })
}

export default fp(websocketPlugin, { name: 'websocket' })
