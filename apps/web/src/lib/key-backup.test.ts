import { describe, expect, it } from 'vitest'

import {
  assertNoBackupRollback,
  decryptKeyBackup,
  digestKeyBackup,
  encryptKeyBackup,
  generateRecoveryCode,
} from './key-backup'

const deviceId = '0198a706-92be-7000-8000-000000000001'

describe('client-side key backup', () => {
  it('round-trips keys and rejects an incorrect recovery code', async () => {
    const recoveryCode = generateRecoveryCode()
    const envelope = await encryptKeyBackup({
      createdAt: '2026-09-02T12:00:00.000Z',
      deviceId,
      identityKeyFingerprint: 'sha256:current-identity-key',
      keys: { roomKey: 'private material' },
      previousBackup: null,
      recoveryCode,
    })

    expect(envelope.ciphertext).not.toContain('private material')
    await expect(decryptKeyBackup(envelope, recoveryCode)).resolves.toEqual({
      roomKey: 'private material',
    })
    await expect(
      decryptKeyBackup(envelope, generateRecoveryCode()),
    ).rejects.toThrow()
  })

  it('detects an older or replaced pinned backup', async () => {
    const recoveryCode = generateRecoveryCode()
    const envelope = await encryptKeyBackup({
      deviceId,
      identityKeyFingerprint: 'sha256:current-identity-key',
      keys: {},
      previousBackup: null,
      recoveryCode,
    })
    const digest = await digestKeyBackup(envelope)

    await expect(
      assertNoBackupRollback(
        { ...envelope, version: 0 },
        { digest, version: 1 },
      ),
    ).rejects.toThrow('KEY_BACKUP_ROLLBACK')
    await expect(
      assertNoBackupRollback(
        { ...envelope, ciphertext: `${envelope.ciphertext}A` },
        { digest, version: 1 },
      ),
    ).rejects.toThrow('KEY_BACKUP_ROLLBACK')
  })
})
