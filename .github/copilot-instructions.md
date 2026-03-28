# BlogApp Copilot Instructions

This repository is a blogging platform MVP being built as a monorepo. See `PLAN.md` for product scope, delivery phases, and verification criteria. Do not add features beyond the current phase unless explicitly requested.

## Expected Repository Shape

- Use a monorepo layout with `apps/frontend`, `apps/backend`, and optionally `packages/types` for shared DTOs and API contracts.
- Keep frontend and backend changes coordinated through shared types or clearly defined API contracts.
- Prefer small, additive changes that fit the planned repo structure instead of introducing parallel patterns.

## Preferred Stack

- Frontend: React 18, TypeScript, and Vite.
- Backend: Express with TypeScript.
- Database: PostgreSQL with Prisma.
- Authentication: email/password with hashed passwords, JWT access tokens, and refresh tokens.

If proposing an alternative, explain the tradeoff and keep it compatible with the monorepo plan.

## Pinned Libraries

- Package manager: pnpm with workspace support.
- Validation: Zod for request validation on both backend and frontend.
- Password hashing: bcrypt.
- Rich text editor: TipTap.
- Testing: Vitest for unit and integration tests, Supertest for API endpoint testing.
- Linting and formatting: ESLint with Prettier (single config at root).

Do not introduce alternatives without discussing the tradeoff first.

## Architecture Constraints

- Use an `isPublished` flag on the `Post` table for drafts. No separate `Draft` model.
- Unpublished drafts are only visible to their author.
- Enforce ownership checks on edit and delete operations.
- Comments are only allowed on published posts.
- Comment deletion is limited to the comment author.
- Sanitize rich text output before rendering.
- Prefer Cloudinary for image uploads unless S3 is explicitly requested.

## API Conventions

- All backend routes are prefixed with `/api/v1`.
- Success responses follow the shape: `{ data: T }`.
- Error responses follow the shape: `{ error: { message: string, code?: string } }`.
- Use standard HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 500 Internal Server Error.
- Paginated list endpoints accept `page` and `limit` query params and return `{ data: T[], meta: { page, limit, total } }`.

## Area-Specific Guidance

Detailed backend and frontend guidance lives in scoped instruction files that load automatically when editing files in those areas:
- Backend: `.github/instructions/backend.instructions.md` (applies to `apps/backend/**`)
- Frontend: `.github/instructions/frontend.instructions.md` (applies to `apps/frontend/**`)

## Code Style

- Use `kebab-case` for file and folder names (e.g., `auth-middleware.ts`, `post-service.ts`).
- Use named exports, not default exports.
- Use `camelCase` for variables and functions, `PascalCase` for types, interfaces, and React components.
- Prefer `type` over `interface` unless declaration merging is needed.
- Import order: Node built-ins, external packages, internal aliases, relative imports — separated by blank lines.

## Git Conventions

- Branch naming: `feature/<short-description>`, `fix/<short-description>`, `chore/<short-description>`.
- Commit messages: imperative mood, lowercase, no period. Example: `add jwt refresh token rotation`.
- Keep commits focused on a single logical change.

## Environment Variables

The `.env.example` file must document every required variable. Current expected variables:

- `DATABASE_URL` — PostgreSQL connection string.
- `JWT_ACCESS_SECRET` — Secret for signing access tokens.
- `JWT_REFRESH_SECRET` — Secret for signing refresh tokens.
- `JWT_ACCESS_EXPIRES_IN` — Access token TTL (e.g., `15m`).
- `JWT_REFRESH_EXPIRES_IN` — Refresh token TTL (e.g., `7d`).
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Image upload credentials (when Cloudinary is chosen).
- `PORT` — Backend server port (default `3000`).
- `FRONTEND_URL` — Frontend origin for CORS configuration.

Update `.env.example` whenever a new variable is introduced.

## Shared Types And Contracts

- If both frontend and backend need the same request or response shapes, prefer a shared `packages/types` package.
- Keep API contracts stable and update both sides together when changing them.
- Avoid leaking Prisma models directly to the frontend when a dedicated DTO is clearer.

## Testing Expectations

- Add or update tests for every new feature, bug fix, or behavioral change.
- Always run the full test suite before pushing changes. If any test fails, investigate the root cause and fix the implementation or the test as needed — do not push with failing tests.
- Backend priority tests: auth flows, permissions, drafts, publishing, posts, and comments.
- Frontend priority tests: login, protected-route behavior, post creation and editing, publishing, and comment submission.
- When implementing security-sensitive features, include verification for authorization and data visibility.

## Infrastructure

- When spinning up services like databases, caches, or message brokers, use Docker (e.g., `docker compose`) instead of installing them directly on the host machine.
- Include or update a `docker-compose.yml` at the repo root for any infrastructure dependencies.

## Schema Changes

- Before creating a new Prisma schema or modifying an existing one (adding/removing models, fields, relations, or indexes), present the proposed changes to the user and wait for explicit confirmation before applying them.
- This applies to any migration-generating change, not just the initial schema.

## Working Style

- Favor incremental slices that leave the repo runnable.
- Do not implement unrelated extras beyond the current phase.
- Keep code and configuration consistent across the monorepo.
- Prefer root-cause fixes over temporary patches.
- Update setup docs and `.env.example` when introducing new required configuration.

## When Unsure

- Use the MVP plan as the source of truth for scope and sequencing.
- Ask before expanding scope beyond the planned feature set.
- If the codebase is still being scaffolded, create the minimal structure needed for the current phase instead of speculative abstractions.
- When in doubt about a library or pattern choice, check the Pinned Libraries section above before picking an alternative.