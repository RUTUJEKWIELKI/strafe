import { describe, expect, it } from 'vitest'

import manifest from '../../../../security/e2ee-release.json'
import {
  assertE2eeReleaseGate,
  type E2eeReleaseManifest,
} from './e2ee-release.js'

describe('E2EE stable release gate', () => {
  it('keeps the unaudited implementation experimental', () => {
    expect(manifest.status).toBe('experimental')
    expect(() =>
      assertE2eeReleaseGate(manifest as E2eeReleaseManifest),
    ).not.toThrow()
  })

  it('rejects a stable declaration without independent audit evidence', () => {
    expect(() =>
      assertE2eeReleaseGate({ status: 'stable', independentAudit: null }),
    ).toThrow('independent audit')
  })
})
