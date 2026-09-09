import type { CurrentUser } from '@strafe/shared'
import { createSignal } from 'solid-js'

import { api, notifyLocalLogout, setApiAccessToken } from '../api/client.js'
import { changeLanguage } from '../i18n/i18n.js'

const storageKey = 'strafe.session'

interface StoredSession {
  refreshToken: string
}

interface AuthTokens {
  accessToken: string
  deviceId?: string
  refreshToken: string
}

export const [currentUser, setCurrentUser] = createSignal<CurrentUser | null>(
  null,
)
export const [sessionReady, setSessionReady] = createSignal(false)
export const [currentDeviceId, setCurrentDeviceId] = createSignal<
  string | null
>(null)

function savedSession(): StoredSession | null {
  try {
    const value = sessionStorage.getItem(storageKey)
    return value ? (JSON.parse(value) as StoredSession) : null
  } catch {
    return null
  }
}

function applySession(tokens: AuthTokens, user: CurrentUser): void {
  setApiAccessToken(tokens.accessToken)
  setCurrentUser(user)
  setCurrentDeviceId(tokens.deviceId ?? null)
  sessionStorage.setItem(
    storageKey,
    JSON.stringify({
      refreshToken: tokens.refreshToken,
    } satisfies StoredSession),
  )
}

async function syncAccountLocale(): Promise<void> {
  const result = await api.GET('/api/users/@me/settings')
  if (
    result.data &&
    (result.data.locale === 'en' || result.data.locale === 'pl')
  ) {
    await changeLanguage(result.data.locale)
  }
}

export async function login(email: string, password: string) {
  const result = await api.POST('/api/auth/login', {
    body: { email, password },
  })
  if (!result.data) throw result
  applySession(result.data.tokens, result.data.user)
  await syncAccountLocale()
  return result.data.user
}

export async function register(input: {
  birthDate: string
  captchaToken?: string
  displayName: string
  email: string
  handle: string
  locale: 'en' | 'pl'
  password: string
}) {
  const result = await api.POST('/api/auth/register', { body: input })
  if (!result.data) throw result
  applySession(result.data.tokens, result.data.user)
  return result.data.user
}

export async function restoreSession(): Promise<void> {
  const saved = savedSession()
  if (!saved) {
    setSessionReady(true)
    return
  }
  try {
    const result = await api.POST('/api/auth/refresh', {
      body: { refreshToken: saved.refreshToken },
    })
    if (!result.data) throw result
    applySession(result.data.tokens, result.data.user)
    await syncAccountLocale()
  } catch {
    sessionStorage.removeItem(storageKey)
    setApiAccessToken(null)
    setCurrentDeviceId(null)
  } finally {
    setSessionReady(true)
  }
}

export async function logout(): Promise<void> {
  const saved = savedSession()
  try {
    if (saved) {
      await api.POST('/api/auth/logout', {
        body: { refreshToken: saved.refreshToken },
      })
    }
  } finally {
    notifyLocalLogout()
    sessionStorage.removeItem(storageKey)
    setApiAccessToken(null)
    setCurrentUser(null)
    setCurrentDeviceId(null)
  }
}

export async function checkHandleAvailability(handle: string) {
  const result = await api.GET('/api/auth/handle-availability', {
    params: { query: { handle } },
  })
  if (!result.data) throw result
  return result.data
}

export async function saveAccountLocale(locale: 'en' | 'pl'): Promise<void> {
  const result = await api.PATCH('/api/users/@me/settings', {
    body: { locale },
  })
  if (result.error) throw result
}
