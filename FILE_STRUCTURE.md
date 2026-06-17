# Project Structure

## Overview

This repository is a Bun/Turborepo monorepo for a TypeScript-first product stack.

- `apps/web` is the browser app.
- `apps/server` is the API/runtime server.
- `apps/native` is the Expo React Native app.
- `packages/*` contains shared libraries and infrastructure modules.
- `apps/ai-trainer` is a separate Python/ML workspace and should be treated independently from the main TypeScript monorepo.

## Root Layout

```text
zen-doc/
├── apps/
│   ├── web/
│   ├── server/
│   ├── native/
│   └── ai-trainer/
├── packages/
│   ├── api/
│   ├── db/
│   ├── env/
│   ├── infra/
│   ├── ui/
│   └── config/
├── turbo.json
├── tsconfig.json
├── package.json
└── README.md
```

## Workspace Behavior

### Package Manager and Build System

- Uses `bun` as the package manager.
- Uses `turbo` for task orchestration.
- Workspace packages are matched with `apps/*` and `packages/*`.
- Turbo tasks include `dev`, `build`, `check-types`, `db:push`, `db:generate`, `deploy`, and `destroy`.
- Turbo build inputs include `.env*`, so environment changes can affect cached builds.

### Shared Dependency Catalog

The root `package.json` defines a workspace catalog for commonly reused packages like `dotenv`, `zod`, `hono`, `@orpc/*`, `alchemy`, and type packages.

## Apps

### `apps/web`

Frontend app built with Vite and TanStack Start.

- Uses React 19.
- Uses TanStack Router, React Query, and TanStack Start SSR patterns.
- Consumes shared UI from `@suwa/ui`.
- Consumes shared API and env packages from the workspace.
- Also integrates Clerk and Tailwind v4.

### `apps/server`

Backend API service.

- Uses Hono as the HTTP layer.
- Uses ORPC for typed RPC and OpenAPI exposure.
- Uses `@suwa/api` for router definitions and `@suwa/db` for persistence.
- Uses `@suwa/env/server` for server env values.
- Supports local build with `tsdown` and packaged compilation with `bun build`.

### `apps/native`

Expo mobile app.

- Uses Expo Router and React Native 0.83.
- Uses Clerk Expo auth, React Query, and shared workspace packages.
- Consumes `@suwa/api` for typed backend access.
- Uses `@suwa/env/native` for mobile-specific env values.
- Includes native health/wearable integrations, so this app is platform-specific and not just UI code.

### `apps/ai-trainer`

Python machine-learning workspace.

- Contains a Python virtual environment, notebook files, raw datasets, processed datasets, and `uv.lock`.
- This is not part of the TypeScript/Bun/Turbo build graph.
- It should be kept separate from commits unless the user explicitly wants changes there.

## Packages

### `packages/api`

Shared typed API layer.

- Defines the ORPC base context and auth-aware procedures.
- Exports router definitions from `src/routers`.
- Bridges Clerk auth into shared server/client types.
- Acts as the contract layer between apps and the server.

### `packages/db`

Database layer.

- Holds Drizzle-based database access and schema/query code.
- Exposes `db:push` and `db:generate` scripts.
- Depends on `@suwa/env` for database configuration.

### `packages/env`

Central environment configuration package.

- Exports separate env modules for `server`, `web`, and `native`.
- Lets each app import only the env schema it needs.
- Keeps runtime configuration consistent across the monorepo.

### `packages/ui`

Shared UI package.

- Provides reusable UI primitives, hooks, global styles, and PostCSS config.
- Intended for reuse across web-facing apps.
- Exports CSS and component paths directly for app imports.

### `packages/infra`

Infrastructure and deployment package.

- Uses Alchemy for dev/deploy/destroy workflows.
- Owns deployment automation rather than application runtime logic.

### `packages/config`

Shared config package.

- Provides shared TypeScript/formatting/linting configuration consumed by the workspace.

## Environment Files

Local `.env` files are present in several app/package folders:

- `apps/server/.env`
- `apps/web/.env`
- `apps/native/.env`
- `packages/infra/.env`

These are per-target environment files, not a single root env file.

## Runtime Flow

1. `apps/web` and `apps/native` consume shared env, UI, and API contracts from `packages/*`.
2. `apps/server` exposes RPC and OpenAPI endpoints using the shared router in `packages/api`.
3. `packages/api` enforces auth-aware procedure boundaries using Clerk context.
4. `packages/db` provides persistence for the server and any shared data access.
5. `packages/env` keeps runtime variables scoped by target runtime.
6. `packages/infra` owns deployment lifecycle, separate from app code.

## Notes

- The main monorepo is organized around `apps/*` and `packages/*`.
- `apps/ai-trainer` is the only clearly separate non-TypeScript subtree and should be treated as an independent project.
- The repo is set up for shared types, shared env, shared UI, and typed RPC rather than isolated app code.

