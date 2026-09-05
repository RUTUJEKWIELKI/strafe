import { describe, expect, it } from 'vitest'

import { decryptMessage, encryptMessage } from './encryption.js'

describe('message envelope encryption', () => {
  it('round trips plaintext entirely on the client', async () => {
    const key = await crypto.subtle.generateKey(
      { length: 256, name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt'],
    )
    const store = { getConversationKey: async () => key }
    const envelope = await encryptMessage('sekret', store, {
      conversationId: 'conversation',
      epoch: 3,
      senderDeviceId: '0198f432-a7e5-7000-8000-000000000001',
    })

    expect(envelope.ciphertext).not.toContain('sekret')
    await expect(decryptMessage(envelope, 'conversation', store)).resolves.toBe(
      'sekret',
    )
  })

  it('marks historical plaintext as unavailable', async () => {
    const store = {
      getConversationKey: async () => {
        throw new Error('not called')
      },
    }
    await expect(decryptMessage(null, 'conversation', store)).rejects.toThrow(
      'Historical plaintext',
    )
  })
})
