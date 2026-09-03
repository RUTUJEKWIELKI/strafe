import { MESSAGE_PROTOCOL_VERSION, type MessageEnvelope } from '@strafe/shared'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export interface SecureConversationKeyStore {
  /** Implementations must use Tauri Stronghold or an OS keystore, never web storage. */
  getConversationKey(conversationId: string, epoch: number): Promise<CryptoKey>
}

export interface EncryptMessageOptions {
  contentType?: string
  conversationId: string
  epoch: number
  senderDeviceId: string
}

function base64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCodePoint(byte)
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.codePointAt(0)!)
}

function associatedData(
  envelope: Omit<MessageEnvelope, 'authenticationTag' | 'ciphertext'>,
) {
  return encoder.encode(
    JSON.stringify([
      envelope.protocolVersion,
      envelope.contentType,
      envelope.senderDeviceId,
      envelope.epoch,
    ]),
  )
}

export async function encryptMessage(
  plaintext: string,
  keyStore: SecureConversationKeyStore,
  options: EncryptMessageOptions,
): Promise<MessageEnvelope> {
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const header = {
    contentType: options.contentType ?? 'text/plain; charset=utf-8',
    epoch: options.epoch,
    nonce: base64Url(nonce),
    protocolVersion: MESSAGE_PROTOCOL_VERSION,
    senderDeviceId: options.senderDeviceId,
  } as const
  const key = await keyStore.getConversationKey(
    options.conversationId,
    options.epoch,
  )
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt(
      { additionalData: associatedData(header), iv: nonce, name: 'AES-GCM' },
      key,
      encoder.encode(plaintext),
    ),
  )
  const tagOffset = sealed.length - 16
  return {
    ...header,
    authenticationTag: base64Url(sealed.slice(tagOffset)),
    ciphertext: base64Url(sealed.slice(0, tagOffset)),
  }
}

export async function decryptMessage(
  envelope: MessageEnvelope | null,
  conversationId: string,
  keyStore: SecureConversationKeyStore,
): Promise<string> {
  if (!envelope)
    throw new Error('Historical plaintext cannot be safely decrypted')
  const key = await keyStore.getConversationKey(conversationId, envelope.epoch)
  const ciphertext = fromBase64Url(envelope.ciphertext)
  const tag = fromBase64Url(envelope.authenticationTag)
  const sealed = new Uint8Array(ciphertext.length + tag.length)
  sealed.set(ciphertext)
  sealed.set(tag, ciphertext.length)
  const plaintext = await crypto.subtle.decrypt(
    {
      additionalData: associatedData(envelope),
      iv: fromBase64Url(envelope.nonce),
      name: 'AES-GCM',
    },
    key,
    sealed,
  )
  return decoder.decode(plaintext)
}
