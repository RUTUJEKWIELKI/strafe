import { describe, expect, it } from 'vitest'

import { installGlobalTwemoji } from './twemoji.js'

describe('global Twemoji rendering', () => {
  it('replaces emoji in existing and dynamically added text', async () => {
    const root = document.createElement('div')
    root.textContent = 'Hello 👋'
    const cleanup = installGlobalTwemoji(root)
    expect(root.querySelector('img.twemoji')?.getAttribute('alt')).toBe('👋')

    const message = document.createElement('p')
    message.textContent = 'Secure 🔒'
    root.append(message)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(message.querySelector('img.twemoji')?.getAttribute('alt')).toBe('🔒')
    cleanup()
  })
})
