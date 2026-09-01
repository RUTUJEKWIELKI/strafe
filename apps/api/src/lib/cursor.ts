import { BadRequestError } from './errors.js'

export interface MessageCursor {
  createdAt: string
  id: string
}

export function encodeCursor(cursor: MessageCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeCursor(value: string): MessageCursor {
  try {
    const decoded = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as Partial<MessageCursor>

    if (
      typeof decoded.createdAt !== 'string' ||
      Number.isNaN(Date.parse(decoded.createdAt)) ||
      typeof decoded.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        decoded.id,
      )
    ) {
      throw new Error('Invalid cursor shape')
    }

    return { createdAt: decoded.createdAt, id: decoded.id }
  } catch {
    throw new BadRequestError('The pagination cursor is invalid', 'BAD_CURSOR')
  }
}
