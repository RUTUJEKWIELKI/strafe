import type { ErrorDetail } from '@strafe/shared'

export interface AppErrorOptions {
  code: string
  details?: ErrorDetail[]
  message: string
  statusCode?: number
}

export class AppError extends Error {
  readonly code: string
  readonly details: ErrorDetail[] | undefined
  readonly statusCode: number

  constructor({ code, details, message, statusCode = 500 }: AppErrorOptions) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.statusCode = statusCode
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super({ code: 'NOT_FOUND', message, statusCode: 404 })
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super({ code, message, statusCode: 400 })
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required') {
    super({ code: 'UNAUTHORIZED', message, statusCode: 401 })
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super({ code: 'FORBIDDEN', message, statusCode: 403 })
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super({ code, message, statusCode: 409 })
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'A required service is unavailable') {
    super({ code: 'SERVICE_UNAVAILABLE', message, statusCode: 503 })
  }
}
