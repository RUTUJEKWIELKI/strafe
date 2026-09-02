import Dexie, { type EntityTable } from 'dexie'

export interface DecryptedIndexMessage {
  authorId: string
  channelId: string
  content: string
  createdAt: string
  id: string
}

interface EncryptedDocument {
  ciphertext: ArrayBuffer
  id: string
  iv: Uint8Array<ArrayBuffer>
  ownerDevice: string
}

interface SearchToken {
  documentId: string
  id?: number
  ownerDevice: string
  token: string
}

class EncryptedSearchDatabase extends Dexie {
  documents!: EntityTable<EncryptedDocument, 'id'>
  tokens!: EntityTable<SearchToken, 'id'>

  constructor() {
    super('strafe-encrypted-search')
    this.version(1).stores({
      documents: 'id, ownerDevice',
      tokens: '++id, [ownerDevice+token], documentId, ownerDevice',
    })
  }
}

const database = new EncryptedSearchDatabase()
const encoder = new TextEncoder()
const decoder = new TextDecoder()

function words(value: string): string[] {
  return [
    ...new Set(
      value
        .normalize('NFKC')
        .toLocaleLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length > 1),
    ),
  ]
}

function bytesToToken(bytes: ArrayBuffer): string {
  return btoa(String.fromCodePoint(...new Uint8Array(bytes)))
}

export class EncryptedMessageIndex {
  readonly #encryptionKey: CryptoKey
  readonly #searchKey: CryptoKey
  readonly #ownerDevice: string

  private constructor(
    ownerId: string,
    deviceId: string,
    encryptionKey: CryptoKey,
    searchKey: CryptoKey,
  ) {
    this.#ownerDevice = `${ownerId}:${deviceId}`
    this.#encryptionKey = encryptionKey
    this.#searchKey = searchKey
  }

  static async unlock(ownerId: string, deviceId: string, key: BufferSource) {
    const keyBytes = await crypto.subtle.digest('SHA-512', key)
    const encryptionKey = await crypto.subtle.importKey(
      'raw',
      keyBytes.slice(0, 32),
      'AES-GCM',
      false,
      ['decrypt', 'encrypt'],
    )
    const searchKey = await crypto.subtle.importKey(
      'raw',
      keyBytes.slice(32),
      { hash: 'SHA-256', name: 'HMAC' },
      false,
      ['sign'],
    )
    return new EncryptedMessageIndex(
      ownerId,
      deviceId,
      encryptionKey,
      searchKey,
    )
  }

  async index(message: DecryptedIndexMessage): Promise<void> {
    const documentId = `${this.#ownerDevice}:${message.id}`
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ciphertext = await crypto.subtle.encrypt(
      { iv, name: 'AES-GCM' },
      this.#encryptionKey,
      encoder.encode(JSON.stringify(message)),
    )
    const tokens = await Promise.all(
      words(message.content).map(async (word) => ({
        documentId,
        ownerDevice: this.#ownerDevice,
        token: await this.#token(word),
      })),
    )
    await database.transaction(
      'rw',
      database.documents,
      database.tokens,
      async () => {
        await database.tokens.where('documentId').equals(documentId).delete()
        await database.documents.put({
          ciphertext,
          id: documentId,
          iv,
          ownerDevice: this.#ownerDevice,
        })
        if (tokens.length > 0) await database.tokens.bulkAdd(tokens)
      },
    )
  }

  async remove(messageId: string): Promise<void> {
    const documentId = `${this.#ownerDevice}:${messageId}`
    await database.transaction(
      'rw',
      database.documents,
      database.tokens,
      async () => {
        await database.tokens.where('documentId').equals(documentId).delete()
        await database.documents.delete(documentId)
      },
    )
  }

  async search(query: string): Promise<DecryptedIndexMessage[]> {
    const queryTokens = await Promise.all(
      words(query).map((word) => this.#token(word)),
    )
    if (queryTokens.length === 0) return []
    const matches = await Promise.all(
      queryTokens.map((token) =>
        database.tokens
          .where('[ownerDevice+token]')
          .equals([this.#ownerDevice, token])
          .toArray(),
      ),
    )
    const ids =
      matches[0]
        ?.map(({ documentId }) => documentId)
        .filter((id) =>
          matches.every((rows) => rows.some((row) => row.documentId === id)),
        ) ?? []
    const documents = await database.documents.bulkGet(ids)
    return Promise.all(
      documents
        .filter((document) => document !== undefined)
        .map(async (document) => {
          const plaintext = await crypto.subtle.decrypt(
            { iv: document.iv, name: 'AES-GCM' },
            this.#encryptionKey,
            document.ciphertext,
          )
          return JSON.parse(decoder.decode(plaintext)) as DecryptedIndexMessage
        }),
    )
  }

  async clear(): Promise<void> {
    await database.transaction(
      'rw',
      database.documents,
      database.tokens,
      async () => {
        await database.documents
          .where('ownerDevice')
          .equals(this.#ownerDevice)
          .delete()
        await database.tokens
          .where('ownerDevice')
          .equals(this.#ownerDevice)
          .delete()
      },
    )
  }

  async #token(word: string): Promise<string> {
    return bytesToToken(
      await crypto.subtle.sign('HMAC', this.#searchKey, encoder.encode(word)),
    )
  }
}

/** Clears local plaintext-derived state on both explicit logout and remote revocation. */
export function installEncryptedIndexCleanup(
  index: EncryptedMessageIndex,
): () => void {
  const clear = () => void index.clear()
  window.addEventListener('strafe:logout', clear)
  window.addEventListener('strafe:device-invalidated', clear)
  return () => {
    window.removeEventListener('strafe:logout', clear)
    window.removeEventListener('strafe:device-invalidated', clear)
  }
}
