# Repository Guidelines

## Project Structure & Package Ownership

Strafe is a pnpm workspace split by runtime:

- `apps/web` — SolidJS browser UI and the frontend bundled by Tauri.
- `apps/api` — Fastify server-side logic and integrations.
- `apps/docs` — VitePress documentation site, Scalar OpenAPI reference, and TypeDoc output.
- `apps/desktop` — Tauri/Rust native shell; keep UI in `apps/web`.
- `packages/shared` — runtime-neutral contracts, schemas, and domain types. It may not import from `apps/*`.

API routes and plugins are auto-loaded under `/api`. Tests stay beside source as `*.test.ts`. Tauri configuration and Rust code live in `apps/desktop/src-tauri`.

## Frontend Architecture & Dependencies

Use SolidJS primitives. Place reusable UI in `components`, screens in `routes`, client state in `stores`, and API/browser helpers in `lib`. Use feature folders for larger features and TanStack Query, not stores, for server state.

Use `@solidjs/router` for navigation, `@tanstack/solid-query` for remote data, and `openapi-fetch` with `@strafe/shared` contracts for API calls. Kobalte provides accessible controls; Tailwind CSS and `clsx` handle styling. Formisch plus Valibot cover forms, Dexie offline data, LiveKit calls, and `hls.js`/WaveSurfer media. Lazy-load heavy features. Install dependencies only in their consuming package.

## Build, Test, and Development Commands

Use Node.js 24+, pnpm 11, and Rust 1.85+.

- `pnpm install` — install workspace dependencies.
- `pnpm api:dev` — run the API at `http://localhost:3000` with watch mode.
- `pnpm api:test` / `pnpm api:typecheck` — run Vitest or strict TypeScript checks.
- `pnpm api:build` / `pnpm api:start` — compile and run the production API.
- `pnpm --filter @strafe/desktop dev` — start Vite and the Tauri shell.
- `pnpm --filter @strafe/desktop build` — build the web and desktop bundle.
- `pnpm docs:dev` / `pnpm docs:build` — run or statically build the VitePress documentation.
- `pnpm docs:generate` / `pnpm docs:test` — regenerate synced and TypeDoc pages or run the Chromium smoke suite.
- `pnpm docs:lint` — lint Markdown with markdownlint-cli2.

## Coding Style & Testing

TypeScript is strict ESM: use two spaces, single quotes, no semicolons, trailing commas, `camelCase` values, and `PascalCase` types/components. Keep `.js` extensions in relative NodeNext imports. Follow `rustfmt` defaults for Rust. ESLint and Prettier are installed but not configured repository-wide, so preserve nearby style.

Use Vitest and Solid Testing Library. Test visible behavior, keep tests deterministic, clean up resources, and use Fastify `inject()` instead of network ports. No coverage threshold is enforced.

## Commits, Pull Requests & Security

Follow Conventional Commits, for example `feat: add Tauri desktop shell` or `chore(api): define Fastify package`. Keep PRs narrow; explain changes, list verification commands, link issues, and attach screenshots for UI work.

Copy `apps/api/.env.example` to `.env` and never commit secrets. Follow `SECURITY.md` for private reports. Preserve the clean-room boundary: do not copy source, assets, designs, or implementation details from the original Strafe project.
