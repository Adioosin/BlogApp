---
description: 'Use when editing backend code: Express routes, middleware, Prisma models, services, or API logic in apps/backend.'
applyTo: 'apps/backend/**'
---

# Backend Guidelines

## Project Structure

- `src/routes/` — Route definitions grouped by domain (auth, posts, comments, upload).
- `src/middleware/` — Auth, validation, error handling, rate limiting.
- `src/services/` — Business logic, separated from route handlers.
- `prisma/` — Schema, migrations, and seed files.

## Patterns

- Organize code with clear separation between routes, middleware, and services. Route handlers should delegate to services.
- Validate all external inputs with Zod schemas before processing.
- Use a centralized error handler instead of duplicating try/catch and response logic in every route.
- Enforce auth and authorization in middleware, not inside service logic.
- Ownership checks (edit, delete) go through middleware or a shared guard.
- Use explicit DTOs for responses — do not return raw Prisma models.

## API Routes

- All routes are prefixed with `/api/v1`.
- Paginated list endpoints accept `page` and `limit` query params.
- Return `{ data: T }` for success, `{ error: { message, code? } }` for errors.

## Database

- Use Prisma for all database access. Do not write raw SQL unless Prisma cannot express the query.
- Keep migrations reversible when possible.
- Seed data should be idempotent.

## Security

- Hash passwords with bcrypt before storing.
- Sign JWTs with separate secrets for access and refresh tokens.
- Never log secrets, tokens, or passwords.
- Sanitize any user-generated HTML before storage or rendering.
