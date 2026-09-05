import type { FastifyEnvOptions } from '@fastify/env'

export interface AppConfig {
  APP_PUBLIC_URL: string
  AUTH_ACCESS_TTL_SECONDS: number
  AUTH_CHALLENGE_TTL_SECONDS: number
  AUTH_JWT_KEYSET_FILE?: string
  AUTH_REFRESH_TTL_SECONDS: number
  CORS_ORIGINS: string
  CLAMAV_HOST?: string
  CLAMAV_PORT: number
  DATABASE_POOL_MAX: number
  DATABASE_SSL: 'disable' | 'require'
  DATABASE_URL?: string
  FILE_MAX_SIZE_BYTES: number
  FILE_PART_SIZE_BYTES: number
  FILE_PROCESS_INTERVAL_MS: number
  FILE_SCAN_REQUIRED: boolean
  FILE_USER_QUOTA_BYTES: number
  GATEWAY_COMMANDS_PER_MINUTE: number
  GATEWAY_HEARTBEAT_GRACE_MS: number
  GATEWAY_MAX_BUFFERED_BYTES: number
  GATEWAY_MAX_FRAME_BYTES: number
  GATEWAY_MAX_SUBSCRIPTIONS: number
  HOST: string
  LOG_LEVEL: 'debug' | 'error' | 'fatal' | 'info' | 'silent' | 'trace' | 'warn'
  LIVEKIT_API_KEY?: string
  LIVEKIT_API_SECRET?: string
  LIVEKIT_URL?: string
  KEY_TRANSPARENCY_PRIVATE_KEY?: string
  MEILISEARCH_API_KEY?: string
  MEILISEARCH_HOST?: string
  METRICS_ENABLED: boolean
  METRICS_BEARER_TOKEN_FILE?: string
  NODE_ENV: 'development' | 'test' | 'production'
  OUTBOX_BATCH_SIZE: number
  OUTBOX_ENABLED: boolean
  OUTBOX_POLL_INTERVAL_MS: number
  PORT: number
  REDIS_URL?: string
  TRUST_PROXY_CIDRS: string
  REALTIME_ENABLED: boolean
  SENTRY_DSN?: string
  SESSION_TRUST_GEO_HEADERS: boolean
  SMTP_FROM?: string
  SMTP_HOST?: string
  SMTP_PASSWORD?: string
  SMTP_PORT: number
  SMTP_SECURE: boolean
  SMTP_USERNAME?: string
  TURNSTILE_SECRET_KEY?: string
  S3_ACCESS_KEY_ID?: string
  S3_BUCKET?: string
  S3_ENDPOINT?: string
  S3_FORCE_PATH_STYLE: boolean
  S3_REGION: string
  S3_SECRET_ACCESS_KEY?: string
  SERVICE_VERSION: string
  WEB_PUSH_PRIVATE_KEY?: string
  WEB_PUSH_PUBLIC_KEY?: string
  WEB_PUSH_SUBJECT: string
}

