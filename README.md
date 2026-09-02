<div align="center">

# Strafe

### A modern, self-hostable community platform built in the open

Fast realtime communication, typed APIs, secure account flows, and polished cross-platform clients in one TypeScript monorepo.

[![CI](https://github.com/RUTUJEKWIELKI/strafe/actions/workflows/ci.yml/badge.svg)](https://github.com/RUTUJEKWIELKI/strafe/actions/workflows/ci.yml)
[![Docs](https://github.com/RUTUJEKWIELKI/strafe/actions/workflows/docs.yml/badge.svg)](https://github.com/RUTUJEKWIELKI/strafe/actions/workflows/docs.yml)
[![License](https://img.shields.io/github/license/RUTUJEKWIELKI/strafe?style=flat-square&color=9bb85b)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)

[Documentation](https://rutujekwielki.github.io/strafe/) · [Roadmap](ROADMAP.md) · [Security](SECURITY.md) · [Issues](https://github.com/RUTUJEKWIELKI/strafe/issues)

</div>

> [!IMPORTANT]
> This is an independent clean-room rewrite, not the official Strafe project, and is not affiliated with the [StrafeChat organization](https://github.com/StrafeChat). The original project, source code, brand, design, assets, and infrastructure remain the work of Bryden and its original contributors.

## About Strafe

Strafe is an open-source communication platform for communities that want control over their infrastructure and data. It combines a responsive SolidJS web client, a typed Fastify backend, a Tauri desktop shell, and generated API documentation.

The current launchpad provides foundations for accounts, communities, realtime messaging, moderation, file delivery, search, notifications, and operational observability. Development is active and the native desktop application remains an early shell.

## Highlights

| Area | What is included |
| --- | --- |
| **Communities** | Servers, channels, roles, permission overwrites, invites, ownership transfer, bans, kicks, timeouts, and audit logs |
| **Messaging** | Cursor pagination, typing, presence, transactional outbox delivery, and a resumable WebSocket gateway |
| **Accounts** | Rotating refresh sessions, device management, password recovery, verified email changes, and security events |
| **Files** | Multipart uploads, quarantine, MIME validation, malware scanning, metadata removal, derivatives, and quotas |
| **Safety** | Blocks, reports, appeals, Redis-backed automod, permission-aware search, and moderation tools |
| **Operations** | Redacted structured logs, health probes, Prometheus metrics, OpenAPI, and optional Sentry reporting |
| **Clients** | Responsive SolidJS web app and a Tauri desktop shell sharing typed contracts |

## Technology

<div align="center">

[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)
[![Fastify](https://img.shields.io/badge/Fastify-5-111111?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=for-the-badge&logo=tauri&logoColor=white)](https://tauri.app/)

</div>

The development stack also uses Drizzle ORM, TypeBox, Vite, VitePress, Meilisearch, MinIO, ClamAV, Mailpit, Vitest, Playwright, ESLint, Prettier, and Turborepo.

## Workspace

| Path | Package | Responsibility |
| --- | --- | --- |
| [`apps/web`](apps/web) | `@strafe/web` | SolidJS web client |
| [`apps/api`](apps/api) | `@strafe/api` | Fastify API and WebSocket gateway |
| [`apps/docs`](apps/docs) | `@strafe/docs` | VitePress documentation |
| [`apps/desktop`](apps/desktop) | `@strafe/desktop` | Tauri native shell |
| [`packages/shared`](packages/shared) | `@strafe/shared` | Shared contracts and domain types |

```text
strafe/
├── apps/
│   ├── api/
│   ├── desktop/
│   ├── docs/
│   └── web/
├── packages/
│   └── shared/
├── compose.yaml
├── package.json
└── pnpm-workspace.yaml
```

## Quick start

### Requirements

- Node.js 24 or newer
- pnpm 11
- Docker with Compose for local infrastructure
- Rust toolchain and platform dependencies only for the desktop client

### Install

```bash
git clone https://github.com/RUTUJEKWIELKI/strafe.git
cd strafe
corepack enable
pnpm install
cp apps/api/.env.example apps/api/.env
```

### Start infrastructure

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d postgres redis minio meilisearch clamav mailpit
pnpm db:migrate
```

The base `compose.yaml` keeps services on a private network. The development override publishes them on loopback for an API running locally.

### Run Strafe

Use separate terminals:

```bash
pnpm api:dev
pnpm web:dev
pnpm docs:dev
```

| Service | Address |
| --- | --- |
| Web client | [http://127.0.0.1:5173](http://127.0.0.1:5173) |
| API | [http://localhost:3000](http://localhost:3000) |
| OpenAPI UI | [http://localhost:3000/docs](http://localhost:3000/docs) |
| Health | [http://localhost:3000/api/health](http://localhost:3000/api/health) |
| WebSocket gateway | `ws://localhost:3000/api/gateway` |

Run the desktop shell with `pnpm --filter @strafe/desktop dev`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm check` | Formatting, linting, types, tests, docs checks, and production builds |
| `pnpm test` | Run workspace tests |
| `pnpm typecheck` | Type-check workspace packages |
| `pnpm contracts:generate` | Refresh OpenAPI output and the typed client schema |
| `pnpm db:migrate` | Apply checked-in Drizzle migrations |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm build` | Build contracts, API, web client, and documentation |

Shared TypeBox contracts live in [`packages/shared/src/contracts`](packages/shared/src/contracts). API plugins and routes load automatically from `apps/api/src/plugins` and `apps/api/src/routes`; route modules receive the `/api` prefix.

## Realtime protocol

The gateway at `/api/gateway` starts with a `hello` frame. Clients answer with `identify`, including an access token, then send heartbeats at the advertised interval. Reconnectable sessions and transactional outbox delivery keep realtime events consistent with PostgreSQL mutations.

See the [backend API guide](docs/backend-api.md) and [generated documentation](https://rutujekwielki.github.io/strafe/) for endpoint and environment details.

## Project status

Strafe is under active development and is not yet a stable production release. The public [roadmap](ROADMAP.md) tracks implemented foundations and upcoming work.

Before opening a pull request:

- keep changes focused and reviewable;
- keep application ownership boundaries clear;
- put cross-package contracts in `@strafe/shared`;
- avoid unused dependencies and speculative infrastructure;
- regenerate contracts after changing route schemas;
- run `pnpm check`.

## Clean-room policy

This repository began from an empty codebase and does not reuse source code, assets, or private implementation details from the original Strafe repositories. References to Strafe describe the rewrite target and technical direction, not ownership of the original project.

Contributors must implement behavior independently, never copy upstream code or assets, never present this repository as an official release, and preserve attribution to Bryden and StrafeChat.

## Security

Do not disclose vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md) to report security problems responsibly.

## License

Copyright © 2026 RUTUJEKWIELKI.

Licensed under the [GNU Affero General Public License v3.0](LICENSE). If you run a modified version as a network service, you must offer its corresponding source code to the users of that service under the same license.

## Attribution

The official Strafe project and active repositories live under the [StrafeChat GitHub organization](https://github.com/StrafeChat). All credit for the original project belongs to Bryden and its contributors.

<div align="center">

Built openly, one carefully reviewed change at a time.

</div>
