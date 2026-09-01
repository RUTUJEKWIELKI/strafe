# Strafe Roadmap — From Signal to Community

This is the project’s central roadmap. It records what the backend already does,
how data moves through the system, and the work required for a scalable
production release.

## How the backend works

1. Web and desktop clients call Fastify under `/api` or open the WebSocket at
   `/api/gateway`.
2. Protected requests send `Authorization: Bearer <strafe-token>`. The API
   validates the JWT, active session, membership, and permissions.
3. Domain services perform a short PostgreSQL transaction. The mutation, audit
   record, and `outbox_event` are committed together, so durable changes cannot
   lose their event.
4. The outbox dispatcher publishes events to Redis, realtime gateway,
   notifications, and search indexing. Redis is transport/cache; PostgreSQL is
   the source of truth.
5. Files use presigned S3 multipart uploads and remain quarantined until MIME,
   ClamAV, sanitization, and derivative processing succeed with status `ready`.

## System components

| Component         | Responsibility                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `apps/api`        | Fastify, routing, authentication, domain services, and outbox dispatcher                         |
| `packages/shared` | TypeBox schemas, DTOs, events, and OpenAPI contracts                                             |
| PostgreSQL 17.6   | 56 tables for accounts, servers, channels, roles, messages, files, moderation, and notifications |
| Redis             | Presence, typing, rate limits, automod, pub/sub, and Redis Streams resume                        |
| S3/MinIO + ClamAV | Object storage, quarantine, scanning, and media processing                                       |
| Meilisearch       | Permission-aware search; it never grants access                                                  |
| SMTP/Web Push     | Security e-mail, notifications, and digests                                                      |

## Roadmap status

- [x] **Launchpad** — migrations, CI, typecheck, tests, OpenAPI, health/metrics,
      design-system shell, and structured logging.
- [x] **Community core** — servers, ownership transfer, members, channels,
      categories, roles, ordering, permission overwrites, invites, and audit log.
- [x] **Account security** — devices, sessions, single/all-session logout,
      password change/reset, verification, and safe e-mail changes.
- [x] **Files** — multipart uploads, quota/MIME limits, quarantine, ClamAV,
      EXIF removal, thumbnails, waveforms, authorized downloads, and cleanup.
- [x] **Realtime hardening** — Redis fanout, `lastStreamId`, resync,
      deduplication, backpressure, frame/subscription limits, and presence cleanup.
- [x] **Moderation** — reports, case queue, appeals, blocks, automod, raid
      detection, and granular moderator permissions.
- [x] **Search & notifications** — ACL-filtered Meilisearch with PostgreSQL
      fallback, Web Push, SMTP, preferences, and digests.

## Next stages

1. **Staging hardening** — run the full Compose stack, verify S3/ClamAV/
   Meilisearch/SMTP integrations, and add load and two-instance chaos tests.
2. **Workers and operations** — separate retry/dead-letter queues, retention
   cleanup, PgBouncer, backups, PITR, SLO alerts, and dashboards.
3. **Frontend production** — connect the generated OpenAPI client and build
   server administration, sessions, uploads, moderation, search, and notification
   screens.
4. **Scaling** — profile queries, add read replicas and tenant limits, and only
   partition tables after measurements justify it.
5. **Future** — DM E2EE, federation, and advanced voice/stage after ADR approval
   and a documented retention policy.

## Local development

The base `compose.yaml` does not publish host ports:

```bash
docker compose up -d postgres redis minio meilisearch clamav mailpit
```

When the API runs on the host with `pnpm api:dev`, use the loopback-only
override:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d
pnpm db:migrate
pnpm api:dev
pnpm web:dev
```

Run `pnpm contracts:generate` after changing route contracts. Run `pnpm check`
before a pull request, and keep secrets only in `apps/api/.env`.

## Definition of done

Production is ready when migrations pass on a fresh database and an upgrade,
integration tests run with Redis, every upload is scanned, every mutating endpoint
has an audit/outbox record, readiness checks dependencies, and backup/restore has
been verified in staging.
