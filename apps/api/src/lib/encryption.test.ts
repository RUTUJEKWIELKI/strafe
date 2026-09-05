import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { decryptPII, encryptPII } from './encryption'

describe('PII Encryption Utilities', () => {
  const dummyKey = randomBytes(32)

  it('encrypts and decrypts string correctly', () => {
    const plaintext = 'user@example.com'
    const encrypted = encryptPII(plaintext, dummyKey)
    
    expect(encrypted).not.toBe(plaintext)
    expect(encrypted.split(':').length).toBe(3)
    
    const decrypted = decryptPII(encrypted, dummyKey)
    expect(decrypted).toBe(plaintext)
  })

  it('produces different ciphertexts for the same input', () => {
    const plaintext = 'secret'
    const enc1 = encryptPII(plaintext, dummyKey)
    const enc2 = encryptPII(plaintext, dummyKey)
    expect(enc1).not.toBe(enc2)
  })

  it('fails on tampered ciphertext', () => {
    const encrypted = encryptPII('data', dummyKey)
    const parts = encrypted.split(':')
    // Modify encrypted payload
    parts[2] = Buffer.from('tampered').toString('base64')
    const tampered = parts.join(':')
    
    expect(() => decryptPII(tampered, dummyKey)).toThrowError(/Unsupported state or unable to authenticate data/)
  })

  it('fails on wrong key', () => {
    const encrypted = encryptPII('data', dummyKey)
    const wrongKey = randomBytes(32)
    
    expect(() => decryptPII(encrypted, wrongKey)).toThrowError(/Unsupported state or unable to authenticate data/)
  })
})
