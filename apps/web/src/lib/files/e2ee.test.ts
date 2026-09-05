import { describe, expect, it } from 'vitest'

import {
  ciphertextSize,
  decryptEncryptedBlob,
  E2EE_HEADER_SIZE_BYTES,
  E2EE_TAG_SIZE_BYTES,
  encryptFileForUpload,
  validateFile,
} from './e2ee'

describe('E2EE file preparation', () => {
  it('accounts for one authentication tag per independently encrypted chunk', () => {
    expect(ciphertextSize(10, 4)).toBe(
      E2EE_HEADER_SIZE_BYTES + 10 + 3 * E2EE_TAG_SIZE_BYTES,
    )
  })

  it('warns about executable-looking files before encryption', () => {
    const file = new File(['x'], 'invoice.pdf.exe', {
      type: 'application/octet-stream',
    })
    expect(
      validateFile(file, {
        allowedMimeTypes: new Set(['application/octet-stream']),
        maxPlaintextBytes: 10,
      }),
    ).toHaveLength(1)
  })

  it('round-trips authenticated chunks without exposing metadata in the body', async () => {
    const file = new File(['private contents'], 'private.txt', {
      type: 'text/plain',
    })
    const encrypted = await encryptFileForUpload(
      file,
      {
        allowedMimeTypes: new Set(['text/plain']),
        maxPlaintextBytes: 100,
      },
      undefined,
      65_536,
    )
    const chunks = []
    for await (const chunk of decryptEncryptedBlob(
      encrypted.body,
      encrypted.metadata.fileKey,
    ))
      chunks.push(chunk)
    expect(new TextDecoder().decode(chunks[0])).toBe('private contents')
    expect(await encrypted.body.text()).not.toContain('private.txt')
    expect(encrypted.ciphertextSizeBytes).toBe(
      ciphertextSize(file.size, 65_536),
    )
  })
})
