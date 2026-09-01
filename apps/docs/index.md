---
layout: home

hero:
  name: Strafe
  text: From Signal to Community
  tagline: A community platform for servers, channels, messages, presence, and voice — built as an independent open-source implementation.
  actions:
    - theme: brand
      text: Explore Strafe
      link: /guide/introduction
    - theme: alt
      text: Start building
      link: /guide/quickstart

features:
  - title: Community model
    details: Servers, members, roles, channel overrides, invites, messages, moderation, and audit history.
  - title: Realtime delivery
    details: Presence, typing, resumable Redis streams, deduplicated events, heartbeats, and multi-instance fanout.
  - title: Account security
    details: Rotating sessions, device management, password recovery, e-mail verification, and security events.
  - title: Media pipeline
    details: Multipart uploads, quarantine, malware scanning, media variants, and authorized downloads.
---

## Choose a path

### Explore the project

Read the [introduction](/guide/introduction) for a concise description of the
product and its current state. Continue to [core concepts](/guide/core-concepts)
to understand the vocabulary used throughout the repository.

### Build and integrate

Use the [quickstart](/guide/quickstart) to run the API and local services. The
practical guides cover [authentication](/guide/guides/authentication),
[community setup](/guide/guides/community-setup),
[permissions](/guide/guides/permissions),
[realtime](/guide/guides/realtime), and [files](/guide/guides/files).

## Architecture at a glance

```mermaid
flowchart LR
  Client[Web / Desktop] --> API[Fastify API]
  API --> PG[(PostgreSQL)]
  API --> Redis[(Redis)]
  API --> Storage[S3 / MinIO]
  PG --> Outbox[Transactional outbox]
  Outbox --> Search[Meilisearch]
  Outbox --> Push[Notifications]
  Redis --> Gateway[WebSocket gateway]
```

PostgreSQL owns durable state. Redis carries presence and realtime streams.
Outbox records connect committed changes to gateway delivery, search, and
notifications. Read the [system overview](/guide/system-overview) for the
boundaries and tradeoffs, or open the [API reference](/api/reference) for exact
request and response schemas.
