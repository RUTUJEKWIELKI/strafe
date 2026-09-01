# Strafe Backend API

## Scope

The backend in `apps/api` implements the main flow described in
`data-realtime-architecture.md`. PostgreSQL is the source of truth, Redis is an
optional realtime layer in development and required for production realtime.
The migrations create 56 tables covering identity, servers, channels, messages,
moderation, files, notifications, integrations, outbox, and voice.

Implemented capabilities include:

- local registration with Argon2id, short-lived access tokens, and rotating refresh tokens;
- refresh-token reuse detection with automatic session revocation;
- servers with default channels, membership, invites, and counters;
- server settings, ownership transfer, leave, and soft deletion;
- bigint role permissions, ordering, channel overwrites, and escalation protection;
- cursor-paginated members and audit logs, kick, ban/unban, and timeout/untimeout;
- nonce-idempotent messages with replies, edits, tombstones, reactions, and read state;
- canonical direct messages that respect blocks and recipient privacy;
- timeout and ban actions persisted with a case, audit entry, and outbox event;
- multi-session presence, typing, inbox notifications, and short-lived LiveKit tokens;
- device/session management, hashed reset/verification tokens, and security audit events;
- S3 multipart uploads, ClamAV quarantine, image sanitization, thumbnails, and waveforms;
- reports, moderation cases, appeals, blocks, and Redis-backed spam/flood/link/raid automod;
- permission-aware Meilisearch with PostgreSQL fallback, Web Push, SMTP, and digests.

## Running locally

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres redis minio meilisearch clamav mailpit
cp apps/api/.env.example apps/api/.env
pnpm db:migrate
pnpm api:dev
```

The base `compose.yaml` does not publish host ports; services communicate on
the private Compose network. `compose.dev.yaml` is an optional override that
binds ports only to `127.0.0.1` for an API running outside Docker.

HTTP documentation is available at `http://localhost:3000/docs`, health at
`GET /api/health/ready`, and Prometheus metrics at `GET /api/metrics`. Production
requires `DATABASE_URL` and `AUTH_JWT_SECRET`. `REDIS_URL` is required when
`REALTIME_ENABLED=true`. Uploads require `S3_*` and `CLAMAV_*`, search requires
`MEILISEARCH_*`, and delivery requires `SMTP_*` and `WEB_PUSH_*`. A missing
scanner never promotes a file to `ready`.

Protected endpoints use the `StrafeToken` security scheme. Send the access token
from registration, login, or refresh as `Authorization: Bearer <access-token>`.
In Swagger UI click **Authorize** and paste only the token; Swagger adds the
`Bearer` prefix. Send refresh tokens only in `/api/auth/refresh` and
`/api/auth/logout` request bodies.

## Main endpoints

| Area       | Endpoints                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| Auth       | `POST /api/auth/register`, `login`, `refresh`, `logout`, `GET /api/users/@me` |
| Servers    | CRUD `/api/servers/:id`, ownership transfer, and `DELETE .../members/@me`     |
| Members    | list, roles, kick, ban/unban, timeout/untimeout                               |
| Channels   | CRUD, tree ordering, and CRUD `/permission-overwrites`                        |
| Roles      | CRUD, ordering, and safe member assignment                                    |
| Audit      | `GET /api/servers/:id/audit-log` with cursor pagination                       |
| Invites    | `POST /api/servers/:id/invites`, `POST /api/invites/:code/join`               |
| Messages   | `GET/POST /api/channels/:id/messages`, `PATCH/DELETE /api/messages/:id`       |
| Activity   | reactions, `PUT /api/channels/:id/read-state`, notification inbox             |
| Account    | sessions/devices, password, reset, verification, e-mail change                |
| Files      | multipart `/api/files/uploads`, metadata, authorized download                 |
| Moderation | reports, cases, appeals, blocks, automod rules, timeout, and bans             |
| Search     | `/api/search/messages` and `/api/search/servers`                              |
| Delivery   | notification preferences and Web Push subscriptions                           |
| Voice      | `POST /api/channels/:id/voice/token`                                          |

Message, member, notification, and audit lists use an opaque `(created_at, id)`
cursor. Clients must not construct cursors themselves. Message sends require a
UUIDv7 `clientNonce`; retrying the same request returns the original message.

## Realtime gateway

Connect to `/api/gateway`. The server sends:

```json
{ "op": "hello", "d": { "heartbeatIntervalMs": 25000 } }
```

Within ten seconds the client responds with an access token:

```json
{ "op": "identify", "d": { "token": "...", "lastStreamId": "optional" } }
```

After `ready`, send `heartbeat` at the advertised interval. Supported operations
include `subscribe`, `unsubscribe`, `typing`, and `presence_update`. Events have
versioned IDs and data:

```json
{
  "op": "event",
  "d": {
    "eventId": "uuid-v7",
    "streamId": "redis-stream-id",
    "type": "message.created",
    "version": 1,
    "occurredAt": "2026-08-28T18:00:00.000Z",
    "aggregateId": "uuid-v7",
    "data": {}
  }
}
```

`eventId` enables deduplication. `lastStreamId` replays a short gap after
reconnect; `resync_required` instructs the client to fetch a fresh REST snapshot.
The gateway enforces frame, command, subscription, output-buffer, and heartbeat
limits. Typing expires after ten seconds and is never stored in PostgreSQL.

## Data guarantees

- Passwords use Argon2id; refresh tokens and invite codes are stored as SHA-256 hashes.
- Every protected endpoint rechecks the active session in PostgreSQL.
- Permissions combine roles and overwrites; the server owner always has full access.
- Moderators cannot assign or overwrite permission bits they do not possess.
- Leave, kick, and ban remove elevated roles; rejoining starts with `@everyone`.
- Category deletion moves children to the root; servers and channels are soft-deleted.
- Server, message, and moderation mutations append outbox events in the same transaction.
- The dispatcher uses `FOR UPDATE SKIP LOCKED`, retries, and a processing lease.
- Clients deduplicate events because outbox delivery is at-least-once.
- Production refuses to start without a database, JWT secret, or Redis for realtime.

## Verification

`apps/api/src/integration.test.ts` covers messages, notifications, DMs,
moderation, and sessions. `community-management.integration.test.ts` checks
complete server configuration and role/overwrite escalation guards.
`platform-hardening.integration.test.ts` covers devices and one-time tokens;
`realtime-multi-instance.integration.test.ts` verifies fanout and resume between
two Redis-connected buses. CI applies migrations to PostgreSQL 17.6 and starts
Redis. S3, ClamAV, and Meilisearch integrations should also be verified in
staging with real services; the API never treats an unscanned file as safe.
