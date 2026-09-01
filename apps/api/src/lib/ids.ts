import { createHash, randomBytes } from 'node:crypto'
import { v7 as uuidv7 } from 'uuid'

export function createId(): string {
  return uuidv7()
}

export function createOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url')
}

export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function normalizeHandle(handle: string): string {
  return handle.trim().normalize('NFKC').toLowerCase()
}

export function safeSlug(value: string): string {
  const slug = value
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)

  return slug || 'server'
}
