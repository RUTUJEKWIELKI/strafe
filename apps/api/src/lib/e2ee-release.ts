export interface E2eeReleaseManifest {
  status: 'experimental' | 'stable'
  independentAudit: null | {
    auditor: string
    completedAt: string
    commit: string
    report: string
    unresolvedCritical: number
    unresolvedHigh: number
  }
}

export function assertE2eeReleaseGate(manifest: E2eeReleaseManifest): void {
  if (manifest.status !== 'stable') return
  const audit = manifest.independentAudit
  if (
    !audit ||
    !audit.auditor.trim() ||
    !audit.completedAt.trim() ||
    !audit.commit.trim() ||
    !audit.report.trim() ||
    audit.unresolvedCritical !== 0 ||
    audit.unresolvedHigh !== 0
  ) {
    throw new Error('stable E2EE requires a completed independent audit')
  }
}
