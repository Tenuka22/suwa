# ZenDoc Codebase Guidelines

## Monorepo Structure

```
zen-doc/
├── apps/
│   ├── native/        # Expo React Native app (patients/users only)
│   ├── server/        # Hono + oRPC backend API (Cloudflare Workers)
│   └── web/           # TanStack Start web app (doctors + admin)
├── packages/
│   ├── api/           # oRPC router definitions (@suwa/api)
│   ├── config/        # Shared TypeScript and tooling config (@suwa/config)
│   ├── db/            # Drizzle ORM schema and queries (@suwa/db)
│   ├── env/           # Environment variable schemas (@suwa/env)
│   ├── infra/         # Alchemy Cloudflare deployment (@suwa/infra)
│   └── ui/            # Shared shadcn/ui primitives (@suwa/ui)
├── knowledge-base/    # Obsidian product documentation
├── turbo.json
├── tsconfig.json
├── biome.jsonc
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Framework | TanStack Start with Vite |
| Web Router | TanStack Router (file-based) |
| Mobile Framework | Expo SDK 55 + Expo Router |
| Mobile Styling | NativeWind v5 (Tailwind for React Native) |
| Server Framework | Hono v4 |
| API Layer | oRPC (type-safe RPC with OpenAPI) |
| Database | Drizzle ORM with SQLite/Turso (Cloudflare D1) |
| Auth | Clerk (`@clerk/tanstack-react-start` web, `@clerk/expo` native) |
| Payments | Stripe (Connected Accounts for doctor payouts) |
| State Management | TanStack React Query v5 |
| UI Components | shadcn/ui (base-lyra style) with @base-ui/react |
| Styling | Tailwind CSS v4 |
| Deployment | Cloudflare Workers via Alchemy |
| Forms | React Hook Form + Zod resolvers |
| Notifications | Sonner (web) |
| Icons | Lucide React / Lucide React Native |
| Charts | Recharts v3 |
| Date Handling | date-fns v4 |

## Package Manager and Tooling

- **Package Manager**: Bun (v1.3.10)
- **Build Orchestrator**: Turborepo
- **Linting/Formatting**: Ultracite (wraps Biome)
- **TypeScript**: v6 strict mode

### Essential Commands

```bash
bun run dev              # Start all apps
bun run dev:web          # Web only
bun run dev:native       # Native only
bun run dev:server       # Server only
bun run build            # Build all
bun run check-types      # Type check all
bun x ultracite check    # Lint check
bun x ultracite fix      # Auto-fix lint and format
bun run db:push          # Push Drizzle schema to DB
bun run db:generate      # Generate Drizzle migrations
bun run deploy           # Deploy to Cloudflare via Alchemy
```

## TypeScript Conventions

### Base Configuration

- Target: ESNext, Module: ESNext with bundler resolution
- `strict: true`, `verbatimModuleSyntax: true`
- `noUncheckedIndexedAccess: true`
- `noUnusedLocals` and `noUnusedParameters` enabled
- Types: `["node", "@cloudflare/workers-types"]`

### Path Aliases

| App | Alias | Maps To |
|-----|-------|---------|
| Web | `@/*` | `./src/*` |
| Server | `@/*` | `./src/*` |
| Native | `@/*` | `*` (root-relative) |

### Import Conventions

- **Workspace packages**: Use package name (`@suwa/api`, `@suwa/db`, `@suwa/ui`, `@suwa/env`)
- **App-local code**: Use `@/` path alias
- **UI components**: `@suwa/ui/components/button`
- **Environment**: `@suwa/env/web`, `@suwa/env/native`, `@suwa/env/server`
- **Database**: `@suwa/db`, `@suwa/db/schemas-types`
- **Cross-package**: Packages export source directly via `"./src/*.ts"` (no build step)

### Type Safety Rules

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use `z.infer` for deriving types from Zod schemas
- Never use barrel files (index files that re-export everything) — prefer specific imports

## Database Patterns (Drizzle)

### Configuration

- Dialect: SQLite
- Driver: `d1-http` (Cloudflare D1)
- Schema: `packages/db/src/schema/`
- Migrations: `packages/db/src/migrations/`

### Schema Design

- All tables use `sqliteTable` from Drizzle
- Primary keys: `userId` (text) for profiles, `id` (text UUID) for entities
- Timestamps: stored as ISO text strings via `text("created_at").notNull().default("CURRENT_TIMESTAMP")`
- Booleans: `integer("field", { mode: "boolean" })`
- Enums: `text("kind", { enum: valuesArray })`
- JSON arrays: stored as text, parsed via helper functions (`parseJsonStringArray`, `stringifyJsonStringArray`)

### Tables

| Table | Primary Key | Description |
|-------|------------|-------------|
| `doctor_profiles` | `userId` | Doctor profile data with JSON string arrays |
| `doctor_sessions` | `id` | Booking sessions with status/payout tracking |
| `doctor_files` | `id` | Doctor media files (portraits, qualifications, videos) |
| `doctor_schedule_entries` | `id` | Schedule blocks (open/block/session kinds) |
| `doctor_education_entries` | `id` | Doctor education history |
| `patient_profiles` | `userId` | Patient alias profiles with guardian linkage |
| `guardian_profiles` | `userId` | Guardian contact info for patient linkage |

### Schemas and Types

Centralized in `packages/db/src/schemas-types/`:

- `values.ts` — `as const` arrays for enum values (schedule kinds, file kinds, doctor specialties, etc.)
- `index.ts` — Shared Zod schemas for input validation
- `types.ts` — TypeScript types derived via `z.infer`

Usage:
```ts
import { doctorFileKindSchema, createScheduleEntrySchema } from "@suwa/db/schemas-types";
import type { DoctorProfileInput, CreateScheduleEntryInput } from "@suwa/db/schemas-types";
```

## API Patterns (oRPC)

### Structure

- **Location**: `packages/api/src/`
- **Context**: `context.ts` defines `ClerkRequestContext` with `auth`, `clerk`, `db`, `session`
- **Procedures**: `publicProcedure` (open), `protectedProcedure` (requires auth via `requireAuth` middleware)

### Router Files

| File | Router | Auth | Purpose |
|------|--------|------|---------|
| `public.ts` | `publicRouter` | Mixed | Health check, list doctors, get doctor details |
| `doctor.ts` | `doctorRouter` | Protected | Doctor profile, schedule management |
| `patient.ts` | `patientRouter` | Protected | Patient onboarding, guardian management |
| `admin.ts` | `adminRouter` | Protected (admin role) | Doctor approval, admin queries |
| `booking.ts` | `bookingRouter` | Protected | Session booking, Stripe Connect |
| `doctor-files.ts` | `doctorFilesRouter` | Mixed | File CRUD with R2 bucket storage |

### Input Validation

All router inputs use Zod schemas from `@suwa/db/schemas-types`:
- `z.iso.datetime()` for datetime fields
- `z.coerce.number()` for numeric inputs
- `.superRefine()` for cross-field validation
- `.catch()` for default fallback values

### Server Integration

- Hono app with CORS and logger middleware
- `OpenAPIHandler` for OpenAPI spec at `/api-reference`
- `RPCHandler` for RPC calls at `/rpc`
- Context created per-request with Clerk auth

## Routing Conventions

### Web (TanStack Router)

- **Location**: `apps/web/src/routes/`
- File-based routing with `createFileRoute()`
- Route tree auto-generated (`routeTree.gen.ts`)
- Root route (`__root.tsx`) provides ClerkProvider, QueryClient, ORPC context
- Layout routes use `<Outlet />`
- Search param validation via `validateSearch`
- Data loading via `loader` with `context.queryClient`

### Native (Expo Router)

- **Location**: `apps/native/app/`
- File-based routing with Expo Router
- Grouped routes via parentheses: `(auth)/`, `(onboarding)/`
- Dynamic routes: `doctors/[doctorId].tsx`
- Root layout (`_layout.tsx`) provides Clerk, QueryClient, font loading
- Onboarding guard redirects un-onboarded users

## UI Component Architecture

### Shared UI Package (`packages/ui/`)

- 55+ shadcn/ui components using `@base-ui/react` primitives
- Style: `base-lyra` (shared) / `base-nova` (web app-specific)
- CSS variables for theming (light/dark)
- Font: Figtree Variable (web)
- Export paths: `@suwa/ui/components/*`, `@suwa/ui/hooks/*`, `@suwa/ui/lib/*`

### Component Pattern

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@suwa/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva("...", {
  variants: { variant, size },
  defaultVariants: { variant: "default", size: "default" },
});

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### Native UI (`apps/native/components/ui/`)

- App-specific components: `button.tsx`, `card.tsx`, `field.tsx`, `screen.tsx`, `text-link.tsx`
- Neo-brutalist design with solid shadows (translate-based press effect)
- Uses NativeWind className strings
- Buttons support `href` prop for Expo Router Link integration

### Styling

- **Web**: Tailwind CSS v4 with `@import "@suwa/ui/globals.css"`
- **Native**: NativeWind with custom theme in `global.css`
- **Shared**: `cn()` utility = `twMerge(clsx(inputs))`
- **Design Tokens**: CSS variables (--background, --foreground, --primary, etc.)

## Environment Variable Management

### Package: `@suwa/env`

| Export | File | Prefix | Variables |
|--------|------|--------|-----------|
| `@suwa/env/server` | `src/server.ts` | N/A | Cloudflare Workers bindings (type-inferred) |
| `@suwa/env/web` | `src/web.ts` | `VITE_` | `VITE_SERVER_URL`, `VITE_WEB_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` |
| `@suwa/env/native` | `src/native.ts` | `EXPO_PUBLIC_` | `EXPO_PUBLIC_SERVER_URL`, `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` |

### Pattern

Uses `@t3-oss/env-core` with Zod validation:

```ts
export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.url(),
    VITE_WEB_URL: z.url(),
    VITE_CLERK_PUBLISHABLE_KEY: z.string(),
    VITE_STRIPE_PUBLISHABLE_KEY: z.string(),
  },
  runtimeEnv: (import.meta as any).env,
  emptyStringAsUndefined: true,
});
```

### Per-App .env Files

- `apps/server/.env` — Server secrets (CLERK_SECRET_KEY, STRIPE_SECRET_KEY, CORS_ORIGIN)
- `apps/web/.env` — Web client vars
- `apps/native/.env` — Native client vars
- `packages/infra/.env` — Deployment vars

## Authentication

- **Provider**: Clerk for all auth (web and native)
- **Bridge**: `ClerkApiAuthBridge` component bridges Clerk token to ORPC client headers
- **Roles**: via Clerk `publicMetadata.role` — `user`, `doctor`, `admin`, `pending-doctor`
- **Protected procedures**: check `context.auth?.userId`
- **Role updates**: done via `context.clerk.users.updateUserMetadata()`

### ORPC Client Setup (shared pattern)

```ts
const link = new RPCLink({
  url: `${env.VITE_SERVER_URL}/rpc`,
  headers: async () => {
    const token = await getClerkAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});
export const orpc = createTanstackQueryUtils(client);
```

## Dependency Flow

```
apps/web ──> @suwa/api, @suwa/env, @suwa/ui
apps/native ──> @suwa/api, @suwa/env
apps/server ──> @suwa/api, @suwa/db, @suwa/env
packages/api ──> @suwa/db, @suwa/env
packages/db ──> @suwa/env
packages/ui ──> (standalone, no internal deps)
packages/env ──> (standalone, uses @t3-oss/env-core)
packages/infra ──> (standalone, deployment only)
packages/config ──> (standalone, config only)
```

## Build and Deployment

### Turborepo Pipeline

- Build depends on `^build` (upstream packages first)
- Build inputs include `.env*` files
- Build outputs: `dist/**`

### Server Build

- Bundler: tsdown
- Format: ESM
- Bundles all `@suwa/*` packages inline (`noExternal`)
- Alternative: `bun build --compile` for native binary

### Web Build

- Vite with TanStack Start plugin
- Alchemy Cloudflare plugin for Workers deployment
- Dev server: port 3001

### Deployment (Alchemy)

- **Infrastructure**: `packages/infra/alchemy.run.ts`
- **Resources**: D1Database, R2Bucket, Worker, TanStackStart
- **Server Worker**: port 3000, Node compatibility
- **Web**: TanStackStart with observability/traces enabled
- **Bindings**: automatically typed and injected
- **Database**: D1 with migrations from `packages/db/src/migrations`
- **Storage**: R2 Bucket for doctor materials (`doctor-materials`)
- **Secrets**: managed via `alchemy.secret.env.*`

## Code Standards (from AGENTS.md)

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### React Patterns

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility

### Error Handling

- Remove `console.log`, `debugger`, and `alert` from production code
- Throw `Error` objects with descriptive messages, not strings
- Use `try-catch` blocks meaningfully
- Prefer early returns over nested conditionals

### Security

- Add `rel="noopener"` when using `target="_blank"`
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

## Notable Patterns

### JSON Storage Pattern

SQLite stores arrays/objects as JSON text. Helper functions in `packages/db/src/doctor-profile.ts`:
- `parseJsonStringArray()` / `stringifyJsonStringArray()` — for string arrays
- `parseJsonApproachSteps()` / `stringifyJsonApproachSteps()` — for approach step objects

### Schedule Management

- Three kinds: `open` (available), `block` (unavailable), `session` (booked)
- Complex interval arithmetic for schedule slot creation
- Multi-day schedule creation with overlap detection and splitting
- Past schedule modifications are blocked

### Stripe Integration

- Connected Accounts for doctor payouts
- Lazy initialization of Stripe instance
- $50 fixed payout per session
- Payout status tracking: none -> pending -> paid/failed

### Design System

- **Web**: Clean dashboard design with OKLCH colors, Figtree font
- **Native**: Neo-brutalist design with solid shadows, Satoshi font, brick red primary (#a22a2a)
- Shared CSS variable naming convention (--background, --foreground, --primary, etc.)

## Product Rules (from PLAN.md)

- `user_id` is the Clerk user ID and should be the primary key
- Users are anonymous by default and identified by alias
- Mobile is for users only; doctors do not use the mobile app
- Doctor mode onboarding happens in the web app
- User mode onboarding happens in the mobile app
- Admin and doctor tools live in the web app
- Web UX should assume larger screens, dense layouts, and dashboard-style workflows
- Crisis handling must be conservative, fast, and auditable

