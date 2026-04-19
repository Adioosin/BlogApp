# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# From repo root
pnpm install           # install all workspace dependencies
pnpm dev               # start frontend + backend concurrently
pnpm build             # build all packages
pnpm test              # run all tests
pnpm lint              # lint all packages
pnpm format            # format all packages

# Scoped commands
pnpm --filter @blogapp/backend dev
pnpm --filter @blogapp/frontend dev
pnpm --filter @blogapp/backend test
pnpm --filter @blogapp/frontend test

# Run a single test file
pnpm --filter @blogapp/backend test src/__tests__/auth.test.ts
pnpm --filter @blogapp/frontend test src/__tests__/login.test.tsx

# Database migrations
pnpm --filter @blogapp/backend exec prisma migrate dev         # apply migrations
pnpm --filter @blogapp/backend exec prisma db seed             # seed data
```

## Architecture

Monorepo with pnpm workspaces:
- `apps/backend` — Express + TypeScript REST API
- `apps/frontend` — React 18 + Vite SPA
- `packages/types` — shared DTOs and API contracts used by both apps

**Backend** (`apps/backend/src/`):
- `index.ts` — app bootstrap, middleware stack
- `routes/` — grouped by domain: `auth`, `posts`, `comments`, `upload`
- `middleware/` — auth JWT verification, Zod validation, ownership checks, rate limiting, error handling
- `services/` — business logic (route handlers delegate here, never contain logic directly)
- `prisma/schema.prisma` — single source of truth for DB schema

**Frontend** (`apps/frontend/src/`):
- `pages/` — route-level components (feed, post detail, login, register, dashboard, editor)
- `components/` — reusable UI
- `hooks/` — auth state and API calls
- `lib/` — Axios API client with 401 interceptor for transparent token refresh

## Key Constraints

**Scope**: Follow `PLAN.md` phase-by-phase. Do not implement features beyond the current phase unless explicitly asked.s

**Drafts**: Implemented via `Post.isPublished = false`. No separate Draft model.

**API shape**:
- All routes prefixed with `/api/v1`
- Success: `{ data: T }`
- Error: `{ error: { message: string, code?: string } }`
- Paginated lists: `{ data: T[], meta: { page, limit, total } }` — accept `page` and `limit` query params

**Auth**: JWT access tokens + refresh tokens with separate signing secrets. Refresh tokens stored as SHA-256 hashes. Tokens stored in memory or httpOnly cookies — never localStorage.

**Security**: Sanitize rich text HTML before rendering (dompurify). Ownership checks (edit/delete) enforced in middleware, not service layer.

**Image upload**: Cloudinary (default). Do not switch to S3 without explicit request.

## Code Style

- File/folder names: `kebab-case`
- Variables/functions: `camelCase`; Types/interfaces/components: `PascalCase`
- Named exports only — no default exports
- Prefer `type` over `interface` unless declaration merging is needed
- Import order: Node built-ins → external packages → internal aliases → relative (blank line between groups)
- Do not return raw Prisma models to the frontend — use explicit DTOs

## Git Conventions

- Branches: `feature/<desc>`, `fix/<desc>`, `chore/<desc>`
- Commits: imperative mood, lowercase, no period — e.g., `add jwt refresh token rotation`
- One logical change per commit

## Environment Variables

Defined in `.env.example` — update it whenever a new variable is introduced.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Access token signing secret |
| `JWT_REFRESH_SECRET` | Refresh token signing secret |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Image upload credentials |
| `PORT` | Backend port (default `3000`) |
| `FRONTEND_URL` | Frontend origin for CORS |

For local development, copy `.env.example` to `.env` in `apps/backend/` and run `pnpm dev` from the repo root.

## Infrastructure

Run `pnpm dev` from the repo root to start both frontend and backend. PostgreSQL must be running separately (e.g. a local install or a standalone `docker compose up -d db`).
