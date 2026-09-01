# Strafe

[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-2C4F7C?style=flat-square&logo=solid&logoColor=white)](https://www.solidjs.com/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

An independent, clean-room rewrite scaffold for a new Strafe implementation.

Documentation: <https://rutujekwielki.github.io/strafe/>

> [!IMPORTANT]
> This is not the official Strafe project and is not affiliated with the StrafeChat organization. The original Strafe project is Bryden's work. I do not claim ownership of the original project, its source code, brand, design, assets, or infrastructure. The official project and its repositories are available at [StrafeChat](https://github.com/StrafeChat).

## Rewrite policy

This repository starts from an empty codebase. It does not reuse source code, assets, or implementation details from the original Strafe repositories. References to Strafe describe the rewrite target and its technical direction, not ownership of the original project.

Contributions should preserve that boundary:

- implement behavior independently;
- do not copy upstream source code or assets;
- do not present this repository as an official Strafe release;
- keep attribution to Bryden and the original StrafeChat project intact.

## Status

Launchpad provides a typed Fastify API, PostgreSQL migrations, generated OpenAPI
client, operational telemetry, and a responsive SolidJS design-system shell. The
Tauri desktop application embeds the web client and remains an early native shell.

The implementation roadmap and backend data flow are maintained in
[`ROADMAP.md`](ROADMAP.md).

## Workspace

| Path              | Package           | Responsibility                    |
| ----------------- | ----------------- | --------------------------------- |
| `apps/web`        | `@strafe/web`     | SolidJS web client                |
| `apps/api`        | `@strafe/api`     | Fastify HTTP API                  |
| `apps/docs`       | `@strafe/docs`    | VitePress documentation site      |
| `apps/desktop`    | `@strafe/desktop` | Tauri native shell                |
| `packages/shared` | `@strafe/shared`  | Shared contracts and domain types |

```text
strafe/
├── apps/
│   ├── api/
│   ├── docs/
│   ├── desktop/
│   └── web/
├── packages/
│   └── shared/
│       └── package.json
├── package.json
└── pnpm-workspace.yaml
```

## Toolchain

- Node.js 24 or newer
- pnpm 11
- TypeScript 5.9
- SolidJS with Vite for the web package
- Fastify for the API package

Package versions are declared at the workspace boundary where they are used. Cross-package contracts belong in `@strafe/shared`; application-specific dependencies stay inside their respective application package.

## Bootstrap

```bash
git clone https://github.com/RUTUJEKWIELKI/strafe.git
cd strafe
corepack enable
pnpm install
```

Run the API in development mode:

```bash
pnpm api:dev
```

The server listens on `http://localhost:3000` by default. Its health endpoint is
available at `GET /api/health`. Copy `apps/api/.env.example` to `apps/api/.env` to
override the host, port, or environment.

API files placed in `apps/api/src/plugins` and `apps/api/src/routes` are loaded
automatically. Route modules receive the `/api` prefix. Use `pnpm api:typecheck`,
`pnpm api:test`, and `pnpm api:build` for verification and production compilation.

## Launchpad development

Start the local data, realtime, file, search, scanning, and mail services, then
apply the checked-in Drizzle migrations:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres redis minio meilisearch clamav mailpit
cp apps/api/.env.example apps/api/.env
pnpm db:migrate
```

The base `compose.yaml` does not publish host ports; services are available only
on the private Compose network. `compose.dev.yaml` is an optional loopback
override for an API running locally with `pnpm api:dev`.

Run `pnpm api:dev` and `pnpm web:dev` in separate terminals. The frontend is
available at `http://127.0.0.1:5173`; Tauri starts the same Vite application with
`pnpm --filter @strafe/desktop dev`.

Run `pnpm docs:dev` in another terminal to start the VitePress documentation
site. Use `pnpm contracts:generate` before `pnpm docs:build` to refresh the API
reference and produce the static production bundle.

Shared TypeBox contracts live in `packages/shared/src/contracts`. After changing a
route schema, run `pnpm contracts:generate` to update
`apps/api/openapi/openapi.json` and the typed `openapi-fetch` schema used by the
web application.

Operational endpoints are available at `GET /api/health`,
`GET /api/health/ready`, and `GET /api/metrics`. Interactive OpenAPI
documentation is served at `/docs`. Logs are structured and redact credentials;
set `SENTRY_DSN` to enable external error reporting.

The community backend includes local accounts with rotating refresh sessions,
servers, roles and channel overwrites, invites, cursor-paginated messages,
transactional outbox delivery, presence, typing and a resumable WebSocket gateway
at `/api/gateway`. OpenAPI documents the HTTP routes. The gateway starts with a
`hello` frame; clients respond with `identify` containing an access token and then
send heartbeats at the advertised interval.

Account hardening includes an active-device list, per-session and global logout,
password change/reset, verified email changes, security audit events, and new-login
notifications. File attachments use presigned S3 multipart uploads and remain in
quarantine until MIME checks, ClamAV, metadata removal, and derivative generation
succeed. Reports, appeals, user blocks, Redis-backed automod, permission-aware
Meilisearch, Web Push, e-mail, and notification digests are exposed through the
same typed API. See `docs/backend-api.md` for endpoints and required environment
variables.

Community administration includes server updates, ownership transfer and
soft-deletion; member listing, leave, kick, ban/unban and timeout clearing; full
channel, role and permission-overwrite management; stable ordering; and a
cursor-paginated audit log. Every successful mutation writes its audit record and
realtime outbox event in the same PostgreSQL transaction.

Run `pnpm check` before opening a pull request. It verifies formatting, linting,
types, tests, and production builds across the workspace.

## Repository rules

- Keep pull requests narrow and reviewable.
- Do not add speculative infrastructure or unused dependencies.
- Do not commit generated placeholder interfaces.
- Keep package ownership clear and avoid imports across application boundaries.
- Record architectural decisions when they become real decisions, not before.

## Original project

The original Strafe project, documentation, and active repositories live under the [StrafeChat GitHub organization](https://github.com/StrafeChat). All credit for that project belongs to Bryden and its original contributors.
