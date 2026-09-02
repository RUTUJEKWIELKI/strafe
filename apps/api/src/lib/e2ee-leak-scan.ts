export type E2eeLeakSource = {
  name: 'postgresql' | 'redis' | 'search' | 'outbox' | 'logs' | 'storage'
  dump: () => Promise<
    AsyncIterable<Uint8Array | string> | Iterable<Uint8Array | string>
  >
}

export async function assertNoE2eePlaintext(
  sources: E2eeLeakSource[],
  secrets: string[],
): Promise<void> {
  const needles = secrets.map((secret) => Buffer.from(secret))
  for (const source of sources) {
    for await (const chunk of await source.dump()) {
      const haystack = Buffer.from(chunk)
      for (const needle of needles) {
        if (haystack.includes(needle)) {
          throw new Error(`E2EE plaintext leaked to ${source.name}`)
        }
      }
    }
  }
}
