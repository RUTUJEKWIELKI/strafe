import Dexie, { type EntityTable } from 'dexie'
import type { SecureConversationKeyStore } from '../messages/encryption.js'
import { api } from '../api/client.js'
import { currentDeviceId } from '../auth/session.js'

interface StoredKey {
  id: string
  key: CryptoKey
}
class KeyDatabase extends Dexie {
  keys!: EntityTable<StoredKey, 'id'>
  constructor() {
    super('strafe-e2ee-v1')
    this.version(1).stores({ keys: '&id' })
  }
}
const database = new KeyDatabase()

function base64url(value: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

export class IndexedDbConversationKeyStore implements SecureConversationKeyStore {
  private id(conversationId: string, epoch: number) {
    const deviceId = currentDeviceId()
    if (!deviceId) throw new Error('MISSING_DEVICE')
    return `conversation:${deviceId}:${conversationId}:${epoch}`
  }
  async getConversationKey(conversationId: string, epoch: number) {
    const row = await database.keys.get(this.id(conversationId, epoch))
    if (!row) throw new Error('MISSING_CONVERSATION_KEY')
    return row.key
  }
  async ensureConversationKey(conversationId: string, epoch: number) {
    try {
      return await this.getConversationKey(conversationId, epoch)
    } catch {
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      )
      await database.keys.put({
        id: this.id(conversationId, epoch),
        key,
      })
      return key
    }
  }
}

export const conversationKeyStore = new IndexedDbConversationKeyStore()

export async function ensureDeviceKeyBundle(deviceId: string) {
  const existing = await database.keys.get(`identity:${deviceId}`)
  if (existing) return
  const identity = await crypto.subtle.generateKey('Ed25519', false, [
    'sign',
    'verify',
  ])
  const signedPrekey = await crypto.subtle.generateKey('X25519', false, [
    'deriveBits',
  ])
  const publicKey = base64url(
    await crypto.subtle.exportKey('raw', signedPrekey.publicKey),
  )
  const signature = base64url(
    await crypto.subtle.sign(
      'Ed25519',
      identity.privateKey,
      new TextEncoder().encode(`1:1:${publicKey}`),
    ),
  )
  const oneTimePairs = await Promise.all(
    Array.from({ length: 20 }, () =>
      crypto.subtle.generateKey('X25519', false, ['deriveBits']),
    ),
  )
  await api.PUT('/api/encryption/keys', {
    body: {
      identityKey: base64url(
        await crypto.subtle.exportKey('spki', identity.publicKey),
      ),
      version: 1,
      signedPrekey: { keyId: 1, publicKey, signature },
      oneTimePrekeys: await Promise.all(
        oneTimePairs.map(async (pair, keyId) => ({
          keyId: keyId + 2,
          publicKey: base64url(
            await crypto.subtle.exportKey('raw', pair.publicKey),
          ),
        })),
      ),
    },
  })
  await database.transaction('rw', database.keys, async () => {
    await database.keys.put({
      id: `identity:${deviceId}`,
      key: identity.privateKey,
    })
    await database.keys.put({
      id: `signed-prekey:${deviceId}`,
      key: signedPrekey.privateKey,
    })
    for (const [index, pair] of oneTimePairs.entries())
      await database.keys.put({
        id: `prekey:${deviceId}:${index + 2}`,
        key: pair.privateKey,
      })
  })
}
