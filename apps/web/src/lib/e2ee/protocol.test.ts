import { describe, expect, it } from 'vitest'

import fixtureJson from '../../../../../packages/shared/test-vectors/e2ee-v1.json'
import {
  decryptEnvelope,
  E2eeReceiver,
  parseEnvelope,
  verifyEnvelopeSignature,
} from './protocol'

interface VectorFile {
  keyHex: string
  sessionId: string
  signingPublicKeyHex: string
  vectors: Array<{
    name: string
    deviceId: string
    epoch: number
    counter: number
    nonceHex: string
    plaintext: string
    ciphertextHex: string
    signatureHex: string
  }>
}

const fixture = fixtureJson as VectorFile
const envelope = (index: number) => ({
  version: 1 as const,
  sessionId: fixture.sessionId,
  ...fixture.vectors[index]!,
})

describe('web–Tauri E2EE interoperability vectors', () => {
  it('decrypts every shared Rust/TypeScript vector', async () => {
    for (let index = 0; index < fixture.vectors.length; index += 1) {
      expect(await decryptEnvelope(envelope(index), fixture.keyHex)).toBe(
        fixture.vectors[index]!.plaintext,
      )
      await expect(
        verifyEnvelopeSignature(envelope(index), fixture.signingPublicKeyHex),
      ).resolves.toBeUndefined()
    }
  })

  it('accepts out-of-order and lost messages and rotates membership/devices', () => {
    const receiver = new E2eeReceiver(1, ['alice-phone'])
    receiver.accept(envelope(0))
    receiver.accept(envelope(1))
    receiver.accept(envelope(2))
    receiver.rotate(2, ['alice-phone'])
    receiver.accept(envelope(3))
    receiver.rotate(3, ['alice-phone', 'alice-laptop'])
    receiver.accept(envelope(4))
    receiver.rotate(4, ['alice-phone'])
    receiver.accept(envelope(5))
  })

  it('rejects replay, nonce reuse, rollback, stale epoch and device impersonation', () => {
    const receiver = new E2eeReceiver(1, ['alice-phone'])
    receiver.accept(envelope(0))
    expect(() => receiver.accept(envelope(0))).toThrow('replay')
    expect(() =>
      receiver.accept({ ...envelope(1), nonceHex: envelope(0).nonceHex }),
    ).toThrow('nonce reuse')
    expect(() => receiver.rotate(1, ['alice-phone'])).toThrow('key rollback')
    receiver.rotate(2, ['alice-phone'])
    expect(() => receiver.accept(envelope(1))).toThrow('stale epoch')
    expect(() =>
      receiver.accept({ ...envelope(3), deviceId: 'mallory-device' }),
    ).toThrow('device impersonation')
  })

  it('rejects a modified ciphertext and malformed envelopes', async () => {
    const changed = {
      ...envelope(0),
      ciphertextHex: `ff${envelope(0).ciphertextHex.slice(2)}`,
    }
    await expect(decryptEnvelope(changed, fixture.keyHex)).rejects.toThrow(
      'invalid ciphertext',
    )
    await expect(
      verifyEnvelopeSignature(
        {
          ...envelope(0),
          signatureHex: `ff${envelope(0).signatureHex.slice(2)}`,
        },
        fixture.signingPublicKeyHex,
      ),
    ).rejects.toThrow('invalid device signature')
    expect(() => parseEnvelope({ version: 1 })).toThrow('invalid envelope')
  })
})
