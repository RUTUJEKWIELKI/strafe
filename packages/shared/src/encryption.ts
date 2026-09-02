import type { TransparencyCheckpoint } from './contracts/encryption.js'

const encoder = new TextEncoder()

function bytes(value: string): Uint8Array {
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/'))
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function base64url(value: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(value)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

async function digest(prefix: number, ...parts: Uint8Array[]): Promise<string> {
  const length = 1 + parts.reduce((sum, part) => sum + part.length, 0)
  const input = new Uint8Array(length)
  input[0] = prefix
  let offset = 1
  for (const part of parts) {
    input.set(part, offset)
    offset += part.length
  }
  return base64url(await crypto.subtle.digest('SHA-256', input))
}

export const hashTransparencyLeaf = (body: string) =>
  digest(0, encoder.encode(body))

/** Verifies an RFC 6962-style inclusion path. Rejecting false is mandatory. */
export async function verifyInclusionProof(
  body: string,
  leafIndex: number,
  treeSize: number,
  proof: string[],
  expectedRoot: string,
): Promise<boolean> {
  if (leafIndex < 0 || leafIndex >= treeSize) return false
  let hash = await hashTransparencyLeaf(body)
  let index = leafIndex
  let last = treeSize - 1
  for (const sibling of proof) {
    hash =
      index % 2 === 1 || index === last
        ? await digest(1, bytes(sibling), bytes(hash))
        : await digest(1, bytes(hash), bytes(sibling))
    index = Math.floor(index / 2)
    last = Math.floor(last / 2)
  }
  return hash === expectedRoot
}

export async function verifyCheckpoint(
  checkpoint: TransparencyCheckpoint,
  logPublicKey: JsonWebKey,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'jwk',
    logPublicKey,
    { name: 'Ed25519' },
    false,
    ['verify'],
  )
  return crypto.subtle.verify(
    'Ed25519',
    key,
    bytes(checkpoint.signature).buffer as ArrayBuffer,
    encoder.encode(`${checkpoint.size}:${checkpoint.rootHash}`),
  )
}

async function rootFromLeafHashes(leaves: string[]): Promise<string> {
  let level = [...leaves]
  if (!level.length)
    return base64url(await crypto.subtle.digest('SHA-256', new Uint8Array()))
  while (level.length > 1) {
    const next: string[] = []
    for (let index = 0; index < level.length; index += 2) {
      const right = level[index + 1]
      next.push(
        right
          ? await digest(1, bytes(level[index]!), bytes(right))
          : level[index]!,
      )
    }
    level = next
  }
  return level[0]!
}

/** Verifies the log's explicit append-only consistency witness. */
export async function verifyConsistencyProof(
  previous: TransparencyCheckpoint,
  current: TransparencyCheckpoint,
  leafHashes: string[],
): Promise<boolean> {
  if (previous.size > current.size || leafHashes.length !== current.size)
    return false
  return (
    (await rootFromLeafHashes(leafHashes.slice(0, previous.size))) ===
      previous.rootHash &&
    (await rootFromLeafHashes(leafHashes)) === current.rootHash
  )
}

/** Stable cross-client comparison value; format as groups or encode as QR. */
export async function createSafetyNumber(
  firstUserId: string,
  firstIdentityKey: string,
  secondUserId: string,
  secondIdentityKey: string,
): Promise<{ digits: string; qrPayload: string }> {
  const identities = [
    [firstUserId, firstIdentityKey],
    [secondUserId, secondIdentityKey],
  ].sort(([left], [right]) => left!.localeCompare(right!))
  const canonical = JSON.stringify(identities)
  const hash = new Uint8Array(
    await crypto.subtle.digest('SHA-256', encoder.encode(canonical)),
  )
  const digits = Array.from(hash.slice(0, 15), (value) =>
    String(value % 100).padStart(2, '0'),
  ).join(' ')
  return {
    digits,
    qrPayload: `strafe-safety:v1:${base64url(encoder.encode(canonical).buffer)}`,
  }
}

export interface TrustedIdentity {
  fingerprint: string
  verifiedAt: string
}

/** A changed verified key is never silently trusted; callers must block sending. */
export function requireUnchangedIdentity(
  trusted: TrustedIdentity | undefined,
  observedFingerprint: string,
): 'new' | 'verified' {
  if (!trusted) return 'new'
  if (trusted.fingerprint !== observedFingerprint) {
    throw new Error('SAFETY_NUMBER_CHANGED')
  }
  return 'verified'
}
