import { createHash } from 'node:crypto'

const encode = (value: Buffer) => value.toString('base64url')
const nodeHash = (left: Buffer, right: Buffer) =>
  createHash('sha256')
    .update(Buffer.concat([Buffer.of(1), left, right]))
    .digest()

export const leafHash = (body: string) =>
  encode(
    createHash('sha256')
      .update(Buffer.concat([Buffer.of(0), Buffer.from(body)]))
      .digest(),
  )

export function merkleRoot(leaves: string[]): string {
  if (leaves.length === 0)
    return encode(createHash('sha256').update(Buffer.alloc(0)).digest())
  let level: Buffer<ArrayBufferLike>[] = leaves.map((leaf) =>
    Buffer.from(leaf, 'base64url'),
  )
  while (level.length > 1) {
    const next: Buffer[] = []
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index]!
      const right = level[index + 1]
      next.push(right ? nodeHash(left, right) : left)
    }
    level = next
  }
  return encode(level[0]!)
}

export function inclusionProof(leaves: string[], leafIndex: number): string[] {
  const proof: string[] = []
  let index = leafIndex
  let level: Buffer<ArrayBufferLike>[] = leaves.map((leaf) =>
    Buffer.from(leaf, 'base64url'),
  )
  while (level.length > 1) {
    const sibling = index % 2 === 0 ? index + 1 : index - 1
    if (sibling < level.length) proof.push(encode(level[sibling]!))
    const next: Buffer[] = []
    for (let cursor = 0; cursor < level.length; cursor += 2) {
      const right = level[cursor + 1]
      next.push(right ? nodeHash(level[cursor]!, right) : level[cursor]!)
    }
    index = Math.floor(index / 2)
    level = next
  }
  return proof
}
