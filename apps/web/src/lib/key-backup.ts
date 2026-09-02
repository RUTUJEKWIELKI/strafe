import type { KeyBackupEnvelope, KeyBackupKdf } from '@strafe/shared'
import { argon2id } from 'hash-wasm'

export const RECOVERY_CODE_WARNING =
  'Zapisz kod odzyskiwania poza tym urządzeniem. Strafe go nie zna i nie może go odtworzyć. Utrata kodu oraz wszystkich zatwierdzonych urządzeń może oznaczać bezpowrotną utratę historii.'

const defaultKdf: Omit<KeyBackupKdf, 'salt'> = {
  algorithm: 'argon2id',
  iterations: 3,
  memoryKiB: 65_536,
  parallelism: 1,
}

const encoder = new TextEncoder()
const decoder = new TextDecoder(undefined, { fatal: true })

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '')
}

function fromBase64url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(
    normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='),
  )
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function aad(
  envelope: Omit<KeyBackupEnvelope, 'ciphertext'>,
): Uint8Array<ArrayBuffer> {
  return encoder.encode(
    JSON.stringify([
      'strafe-key-backup-v1',
      envelope.version,
      envelope.previousDigest,
      envelope.identityKeyFingerprint,
      envelope.deviceId,
      envelope.createdAt,
      envelope.aead,
      envelope.nonce,
      envelope.kdf.algorithm,
      envelope.kdf.memoryKiB,
      envelope.kdf.iterations,
      envelope.kdf.parallelism,
      envelope.kdf.salt,
    ]),
  )
}

async function deriveKey(
  recoveryCode: string,
  kdf: KeyBackupKdf,
): Promise<CryptoKey> {
  const raw = await argon2id({
    hashLength: 32,
    iterations: kdf.iterations,
    memorySize: kdf.memoryKiB,
    outputType: 'binary',
    parallelism: kdf.parallelism,
    password: encoder.encode(recoveryCode),
    salt: fromBase64url(kdf.salt),
  })
  const keyBytes = Uint8Array.from(raw)
  try {
    return await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, [
      'decrypt',
      'encrypt',
    ])
  } finally {
    raw.fill(0)
    keyBytes.fill(0)
  }
}

export function generateRecoveryCode(): string {
  const entropy = crypto.getRandomValues(new Uint8Array(32))
  const encoded = [...entropy]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  entropy.fill(0)
  return `STRAFE-${encoded.match(/.{1,5}/gu)?.join('-') ?? encoded}`
}

export async function digestKeyBackup(
  envelope: KeyBackupEnvelope,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(
      JSON.stringify([
        base64url(
          aad({
            aead: envelope.aead,
            createdAt: envelope.createdAt,
            deviceId: envelope.deviceId,
            identityKeyFingerprint: envelope.identityKeyFingerprint,
            kdf: envelope.kdf,
            nonce: envelope.nonce,
            previousDigest: envelope.previousDigest,
            version: envelope.version,
          }),
        ),
        envelope.ciphertext,
      ]),
    ),
  )
  return base64url(new Uint8Array(digest))
}

export async function encryptKeyBackup(input: {
  createdAt?: string
  deviceId: string
  identityKeyFingerprint: string
  keys: unknown
  previousBackup: KeyBackupEnvelope | null
  recoveryCode: string
}): Promise<KeyBackupEnvelope> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const kdf = { ...defaultKdf, salt: base64url(salt) }
  const unsigned = {
    aead: 'aes-256-gcm' as const,
    createdAt: input.createdAt ?? new Date().toISOString(),
    deviceId: input.deviceId,
    identityKeyFingerprint: input.identityKeyFingerprint,
    kdf,
    nonce: base64url(nonce),
    previousDigest: input.previousBackup
      ? await digestKeyBackup(input.previousBackup)
      : null,
    version: (input.previousBackup?.version ?? 0) + 1,
  }
  const key = await deriveKey(input.recoveryCode, kdf)
  const plaintext = encoder.encode(JSON.stringify(input.keys))
  try {
    const ciphertext = await crypto.subtle.encrypt(
      { additionalData: aad(unsigned), iv: nonce, name: 'AES-GCM' },
      key,
      plaintext,
    )
    return { ...unsigned, ciphertext: base64url(new Uint8Array(ciphertext)) }
  } finally {
    plaintext.fill(0)
    salt.fill(0)
    nonce.fill(0)
  }
}

export async function decryptKeyBackup<T>(
  envelope: KeyBackupEnvelope,
  recoveryCode: string,
): Promise<T> {
  const { ciphertext, ...unsigned } = envelope
  const key = await deriveKey(recoveryCode, envelope.kdf)
  const plaintext = await crypto.subtle.decrypt(
    {
      additionalData: aad(unsigned),
      iv: fromBase64url(envelope.nonce),
      name: 'AES-GCM',
    },
    key,
    fromBase64url(ciphertext),
  )
  const bytes = new Uint8Array(plaintext)
  try {
    return JSON.parse(decoder.decode(bytes)) as T
  } finally {
    bytes.fill(0)
  }
}

export async function assertNoBackupRollback(
  received: KeyBackupEnvelope,
  pinned: { digest: string; version: number } | null,
): Promise<void> {
  if (!pinned) return
  if (received.version < pinned.version) {
    throw new Error('KEY_BACKUP_ROLLBACK: server returned an older version')
  }
  if (
    received.version === pinned.version &&
    (await digestKeyBackup(received)) !== pinned.digest
  ) {
    throw new Error('KEY_BACKUP_ROLLBACK: backup changed at a pinned version')
  }
}
