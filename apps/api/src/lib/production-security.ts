import { readFile } from 'node:fs/promises'

import type { AppConfig } from '../config.js'

const localOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
])

export interface JwtKey {
  kid: string
  privateKey?: string
  publicKey: string
  retireAt?: string
}

export interface JwtKeyset {
  activeKid: string
  keys: JwtKey[]
}

export async function readSecretFile(path: string): Promise<string> {
  const value = (await readFile(path, { encoding: 'utf8' })).trim()
  if (!value) throw new Error(`Secret file ${path} is empty`)
  return value
}

export async function loadJwtKeyset(path: string): Promise<JwtKeyset> {
  const parsed = JSON.parse(await readSecretFile(path)) as JwtKeyset
  const kids = new Set(parsed.keys?.map((key) => key.kid))
  const active = parsed.keys?.find((key) => key.kid === parsed.activeKid)
  if (
    !active?.privateKey ||
    !active.publicKey ||
    kids.size !== parsed.keys.length
  ) {
    throw new Error(
      'JWT keyset must have unique kids and an active asymmetric key pair',
    )
  }
  if (
    !active.privateKey.includes('PRIVATE KEY') ||
    !active.publicKey.includes('PUBLIC KEY')
  ) {
    throw new Error('JWT active key must be a PEM asymmetric key pair')
  }
  return parsed
}

export async function assertProductionSecurity(config: AppConfig) {
  if (config.NODE_ENV !== 'production') return
  const publicUrl = new URL(config.APP_PUBLIC_URL)
  if (publicUrl.protocol !== 'https:' || localOrigins.has(publicUrl.origin)) {
    throw new Error(
      'Production APP_PUBLIC_URL must be a non-local HTTPS origin',
    )
  }
  const origins = config.CORS_ORIGINS.split(',').map((value) => value.trim())
  if (
    origins.some(
      (origin) => localOrigins.has(origin) || !origin.startsWith('https://'),
    )
  ) {
    throw new Error(
      'Production CORS_ORIGINS may contain only explicit HTTPS origins',
    )
  }
  if (config.DATABASE_SSL !== 'require')
    throw new Error('Production PostgreSQL TLS is required')
  if (!config.REDIS_URL?.startsWith('rediss://'))
    throw new Error('Production Redis must use rediss://')
  if (config.S3_ENDPOINT && !config.S3_ENDPOINT.startsWith('https://')) {
    throw new Error('Production S3 endpoint must use HTTPS')
  }
  if (!config.TRUST_PROXY_CIDRS.trim())
    throw new Error('Production TRUST_PROXY_CIDRS is required')
  if (!config.AUTH_JWT_KEYSET_FILE)
    throw new Error('Production JWT keyset secret mount is required')
  await loadJwtKeyset(config.AUTH_JWT_KEYSET_FILE)
  if (config.AUTH_ACCESS_TTL_SECONDS > 900)
    throw new Error('Production access-token TTL may not exceed 15 minutes')
  if (config.METRICS_ENABLED && !config.METRICS_BEARER_TOKEN_FILE) {
    throw new Error(
      'Production metrics must be disabled or protected by a secret-mounted token',
    )
  }
}
