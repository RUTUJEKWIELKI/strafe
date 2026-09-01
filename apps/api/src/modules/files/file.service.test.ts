import { describe, expect, it } from 'vitest'

import { isMimeAllowed } from '../../../dist/modules/files/file.service.js'

describe('file MIME policy', () => {
  it('allows only purpose-specific MIME types', () => {
    expect(isMimeAllowed('avatar', 'image/png')).toBe(true)
    expect(isMimeAllowed('avatar', 'image/gif')).toBe(false)
    expect(isMimeAllowed('attachment', 'application/pdf')).toBe(true)
    expect(isMimeAllowed('attachment', 'application/x-msdownload')).toBe(false)
  })

  it('normalizes MIME casing and rejects unknown purposes', () => {
    expect(isMimeAllowed('emoji', 'IMAGE/WEBP')).toBe(true)
    expect(isMimeAllowed('unknown', 'image/png')).toBe(false)
  })
})
