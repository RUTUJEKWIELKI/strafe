import type { CreateReportBody } from '@strafe/shared'

type Evidence = NonNullable<CreateReportBody['encryptedEvidence']>
type ReportedMessage = Evidence['message']

function canonicalMessage(message: ReportedMessage): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(
    JSON.stringify({
      authorId: message.authorId,
      channelId: message.channelId,
      content: message.content,
      createdAt: message.createdAt,
      id: message.id,
    }),
  )
}

function base64(bytes: ArrayBuffer): string {
  return btoa(String.fromCodePoint(...new Uint8Array(bytes)))
}

/** Builds only the explicitly selected fragment; no channel key or history is sent. */
export async function createEncryptedReportEvidence(
  message: ReportedMessage,
  context: ReportedMessage[],
  authorSigningKey: CryptoKey,
  authorPublicKey: CryptoKey,
): Promise<Evidence> {
  if (context.length > 20)
    throw new Error('Report context is limited to 20 messages')
  const [signature, publicKey] = await Promise.all([
    crypto.subtle.sign('Ed25519', authorSigningKey, canonicalMessage(message)),
    crypto.subtle.exportKey('spki', authorPublicKey),
  ])
  return {
    context,
    cryptographicMaterial: {
      algorithm: 'Ed25519',
      authorPublicKey: base64(publicKey),
      signature: base64(signature),
    },
    message,
  }
}
