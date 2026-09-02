import { type ErrorDetail, type ErrorResponse } from '@strafe/shared'
import autoload from '@fastify/autoload'
import fastify, { type FastifyError, type FastifyServerOptions } from 'fastify'
import { join } from 'node:path'

import env from '@fastify/env'
import { envOptions } from './config.js'
import { AppError } from './lib/errors.js'
import { assertProductionSecurity } from './lib/production-security.js'

const defaultLogger: Exclude<
  NonNullable<FastifyServerOptions['logger']>,
  boolean
> = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers.set-cookie',
    ],
    remove: true,
  },
}

if (process.env.NODE_ENV !== 'production') {
  defaultLogger.transport = {
    target: 'pino-pretty',
    options: {
      colorize: Boolean(process.stdout.isTTY),
      ignore: 'pid,hostname',
      levelFirst: true,
      singleLine: true,
      translateTime: 'SYS:standard',
    },
  }
}

function validationDetails(error: FastifyError): ErrorDetail[] | undefined {
  return error.validation?.map((issue) => ({
    ...(issue.instancePath ? { field: issue.instancePath } : {}),
    message: issue.message ?? 'Invalid value',
  }))
}

export async function buildServer(options: FastifyServerOptions = {}) {
  const app = fastify({
    logger: options.logger ?? defaultLogger,
    trustProxy:
      options.trustProxy ??
      (process.env.TRUST_PROXY_CIDRS
        ? process.env.TRUST_PROXY_CIDRS.split(',').map((value) => value.trim())
        : false),
    ...options,
  })

  await app.register(env, envOptions)
  await assertProductionSecurity(app.config)

  await app.register(autoload, {
    dir: join(import.meta.dirname, 'plugins'),
  })

  app.setNotFoundHandler(async (request, reply) => {
    const response: ErrorResponse = {
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
        requestId: request.id,
      },
    }
    await reply.code(404).send(response)
  })

  app.setErrorHandler(async (error: FastifyError, request, reply) => {
    const appError = error instanceof AppError ? error : undefined
    const statusCode =
      appError?.statusCode ??
      (error.validation ? 400 : (error.statusCode ?? 500))
    const isUnexpected = statusCode >= 500
    const details = appError?.details ?? validationDetails(error)
    const operationalCode =
      typeof error.code === 'string' && !error.code.startsWith('FST_')
        ? error.code
        : undefined
    const response: ErrorResponse = {
      error: {
        code:
          appError?.code ??
          (error.validation
            ? 'VALIDATION_ERROR'
            : (operationalCode ?? 'INTERNAL_ERROR')),
        ...(details ? { details } : {}),
        message: isUnexpected ? 'An unexpected error occurred' : error.message,
        requestId: request.id,
      },
    }

    request.log[isUnexpected ? 'error' : 'warn'](
      { err: error, errorCode: response.error.code },
      'Request failed',
    )
    if (isUnexpected) {
      app.reportError(error, {
        method: request.method,
        requestId: request.id,
        route: request.routeOptions.url,
      })
    }

    await reply.code(statusCode).send(response)
  })

  await app.register(autoload, {
    dir: join(import.meta.dirname, 'routes'),
    options: { prefix: '/api' },
  })

  return app
}
