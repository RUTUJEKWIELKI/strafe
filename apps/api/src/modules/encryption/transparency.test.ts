import { describe, expect, it } from 'vitest'

import { inclusionProof, leafHash, merkleRoot } from './transparency.js'

describe('key transparency tree', () => {
  it('creates a valid inclusion proof for every leaf', async () => {
    const bodies = ['first', 'second', 'third']
    const leaves = bodies.map(leafHash)
    const { verifyInclusionProof } = await import('@strafe/shared')
    for (const [index, body] of bodies.entries()) {
      await expect(
        verifyInclusionProof(
          body,
          index,
          leaves.length,
          inclusionProof(leaves, index),
          merkleRoot(leaves),
        ),
      ).resolves.toBe(true)
    }
  })

  it('changes the root when an earlier entry is changed', () => {
    expect(merkleRoot([leafHash('a'), leafHash('b')])).not.toBe(
      merkleRoot([leafHash('tampered'), leafHash('b')]),
    )
  })
})
