import { describe, expect, it } from 'vitest'

import {
  AllPermissions,
  applyOverwrite,
  hasPermission,
  Permission,
  resolveChannelPermissions,
} from '../../dist/lib/permissions.js'

describe('permission resolution', () => {
  it('applies deny before allow in a single overwrite', () => {
    const base = Permission.ViewChannel | Permission.SendMessages
    const resolved = applyOverwrite(
      base,
      Permission.ReadMessageHistory,
      Permission.SendMessages,
    )

    expect(hasPermission(resolved, Permission.ViewChannel)).toBe(true)
    expect(hasPermission(resolved, Permission.SendMessages)).toBe(false)
    expect(hasPermission(resolved, Permission.ReadMessageHistory)).toBe(true)
  })

  it('grants every permission to administrators', () => {
    expect(hasPermission(Permission.Administrator, Permission.BanMembers)).toBe(
      true,
    )
    expect(hasPermission(AllPermissions, Permission.ManageServer)).toBe(true)
  })

  it('applies everyone, combined roles, and member overwrites in order', () => {
    const resolved = resolveChannelPermissions(
      Permission.ViewChannel,
      { allowBits: Permission.SendMessages, denyBits: 0n },
      [{ allowBits: 0n, denyBits: Permission.SendMessages }],
      { allowBits: Permission.SendMessages, denyBits: 0n },
    )

    expect(hasPermission(resolved, Permission.ViewChannel)).toBe(true)
    expect(hasPermission(resolved, Permission.SendMessages)).toBe(true)
    expect(
      hasPermission(
        resolveChannelPermissions(
          Permission.ViewChannel,
          { allowBits: Permission.SendMessages, denyBits: 0n },
          [{ allowBits: 0n, denyBits: Permission.SendMessages }],
          undefined,
        ),
        Permission.SendMessages,
      ),
    ).toBe(false)
  })
})
