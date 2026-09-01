export const Permission = {
  ViewChannel: 1n << 0n,
  SendMessages: 1n << 1n,
  ReadMessageHistory: 1n << 2n,
  ManageMessages: 1n << 3n,
  AddReactions: 1n << 4n,
  ConnectVoice: 1n << 5n,
  SpeakVoice: 1n << 6n,
  MuteMembers: 1n << 7n,
  MoveMembers: 1n << 8n,
  ManageChannels: 1n << 9n,
  ManageRoles: 1n << 10n,
  CreateInvites: 1n << 11n,
  KickMembers: 1n << 12n,
  BanMembers: 1n << 13n,
  ViewAuditLog: 1n << 14n,
  ManageServer: 1n << 15n,
  ManageReports: 1n << 16n,
  ManageAutomod: 1n << 17n,
  ManageModerationCases: 1n << 18n,
  Administrator: 1n << 62n,
} as const

export const AllPermissions = (1n << 63n) - 1n

export const DefaultMemberPermissions =
  Permission.ViewChannel |
  Permission.SendMessages |
  Permission.ReadMessageHistory |
  Permission.AddReactions |
  Permission.ConnectVoice |
  Permission.SpeakVoice |
  Permission.CreateInvites

export function hasPermission(granted: bigint, required: bigint): boolean {
  return (
    (granted & Permission.Administrator) !== 0n ||
    (granted & required) === required
  )
}

export function applyOverwrite(
  permissions: bigint,
  allow: bigint,
  deny: bigint,
): bigint {
  return (permissions & ~deny) | allow
}

interface PermissionOverwriteBits {
  allowBits: bigint
  denyBits: bigint
}

export function resolveChannelPermissions(
  basePermissions: bigint,
  defaultRoleOverwrite: PermissionOverwriteBits | undefined,
  roleOverwrites: PermissionOverwriteBits[],
  memberOverwrite: PermissionOverwriteBits | undefined,
): bigint {
  let permissions = basePermissions
  if (defaultRoleOverwrite) {
    permissions = applyOverwrite(
      permissions,
      defaultRoleOverwrite.allowBits,
      defaultRoleOverwrite.denyBits,
    )
  }

  permissions = applyOverwrite(
    permissions,
    roleOverwrites.reduce((bits, overwrite) => bits | overwrite.allowBits, 0n),
    roleOverwrites.reduce((bits, overwrite) => bits | overwrite.denyBits, 0n),
  )
  if (memberOverwrite) {
    permissions = applyOverwrite(
      permissions,
      memberOverwrite.allowBits,
      memberOverwrite.denyBits,
    )
  }
  return permissions
}

export function parsePermissionBits(value: string): bigint {
  const bits = BigInt(value)
  if (bits < 0n || bits > AllPermissions) {
    throw new RangeError('Permission bit field is outside the supported range')
  }
  return bits
}