export const envOptions: FastifyEnvOptions = {
  confKey: 'config',
  dotenv: process.env.NODE_ENV !== 'test',
  schema: {
    type: 'object',
    required: [
      'APP_PUBLIC_URL',
      'AUTH_ACCESS_TTL_SECONDS',
      'AUTH_CHALLENGE_TTL_SECONDS',
      'AUTH_REFRESH_TTL_SECONDS',
      'CLAMAV_PORT',
      'CORS_ORIGINS',
      'DATABASE_POOL_MAX',
      'DATABASE_SSL',
      'FILE_MAX_SIZE_BYTES',
      'FILE_PART_SIZE_BYTES',
      'FILE_PROCESS_INTERVAL_MS',
      'FILE_SCAN_REQUIRED',
      'FILE_USER_QUOTA_BYTES',
      'GATEWAY_COMMANDS_PER_MINUTE',
      'GATEWAY_HEARTBEAT_GRACE_MS',
      'GATEWAY_MAX_BUFFERED_BYTES',
      'GATEWAY_MAX_FRAME_BYTES',
      'GATEWAY_MAX_SUBSCRIPTIONS',
      'HOST',
      'LOG_LEVEL',
      'METRICS_ENABLED',
      'NODE_ENV',
      'OUTBOX_BATCH_SIZE',
      'OUTBOX_ENABLED',
      'OUTBOX_POLL_INTERVAL_MS',
      'PORT',
      'REALTIME_ENABLED',
      'S3_FORCE_PATH_STYLE',
      'S3_REGION',
      'SESSION_TRUST_GEO_HEADERS',
      'SMTP_PORT',
      'SMTP_SECURE',
      'SERVICE_VERSION',
      'WEB_PUSH_SUBJECT',
    ],
    properties: {
      APP_PUBLIC_URL: { type: 'string', default: 'http://localhost:5173' },
      AUTH_ACCESS_TTL_SECONDS: {
        type: 'integer',
        minimum: 60,
        maximum: 86_400,
        default: 900,
      },
      AUTH_JWT_KEYSET_FILE: { type: 'string', minLength: 1 },
      AUTH_CHALLENGE_TTL_SECONDS: {
        type: 'integer',
        minimum: 300,
        maximum: 86_400,
        default: 3_600,
      },
      AUTH_REFRESH_TTL_SECONDS: {
        type: 'integer',
        minimum: 3_600,
        maximum: 31_536_000,
        default: 2_592_000,
      },
      CORS_ORIGINS: {
        type: 'string',
        default:
          'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,tauri://localhost',
      },
      CLAMAV_HOST: { type: 'string', minLength: 1 },
      CLAMAV_PORT: {
        type: 'integer',
        minimum: 1,
        maximum: 65_535,
        default: 3310,
      },
      DATABASE_POOL_MAX: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 10,
      },
      DATABASE_SSL: {
        type: 'string',
        enum: ['disable', 'require'],
        default: 'disable',
      },
      DATABASE_URL: { type: 'string', minLength: 1 },
      FILE_MAX_SIZE_BYTES: {
        type: 'integer',
        minimum: 1_048_576,
        maximum: 2_147_483_647,
        default: 104_857_600,
      },
      FILE_PART_SIZE_BYTES: {
        type: 'integer',
        minimum: 5_242_880,
        maximum: 104_857_600,
        default: 8_388_608,
      },
      FILE_PROCESS_INTERVAL_MS: {
        type: 'integer',
        minimum: 1_000,
        maximum: 300_000,
        default: 5_000,
      },
      FILE_SCAN_REQUIRED: { type: 'boolean', default: true },
      FILE_USER_QUOTA_BYTES: {
        type: 'integer',
        minimum: 1_048_576,
        maximum: 9_007_199_254_740_991,
        default: 2_147_483_648,
      },
      GATEWAY_COMMANDS_PER_MINUTE: {
        type: 'integer',
        minimum: 10,
        maximum: 10_000,
        default: 120,
      },
      GATEWAY_HEARTBEAT_GRACE_MS: {
        type: 'integer',
        minimum: 5_000,
        maximum: 300_000,
        default: 15_000,
      },
      GATEWAY_MAX_BUFFERED_BYTES: {
        type: 'integer',
        minimum: 65_536,
        maximum: 67_108_864,
        default: 1_048_576,
      },
      GATEWAY_MAX_FRAME_BYTES: {
        type: 'integer',
        minimum: 1_024,
        maximum: 1_048_576,
        default: 65_536,
      },
      GATEWAY_MAX_SUBSCRIPTIONS: {
        type: 'integer',
        minimum: 1,
        maximum: 10_000,
        default: 250,
      },
      HOST: { type: 'string', default: '0.0.0.0' },
      LOG_LEVEL: {
        type: 'string',
        enum: ['debug', 'error', 'fatal', 'info', 'silent', 'trace', 'warn'],
        default: 'info',
      },
      LIVEKIT_API_KEY: { type: 'string', minLength: 1 },
      LIVEKIT_API_SECRET: { type: 'string', minLength: 16 },
      LIVEKIT_URL: { type: 'string', minLength: 1 },
      KEY_TRANSPARENCY_PRIVATE_KEY: { type: 'string', minLength: 32 },
      MEILISEARCH_API_KEY: { type: 'string', minLength: 1 },
      MEILISEARCH_HOST: { type: 'string', minLength: 1 },
      METRICS_ENABLED: { type: 'boolean', default: true },
      METRICS_BEARER_TOKEN_FILE: { type: 'string', minLength: 1 },
      NODE_ENV: {
        type: 'string',
        enum: ['development', 'test', 'production'],
        default: 'development',
      },
      OUTBOX_BATCH_SIZE: {
        type: 'integer',
        minimum: 1,
        maximum: 500,
        default: 100,
      },
      OUTBOX_ENABLED: { type: 'boolean', default: true },
      OUTBOX_POLL_INTERVAL_MS: {
        type: 'integer',
        minimum: 100,
        maximum: 60_000,
        default: 1_000,
      },
      PORT: { type: 'integer', minimum: 1, maximum: 65_535, default: 3000 },
      REALTIME_ENABLED: { type: 'boolean', default: true },
      REDIS_URL: { type: 'string', minLength: 1 },
      TRUST_PROXY_CIDRS: { type: 'string', default: '' },
      SENTRY_DSN: { type: 'string', minLength: 1 },
      SESSION_TRUST_GEO_HEADERS: { type: 'boolean', default: false },
      SMTP_FROM: { type: 'string', minLength: 3 },
      SMTP_HOST: { type: 'string', minLength: 1 },
      SMTP_PASSWORD: { type: 'string', minLength: 1 },
      SMTP_PORT: {
        type: 'integer',
        minimum: 1,
        maximum: 65_535,
        default: 1025,
      },
      SMTP_SECURE: { type: 'boolean', default: false },
      SMTP_USERNAME: { type: 'string', minLength: 1 },
      TURNSTILE_SECRET_KEY: { type: 'string', minLength: 1 },
      S3_ACCESS_KEY_ID: { type: 'string', minLength: 1 },
      S3_BUCKET: { type: 'string', minLength: 3 },
      S3_ENDPOINT: { type: 'string', minLength: 1 },
      S3_FORCE_PATH_STYLE: { type: 'boolean', default: true },
      S3_REGION: { type: 'string', default: 'us-east-1' },
      S3_SECRET_ACCESS_KEY: { type: 'string', minLength: 1 },
      SERVICE_VERSION: { type: 'string', default: '0.0.0' },
      WEB_PUSH_PRIVATE_KEY: { type: 'string', minLength: 1 },
      WEB_PUSH_PUBLIC_KEY: { type: 'string', minLength: 1 },
      WEB_PUSH_SUBJECT: {
        type: 'string',
        default: 'mailto:security@strafe.app',
      },
    },
  },
}
