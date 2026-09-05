# Strafe

Strafe is a modern, privacy-first communication platform designed as an independent alternative to Discord.

The goal is to create a fast, polished and self-hostable platform for communities, friends and teams, combining real-time text communication, voice, media sharing and community management without unnecessary tracking or dependence on a closed ecosystem.

## Core vision

Strafe should feel familiar enough for Discord users to understand immediately, while being cleaner, faster, more privacy-focused and technically transparent.

The product should prioritize:

- privacy by default
- user control and data ownership
- fast real-time communication
- strong security
- clean and responsive UX
- self-hosting and open-source development
- extensibility through APIs and integrations
- low resource usage where possible

## Main features

Strafe should support:

- user accounts and authentication
- communities / servers
- text channels
- direct messages and group DMs
- real-time messaging
- message replies, reactions, mentions and editing
- roles and granular permissions
- member management
- moderation tools
- file and image uploads
- presence and user status
- notifications
- search
- voice channels
- WebRTC-based voice communication using LiveKit
- real-time gateway / WebSocket events
- audit logs
- API integrations and bots
- configurable privacy and security settings

End-to-end encryption should be considered for communication where technically appropriate, especially private conversations.

## Architecture

Strafe is developed as a pnpm monorepo.

Main applications:

- `apps/web` — SolidJS web client
- `apps/api` — Fastify backend API
- `apps/desktop` — Tauri desktop application
- `apps/docs` — VitePress documentation
- `packages/shared` — shared contracts, types and utilities

The backend uses PostgreSQL as the primary database and Redis for caching, queues and realtime-related workloads.

Additional infrastructure may include:

- BullMQ
- WebSockets
- LiveKit
- S3-compatible object storage
- Meilisearch
- OpenTelemetry
- Prometheus
- Sentry

## Product direction

Strafe should not be a visual clone of Discord.

Its identity should be distinct: dark, restrained, technical and premium, with a privacy-first personality and a consistent design system across the web app, desktop client and documentation.

The interface should avoid unnecessary visual clutter, excessive animations and generic template-like UI.

Performance, accessibility and responsive design are first-class requirements.

## Engineering principles

Code should be production-quality rather than prototype-quality.

Prefer:

- strong TypeScript typing
- shared contracts between frontend and backend
- modular architecture
- explicit validation
- predictable error handling
- secure defaults
- automated testing
- linting and formatting
- generated OpenAPI documentation
- maintainable code over unnecessary abstraction
- clear separation between business logic, transport and persistence

Security should be treated as part of the architecture rather than an afterthought.

## Long-term goal

The long-term goal is for Strafe to become a credible open-source communication platform that can be used either through the official hosted service or deployed independently by users and communities.

It should provide the convenience expected from modern communication platforms while giving users substantially more control over their infrastructure, privacy and data.
