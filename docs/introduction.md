# Introduction

Strafe is a community platform built around servers, channels, direct messages,
roles, presence, and realtime events. The same SolidJS interface runs in the
browser and inside the Tauri desktop shell. A Fastify API owns server-side
behavior, while shared TypeScript contracts keep clients and API responses in
sync.

This repository is an independent clean-room implementation. It is still under
active development, so the documentation separates working behavior from
planned work.

## What works today

The backend currently supports:

- account registration, rotating sessions, password recovery, and e-mail
  verification;
- server creation, invites, channels, categories, members, roles, permission
  overrides, and audit logs;
- messages, reactions, read state, direct messages, and attachment ownership;
- resumable WebSocket events, presence, typing, heartbeats, and multi-instance
  delivery through Redis;
- quarantined multipart uploads, malware scanning, media processing, and
  authorized downloads;
- moderation cases, reports, automod rules, appeals, search, notifications, and
  voice access tokens.

The web and desktop clients are less complete than the API. Use the
[roadmap](./roadmap.md) for delivery status rather than treating every backend
endpoint as a finished user-facing feature.

## How the pieces fit together

PostgreSQL stores durable state. Redis handles short-lived presence and
cross-instance realtime delivery. S3-compatible storage keeps files outside the
database. The transactional outbox connects committed database changes to
realtime, search, and notifications.

Start with the [quickstart](./quickstart.md) to run the project, or read
[core concepts](./core-concepts.md) before integrating a client.

## Where to look next

- Building or reviewing the project: [Quickstart](./quickstart.md)
- Integrating an application: [Authentication](./guides/authentication.md)
- Understanding the backend: [System overview](./system-overview.md)
- Checking an exact request shape: [API reference](../api/reference.md)
