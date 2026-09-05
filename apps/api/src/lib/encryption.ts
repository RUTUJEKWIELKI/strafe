import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGO = 'aes-256-gcm'

/**
 * Encrypts PII data using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @param key Buffer of 32 bytes.
 */
export function encryptPII(text: string, key: Buffer): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag().toString('base64')
  return `${iv.toString('base64')}:${authTag}:${encrypted}`
}

/**
 * Decrypts PII data that was encrypted with encryptPII.
 * @param cipherText The formatted string (iv:authTag:encrypted).
 * @param key Buffer of 32 bytes.
 */
export function decryptPII(cipherText: string, key: Buffer): string {
  const parts = cipherText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid cipher format')
  }
  const [iv64, authTag64, encrypted] = parts as [string, string, string]

  const decipher = createDecipheriv(ALGO, key, Buffer.from(iv64, 'base64'))
  decipher.setAuthTag(Buffer.from(authTag64, 'base64'))
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
