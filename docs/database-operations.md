# Database and Operations

## PostgreSQL and Drizzle

PostgreSQL is the durable source of truth. Drizzle schemas are grouped by domain
under `apps/api/src/db/schema/`; `index.ts` exports them to the API and Drizzle
Kit. Checked-in SQL migrations live in `apps/api/drizzle/`.

```bash
# DATABASE_URL must be set for both commands
pnpm db:generate
pnpm db:migrate
```

`db:generate` creates a migration from schema changes. Review the SQL before
committing it. `db:migrate` applies pending checked-in migrations. Domain
services use short transactions for related state, audit entries, and outbox
events; route handlers do not own persistence logic.

The main relationships are account → session, server → membership → role,
server → channel → message, and file → upload/variant. Moderation, notification,
voice, and audit records reference those durable identities without becoming
the authorization source.

## Transactional outbox

Mutations that need downstream work insert an `outbox_events` row in the same
transaction. The API process claims due rows with `FOR UPDATE SKIP LOCKED`, then
publishes realtime events, updates search, and enqueues notification delivery.
Successful rows are marked processed. Failures release the claim and retry with
bounded exponential delay; processing stops after ten attempts. BullMQ is a
dependency but is not the active outbox implementation.

## Search and realtime dependencies

Meilisearch is optional. Search falls back to PostgreSQL and applies permission
checks independently; index results never grant access. Redis coordinates
presence, rate limits, pub/sub fanout, and the bounded resume stream. Development
can run local-only realtime without Redis, but production realtime requires it.

## Health and observability

| Endpoint | Behavior |
| --- | --- |
| `GET /api/health` | Reports configured PostgreSQL and Redis status; always returns `200` |
| `GET /api/health/ready` | Probes PostgreSQL and Redis; returns `503` when either configured dependency is unavailable |
| `GET /api/metrics` | Prometheus process and HTTP metrics, or `404` when disabled |

Fastify/Pino logs include request IDs and remove authorization, cookie, and
`set-cookie` values. Responses expose the request ID through `x-request-id` and
the standard error envelope. With `SENTRY_DSN`, unexpected errors are reported
with route, method, and request ID context.

The current process hosts the outbox and file-processing timers. Deployments
must drain the API on shutdown and run migrations before serving a new schema.
Backups, restore testing, and external alerting remain deployment responsibilities.
