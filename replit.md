# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite 7 + Tailwind CSS v4 + shadcn/ui
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: Privy (`@privy-io/react-auth`)
- **Routing**: wouter

## Replit Workflows

- **Start application** (webview, port 5000) — `cd artifacts/team-index && PORT=5000 BASE_PATH=/ pnpm run dev`. This is the primary webview workflow that serves the frontend in the preview pane. It must explicitly set `PORT=5000` because artifact-managed workflows use system-assigned ports that cannot be overridden.
- **artifacts/api-server: API Server** (artifact-managed) — runs `pnpm --filter @workspace/api-server run dev`, serves the Express API.
- **artifacts/team-index: web** (artifact-managed) — runs the frontend on a system-assigned port for internal artifact purposes. The "Start application" workflow above is what actually serves the preview pane.
- **artifacts/mockup-sandbox: Component Preview Server** (artifact-managed) — component preview sandbox.

## Environment Variables

- `PORT=5000` — frontend dev server port
- `BASE_PATH=/` — Vite base path
- `NODE_ENV=development` — runtime environment
- `VITE_API_BASE_URL=http://localhost:3001` — frontend → API URL
- `VITE_PRIVY_APP_ID` — Privy app ID (public)
- `VITE_USDC_ADDRESS` — USDC contract address (Polygon)
- `VITE_CHILIZ_WRAPPED_SHARE_ADDRESS` — Chiliz wrapped share contract
- `VITE_CHILIZ_DEPOSIT_RECEIVER_ADDRESS` — Chiliz deposit receiver
- `DATABASE_URL` — PostgreSQL connection string (provided by Replit)

## Structure

```text
/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 3001)
│   ├── team-index/         # React/Vite frontend (port 5000)
│   └── mockup-sandbox/     # Component preview server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml     # pnpm workspace config
├── tsconfig.base.json      # Shared TS options
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`).
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/vite.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build` using project references

## Packages

### `artifacts/team-index` (`@workspace/team-index`)

React + Vite frontend. Landing page with Privy authentication.

- Entry: `src/main.tsx` — wraps app in `<PrivyProvider>`
- App: `src/App.tsx` — wouter router, React Query
- Pages: `src/pages/Home.tsx`, `src/pages/Admin.tsx`
- `pnpm run dev` — dev server on port 5000
- `pnpm run build` — builds to `dist/public/`

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App: `src/app.ts` — CORS, JSON parsing, routes at `/api`
- Routes: `src/routes/health.ts` — `GET /api/healthz`
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm run build` — esbuild bundle to `dist/index.mjs`
- `pnpm run start` — runs built bundle

### `lib/db` (`@workspace/db`)

Drizzle ORM + PostgreSQL. Requires `DATABASE_URL`.

- `src/index.ts` — Pool + Drizzle instance + schema exports
- `drizzle.config.ts` — Drizzle Kit config
- `pnpm run push` — push schema to DB

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec (`openapi.yaml`) + Orval config. Codegen targets `lib/api-client-react` and `lib/api-zod`.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts in `src/`. Run via `pnpm --filter @workspace/scripts run <script>`.
