import { describe, expect, it } from 'vitest'

import { assertNoE2eePlaintext, type E2eeLeakSource } from './e2ee-leak-scan.js'

const components: E2eeLeakSource['name'][] = [
  'postgresql',
  'redis',
  'search',
  'outbox',
  'logs',
  'storage',
]
const sources = (value: string): E2eeLeakSource[] =>
  components.map((name) => ({
    name,
    dump: async () => [Buffer.from(value)],
  }))

describe('E2EE infrastructure plaintext control', () => {
  it('scans every persistence and observability component', async () => {
    await expect(
      assertNoE2eePlaintext(sources('opaque:cafebabe'), [
        'known plaintext 9d726',
        'tax-return-secret.pdf',
      ]),
    ).resolves.toBeUndefined()
  })

  it.each(components)('identifies a leak in %s', async (component) => {
    const input = sources('opaque')
    input.find(({ name }) => name === component)!.dump = async () => [
      'tax-return-secret.pdf',
    ]
    await expect(
      assertNoE2eePlaintext(input, ['tax-return-secret.pdf']),
    ).rejects.toThrow(component)
  })
})
