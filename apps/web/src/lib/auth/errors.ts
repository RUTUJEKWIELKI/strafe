export type AuthErrorKey =
  | 'emailTaken'
  | 'handleTaken'
  | 'invalidCredentials'
  | 'networkError'
  | 'rateLimit'
  | 'verificationError'
  | 'unexpectedError'

interface ApiFailure {
  error?: { error?: { code?: string } }
  response?: { status?: number }
}

export function authErrorKey(error: unknown): AuthErrorKey {
  const failure = error as ApiFailure
  const status = failure.response?.status
  const code = failure.error?.error?.code
  if (status === 429) return 'rateLimit'
  if (status === 401) return 'invalidCredentials'
  if (code === 'HANDLE_TAKEN') return 'handleTaken'
  if (code === 'EMAIL_TAKEN') return 'emailTaken'
  if (code === 'CAPTCHA_FAILED' || code === 'CAPTCHA_REQUIRED')
    return 'verificationError'
  if (!failure.response) return 'networkError'
  return 'unexpectedError'
}
