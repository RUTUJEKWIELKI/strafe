export interface E2eeEnvelope {
  version: 1
  sessionId: string
  deviceId: string
  epoch: number
  counter: number
  nonceHex: string
  ciphertextHex: string
  signatureHex: string
}

const hexPattern = /^(?:[0-9a-f]{2})+$/

export function parseEnvelope(value: unknown): E2eeEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('invalid envelope')
  }
  const envelope = value as Record<string, unknown>
  if (
    envelope.version !== 1 ||
    typeof envelope.sessionId !== 'string' ||
    typeof envelope.deviceId !== 'string' ||
    !Number.isSafeInteger(envelope.epoch) ||
    (envelope.epoch as number) < 1 ||
    !Number.isSafeInteger(envelope.counter) ||
    (envelope.counter as number) < 0 ||
    typeof envelope.nonceHex !== 'string' ||
    envelope.nonceHex.length !== 24 ||
    !hexPattern.test(envelope.nonceHex) ||
    typeof envelope.ciphertextHex !== 'string' ||
    envelope.ciphertextHex.length < 32 ||
    !hexPattern.test(envelope.ciphertextHex) ||
    typeof envelope.signatureHex !== 'string' ||
    envelope.signatureHex.length !== 128 ||
    !hexPattern.test(envelope.signatureHex)
  ) {
    throw new Error('invalid envelope')
  }
  return envelope as unknown as E2eeEnvelope
}

function signedBytes(envelope: E2eeEnvelope): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    [
      envelope.sessionId,
      envelope.deviceId,
      envelope.epoch,
      envelope.counter,
      envelope.nonceHex,
      envelope.ciphertextHex,
    ].join('|'),
  )
}

export async function verifyEnvelopeSignature(
  envelope: E2eeEnvelope,
  publicKeyHex: string,
): Promise<void> {
  const key = await crypto.subtle.importKey(
    'raw',
    bytes(publicKeyHex),
    { name: 'Ed25519' },
    false,
    ['verify'],
  )
  if (
    !(await crypto.subtle.verify(
      'Ed25519',
      key,
      bytes(envelope.signatureHex),
      signedBytes(envelope),
    ))
  ) {
    throw new Error('invalid device signature')
  }
}

export class E2eeReceiver {
  readonly #devices: Set<string>
  readonly #seen = new Set<string>()
  #epoch: number

  constructor(epoch: number, devices: Iterable<string>) {
    this.#epoch = epoch
    this.#devices = new Set(devices)
  }

  rotate(epoch: number, devices: Iterable<string>): void {
    if (!Number.isSafeInteger(epoch) || epoch <= this.#epoch) {
      throw new Error('key rollback')
    }
    this.#epoch = epoch
    this.#devices.clear()
    for (const device of devices) this.#devices.add(device)
  }

  accept(value: unknown): E2eeEnvelope {
    const envelope = parseEnvelope(value)
    if (envelope.epoch !== this.#epoch) throw new Error('stale epoch')
    if (!this.#devices.has(envelope.deviceId)) {
      throw new Error('device impersonation')
    }
    const messageId = `${envelope.deviceId}:${envelope.epoch}:${envelope.counter}`
    if (this.#seen.has(messageId)) throw new Error('replay')
    if (this.#seen.has(`nonce:${envelope.nonceHex}`))
      throw new Error('nonce reuse')
    this.#seen.add(messageId)
    this.#seen.add(`nonce:${envelope.nonceHex}`)
    return envelope
  }
}

function bytes(hex: string): Uint8Array<ArrayBuffer> {
  if (!hexPattern.test(hex)) throw new Error('invalid hex')
  return Uint8Array.from(hex.match(/../g) ?? [], (byte) =>
    Number.parseInt(byte, 16),
  )
}

export async function decryptEnvelope(
  envelope: E2eeEnvelope,
  keyHex: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    bytes(keyHex),
    'AES-GCM',
    false,
    ['decrypt'],
  )
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes(envelope.nonceHex), tagLength: 128 },
      key,
      bytes(envelope.ciphertextHex),
    )
    return new TextDecoder('utf-8', { fatal: true }).decode(plaintext)
  } catch {
    throw new Error('invalid ciphertext or authentication tag')
  }
}
