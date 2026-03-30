# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development via Docker (recommended — includes PostgreSQL)
pnpm docker:up          # build and start all services
pnpm docker:down        # stop all services
pnpm docker:db          # start only the database (detached)

# Development without Docker (requires local PostgreSQL + .env)
pnpm dev                # starts frontend :5173 + backend :3000 concurrently
pnpm --filter @blogapp/backend dev
pnpm --filter @blogapp/frontend dev

# Build
pnpm build

# Test (all)
pnpm test

# Test (single app)
pnpm --filter @blogapp/backend test
pnpm --filter @blogapp/frontend test

# Test (single file)
pnpm --filter @blogapp/backend test -- src/__tests__/routes/auth.test.ts
pnpm --filter @blogapp/frontend test -- src/__tests__/pages/login.test.tsx

# Lint / Format
pnpm lint
pnpm format
pnpm format:check
```

## Architecture

Monorepo (pnpm workspaces) with three packages:

- **`apps/backend`** — Express + TypeScript REST API, Prisma + PostgreSQL, JWT auth
- **`apps/frontend`** — React 18 + TypeScript + Vite, TipTap rich text editor, Tailwind CSS
- **`packages/types`** — Shared DTOs and API contract types used by both apps

### Backend structure

Routes → Services → Prisma. Middleware pipeline: `validate` → `authenticate` / `optionalAuth` → `requireOwnership` → handler → `errorHandler`.

- `src/routes/` — HTTP layer, calls services
- `src/services/` — Business logic
- `src/middleware/` — Auth (`authenticate`, `optionalAuth`), Zod validation (`validate`), ownership checks, rate limiting, error handling
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/env.ts` — Validated env vars

### Frontend structure

- `src/pages/` — Route-level components (home, post-detail, login, register, dashboard, editor)
- `src/components/` — Reusable UI; `auth-provider.tsx` holds auth state via React context
- `src/hooks/use-auth.ts` — Hook to access auth context
- `src/lib/api-client.ts` — Axios instance with interceptors: attaches tokens, handles 401 → refresh → retry

### API conventions

- All routes prefixed `/api/v1`
- Success: `{ data: T }`
- Error: `{ error: { message: string, code?: string } }`
- Paginated: `{ data: T[], meta: { page, limit, total } }` — query params `page` and `limit`

### Auth

- JWT access token (15m) + refresh token (7d, stored hashed as SHA-256)
- Tokens kept **in memory only** (never localStorage)
- Frontend auto-refreshes on 401 via Axios interceptor

### Data constraints

- `Post.isPublished` flag for drafts — no separate Draft model
- Unpublished posts visible to author only
- Comments only allowed on published posts; deletion limited to comment author
- Rich text stored as HTML; always sanitize with DOMPurify before rendering

## Code Style

- **File/folder names**: `kebab-case`
- **Exports**: named exports only (no default exports)
- **Types**: prefer `type` over `interface` unless declaration merging is needed
- **Import order**: Node built-ins → external packages → internal aliases → relative imports, blank lines between groups
- **Git branches**: `feature/<desc>`, `fix/<desc>`, `chore/<desc>`
- **Commit messages**: imperative, lowercase, no period (e.g., `add jwt refresh token rotation`)

## Key Constraints

- Do not introduce libraries outside the pinned set without discussing tradeoffs. Pinned: Zod (validation), bcrypt (passwords), TipTap (editor), Vitest + Supertest (testing).
- Do not leak Prisma models to the frontend — use DTOs from `@blogapp/types`.
- Before modifying the Prisma schema (models, fields, relations, indexes), present the proposed changes and wait for explicit confirmation.
- Use Docker (`docker-compose.yml`) for infrastructure dependencies (databases, etc.) — do not install services directly on the host.
- Keep `packages/types` in sync when changing API request/response shapes.
- Update `.env.example` whenever a new required environment variable is introduced.

## Environment Variables

See `.env.example`. Key vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CLOUDINARY_*` (image uploads), `PORT`, `FRONTEND_URL`.
