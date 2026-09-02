export const E2EE_CHUNK_SIZE_BYTES = 4 * 1024 * 1024
export const E2EE_HEADER_SIZE_BYTES = 29
export const E2EE_TAG_SIZE_BYTES = 16

const magic = new TextEncoder().encode('STRAFE01')
const dangerousExtensions = new Set([
  'app',
  'bat',
  'cmd',
  'com',
  'cpl',
  'exe',
  'hta',
  'jar',
  'js',
  'jse',
  'lnk',
  'msi',
  'ps1',
  'scr',
  'vbs',
  'vbe',
  'wsf',
])

export interface EncryptedFileMetadata {
  algorithm: 'AES-256-GCM-CHUNKED-v1'
  fileKey: string
  mimeType: string
  name: string
  plaintextSha256: string
  plaintextSizeBytes: number
  preview?: Record<string, unknown>
}

export interface EncryptedFileUpload {
  body: Blob
  chunkSizeBytes: number
  ciphertextSizeBytes: number
  metadata: EncryptedFileMetadata
  warnings: string[]
}

export interface FilePolicy {
  allowedMimeTypes: ReadonlySet<string>
  maxPlaintextBytes: number
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function nonce(prefix: Uint8Array, index: number): Uint8Array<ArrayBuffer> {
  const value = new Uint8Array(12)
  value.set(prefix)
  new DataView(value.buffer).setUint32(8, index, false)
  return value
}

function header(
  chunkSize: number,
  prefix: Uint8Array,
  size: number,
): Uint8Array<ArrayBuffer> {
  const value = new Uint8Array(E2EE_HEADER_SIZE_BYTES)
  value.set(magic)
  value[8] = 1
  const view = new DataView(value.buffer)
  view.setUint32(9, chunkSize, false)
  value.set(prefix, 13)
  view.setBigUint64(21, BigInt(size), false)
  return value
}

export function ciphertextSize(
  plaintextSize: number,
  chunkSize: number,
): number {
  return (
    E2EE_HEADER_SIZE_BYTES +
    plaintextSize +
    Math.ceil(plaintextSize / chunkSize) * E2EE_TAG_SIZE_BYTES
  )
}

export function validateFile(file: File, policy: FilePolicy): string[] {
  if (file.size <= 0) throw new Error('Empty files cannot be uploaded')
  if (file.size > policy.maxPlaintextBytes)
    throw new Error('File exceeds the upload limit')
  if (!policy.allowedMimeTypes.has(file.type.toLowerCase()))
    throw new Error('This file type is not allowed')
  const extension = file.name.split('.').at(-1)?.toLowerCase()
  return extension && dangerousExtensions.has(extension)
    ? ['This file type can execute code. Open it only if you trust the sender.']
    : []
}

/** Encrypt before upload. Only `body`, its size and chunk size may be sent to the file API. */
export async function encryptFileForUpload(
  file: File,
  policy: FilePolicy,
  preview?: Record<string, unknown>,
  chunkSizeBytes = E2EE_CHUNK_SIZE_BYTES,
): Promise<EncryptedFileUpload> {
  if (chunkSizeBytes < 65_536 || chunkSizeBytes > 67_108_864)
    throw new Error('Invalid encryption chunk size')
  const warnings = validateFile(file, policy)
  const keyBytes = crypto.getRandomValues(new Uint8Array(32))
  const noncePrefix = crypto.getRandomValues(new Uint8Array(8))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, [
    'encrypt',
  ])
  const parts: BlobPart[] = [
    header(chunkSizeBytes, noncePrefix, file.size).buffer,
  ]
  for (
    let offset = 0, index = 0;
    offset < file.size;
    offset += chunkSizeBytes, index += 1
  ) {
    const plaintext = await file
      .slice(offset, offset + chunkSizeBytes)
      .arrayBuffer()
    parts.push(
      await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce(noncePrefix, index) },
        key,
        plaintext,
      ),
    )
  }
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', await file.arrayBuffer()),
  )
  const body = new Blob(parts, { type: 'application/octet-stream' })
  return {
    body,
    chunkSizeBytes,
    ciphertextSizeBytes: body.size,
    metadata: {
      algorithm: 'AES-256-GCM-CHUNKED-v1',
      fileKey: base64(keyBytes),
      mimeType: file.type || 'application/octet-stream',
      name: file.name,
      plaintextSha256: base64(digest),
      plaintextSizeBytes: file.size,
      ...(preview ? { preview } : {}),
    },
    warnings,
  }
}

/** Authenticate and release one plaintext chunk at a time after download. */
export async function* decryptEncryptedBlob(
  body: Blob,
  fileKey: string,
): AsyncGenerator<Uint8Array> {
  const encodedHeader = new Uint8Array(
    await body.slice(0, E2EE_HEADER_SIZE_BYTES).arrayBuffer(),
  )
  if (
    encodedHeader.length !== E2EE_HEADER_SIZE_BYTES ||
    !magic.every((byte, index) => encodedHeader[index] === byte) ||
    encodedHeader[8] !== 1
  )
    throw new Error('Unsupported encrypted file format')
  const view = new DataView(encodedHeader.buffer)
  const chunkSize = view.getUint32(9, false)
  const prefix = new Uint8Array(encodedHeader.slice(13, 21))
  const plaintextSize = Number(view.getBigUint64(21, false))
  if (body.size !== ciphertextSize(plaintextSize, chunkSize))
    throw new Error('Encrypted file size mismatch')
  const key = await crypto.subtle.importKey(
    'raw',
    fromBase64(fileKey),
    'AES-GCM',
    false,
    ['decrypt'],
  )
  let cipherOffset = E2EE_HEADER_SIZE_BYTES
  for (
    let plaintextOffset = 0, index = 0;
    plaintextOffset < plaintextSize;
    plaintextOffset += chunkSize, index += 1
  ) {
    const length =
      Math.min(chunkSize, plaintextSize - plaintextOffset) + E2EE_TAG_SIZE_BYTES
    const encrypted = await body
      .slice(cipherOffset, cipherOffset + length)
      .arrayBuffer()
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce(prefix, index) },
      key,
      encrypted,
    )
    yield new Uint8Array(plaintext)
    cipherOffset += length
  }
}
