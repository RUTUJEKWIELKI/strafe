export const STRAFE_TOKEN_SECURITY_SCHEME = 'StrafeToken'

export function strafeTokenSecurityRequirement() {
  return [{ [STRAFE_TOKEN_SECURITY_SCHEME]: [] }]
}
