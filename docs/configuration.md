# API Configuration

The API loads `apps/api/.env` outside tests and validates every value at startup.
Copy `apps/api/.env.example`; never commit a populated environment file. Values
marked production are enforced only when `NODE_ENV=production`.

## Core and authentication

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime mode: `development`, `test`, or `production` |
| `HOST` | No | `0.0.0.0` | Listen address |
| `PORT` | No | `3000` | Listen port |
| `APP_PUBLIC_URL` | No | `http://localhost:5173` | Public client URL used by server-side flows |
| `CORS_ORIGINS` | No | Local web, preview, and Tauri origins | Comma-separated exact origin allowlist |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `SERVICE_VERSION` | No | `0.0.0` | OpenAPI and error-reporting release version |
| `AUTH_JWT_SECRET` | Production | Random per process | Access-token signing secret; at least 32 characters |
| `AUTH_ACCESS_TTL_SECONDS` | No | `900` | Access-token lifetime |
| `AUTH_REFRESH_TTL_SECONDS` | No | `2592000` | Refresh-session lifetime |
| `AUTH_CHALLENGE_TTL_SECONDS` | No | `3600` | Reset, verification, and account challenge lifetime |
| `SESSION_TRUST_GEO_HEADERS` | No | `false` | Trust proxy-supplied geographic session metadata |

Without `AUTH_JWT_SECRET` in development, tokens stop working after an API
restart. Production refuses to start without it.

## Data and realtime

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | Production | Disabled | PostgreSQL connection string |
| `DATABASE_POOL_MAX` | No | `10` | Maximum PostgreSQL pool size |
| `DATABASE_SSL` | No | `disable` | `disable` or `require` transport mode |
| `REDIS_URL` | Production realtime | Disabled | Redis commands, pub/sub, presence, limits, and resume stream |
| `REALTIME_ENABLED` | No | `true` | Enable the WebSocket gateway |
| `OUTBOX_ENABLED` | No | `true` | Run the in-process transactional outbox dispatcher |
| `OUTBOX_BATCH_SIZE` | No | `100` | Events claimed in one dispatch pass |
| `OUTBOX_POLL_INTERVAL_MS` | No | `1000` | Dispatcher polling interval |
| `GATEWAY_MAX_FRAME_BYTES` | No | `65536` | Maximum incoming WebSocket frame |
| `GATEWAY_MAX_BUFFERED_BYTES` | No | `1048576` | Outbound backpressure limit |
| `GATEWAY_MAX_SUBSCRIPTIONS` | No | `250` | Channel subscriptions per connection |
| `GATEWAY_COMMANDS_PER_MINUTE` | No | `120` | Connection command limit |
| `GATEWAY_HEARTBEAT_GRACE_MS` | No | `15000` | Grace beyond the 25-second heartbeat interval |

## Files, delivery, voice, and telemetry

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `S3_ENDPOINT` | For uploads | Disabled | S3-compatible endpoint |
| `S3_REGION` | No | `us-east-1` | Storage region |
| `S3_BUCKET` | For uploads | Disabled | Object bucket |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | For uploads | Disabled | Storage credentials |
| `S3_FORCE_PATH_STYLE` | No | `true` | Use path-style S3 addressing |
| `FILE_MAX_SIZE_BYTES` | No | `104857600` | Maximum declared file size |
| `FILE_USER_QUOTA_BYTES` | No | `2147483648` | Per-user stored-byte quota |
| `FILE_PART_SIZE_BYTES` | No | `8388608` | Multipart part size |
| `FILE_PROCESS_INTERVAL_MS` | No | `5000` | Quarantine processor interval |
| `FILE_SCAN_REQUIRED` | No | `true` | Fail closed unless malware scanning succeeds |
| `CLAMAV_HOST` | When scanning | Disabled | ClamAV host |
| `CLAMAV_PORT` | No | `3310` | ClamAV port |
| `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY` | No | PostgreSQL fallback | Optional search index connection |
| `SMTP_HOST` / `SMTP_FROM` | No | Disabled | Optional mail delivery |
| `SMTP_PORT` | No | `1025` | SMTP port |
| `SMTP_SECURE` | No | `false` | Use implicit TLS |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | No | Disabled | Optional SMTP authentication |
| `WEB_PUSH_PUBLIC_KEY` / `WEB_PUSH_PRIVATE_KEY` | No | Disabled | Web Push VAPID keys |
| `WEB_PUSH_SUBJECT` | No | `mailto:security@strafe.app` | VAPID contact subject |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | For voice | Disabled | LiveKit endpoint and server credentials |
| `METRICS_ENABLED` | No | `true` | Expose Prometheus metrics at `/api/metrics` |
| `SENTRY_DSN` | No | Disabled | Send unexpected errors to Sentry |

Use deployment secret storage for all credentials. The example file contains
local placeholders only.
