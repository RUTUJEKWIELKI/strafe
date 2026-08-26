# Strafe

[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-2C4F7C?style=flat-square&logo=solid&logoColor=white)](https://www.solidjs.com/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Node.js](https://img.shields.io/badge/Node.js-24%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

An independent, clean-room rewrite scaffold for a new Strafe implementation.

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

The repository currently contains package boundaries only. There is no application code, generated interface, placeholder API, or production configuration yet.

## Workspace

| Path | Package | Responsibility |
| --- | --- | --- |
| `apps/web` | `@strafe/web` | SolidJS web client |
| `apps/api` | `@strafe/api` | Fastify HTTP API |
| `packages/shared` | `@strafe/shared` | Shared contracts and domain types once they are defined |

```text
strafe/
├── apps/
│   ├── api/
│   │   └── package.json
│   └── web/
│       └── package.json
├── packages/
│   └── shared/
│       └── package.json
├── package.json
└── pnpm-workspace.yaml
```

## Toolchain

- Node.js 24 or newer
- pnpm 11
- TypeScript 7
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

There are intentionally no development or build commands yet. Scripts should be added together with the first executable implementation, so the repository does not advertise workflows that do not exist.

## Repository rules

- Keep pull requests narrow and reviewable.
- Do not add speculative infrastructure or unused dependencies.
- Do not commit generated placeholder interfaces.
- Keep package ownership clear and avoid imports across application boundaries.
- Record architectural decisions when they become real decisions, not before.

## Original project

The original Strafe project, documentation, and active repositories live under the [StrafeChat GitHub organization](https://github.com/StrafeChat). All credit for that project belongs to Bryden and its original contributors.
