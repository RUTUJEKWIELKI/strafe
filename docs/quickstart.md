# Quickstart

This guide starts the API and its local dependencies. It does not require the
desktop application.

## Requirements

- Node.js 24 or newer
- pnpm 11
- Docker with Compose

Rust 1.85 or newer is required only for the Tauri desktop shell.

## Install the workspace

```bash
pnpm install
```

Copy the API environment template:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

For a local-only setup, replace `AUTH_JWT_SECRET` with a random value containing
at least 32 characters. Do not reuse the development credentials in a deployed
environment.

## Start local services

The base Compose file does not publish database or service ports. Add the
development override when the API runs on the host:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d
```

This binds PostgreSQL, Redis, MinIO, Meilisearch, ClamAV, and Mailpit to
`127.0.0.1`. They are not exposed on the local network.

## Prepare the database

```bash
pnpm db:migrate
```

Generate a migration first when the Drizzle schema has changed:

```bash
pnpm db:generate
pnpm db:migrate
```

## Run and verify the API

```bash
pnpm api:dev
```

The default endpoints are:

- API: `http://localhost:3000/api`
- readiness: `http://localhost:3000/api/health/ready`
- OpenAPI JSON: `http://localhost:3000/docs/json`
- WebSocket gateway: `ws://localhost:3000/api/gateway`

Check readiness from another terminal:

```bash
curl http://localhost:3000/api/health/ready
```

A ready response reports PostgreSQL and Redis as connected. If a dependency is
unavailable, inspect `docker compose ps` and the API log before changing the
application configuration.

## Run the documentation

```bash
pnpm docs:dev
```

VitePress starts at `http://localhost:5173`. Documentation generation does not
connect to PostgreSQL or Redis; it reads the committed OpenAPI document and
shared TypeScript contracts.

## Next step

Register a user and learn the token lifecycle in the
[authentication guide](./guides/authentication.md).
