# BlogApp Copilot Instructions

This repository is a greenfield blogging platform MVP being built as a monorepo.

## Product Scope

- Build an MVP blogging platform with registration, login, multi-author posts, drafts, publishing, comments, rich text editing, and image upload.
- Keep the first release focused. Do not add moderation, search, tags, likes, profiles, notifications, or other non-MVP features unless explicitly requested.
- Prioritize auth and core content workflows before editor polish or deployment hardening.

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

## Architecture Decisions

- Drafts are stored in the `Post` table using an `isPublished` flag. Do not introduce a separate `Draft` model unless explicitly asked.
- Unpublished drafts must only be visible to their author.
- Editing and deletion must enforce ownership checks.
- Comments are only allowed on published posts.
- Comment deletion should be limited to the comment author unless moderation support is explicitly introduced.
- Rich text output must be sanitized before rendering.
- For image uploads, prefer Cloudinary for fastest MVP delivery or S3 with presigned URLs if tighter storage control is requested.

## Delivery Order

When planning or implementing work, follow this order unless the user says otherwise:

1. Project foundation and workspace setup.
2. Backend core, Prisma schema, and database integration.
3. Authentication and authorization.
4. Post authoring, drafts, publishing, and feed APIs.
5. Commenting and basic anti-spam protections.
6. Frontend shell, routing, auth state, and protected pages.
7. Editor integration, draft UX, sanitization, and image upload.
8. Tests, verification, and deployment hardening.

## Backend Guidance

- Organize backend code with clear separation between routes, middleware, and business logic.
- Add request validation for external inputs.
- Add centralized error handling instead of duplicating response logic.
- Enforce auth and authorization in protected routes.
- Add pagination and sorting for public post listing endpoints.
- Prefer explicit DTOs and predictable JSON responses over ad hoc response shapes.

## Frontend Guidance

- Organize the app around routes for home/feed, post details, login/register, dashboard or my posts, and post editor.
- Include API client utilities and shared auth-state handling rather than scattering fetch logic across components.
- Protect authenticated routes and handle expired sessions cleanly.
- Keep UI implementation aligned with the existing architecture plan rather than introducing extra state-management libraries without a clear need.

## Shared Types And Contracts

- If both frontend and backend need the same request or response shapes, prefer a shared `packages/types` package.
- Keep API contracts stable and update both sides together when changing them.
- Avoid leaking Prisma models directly to the frontend when a dedicated DTO is clearer.

## Testing Expectations

- Add or update tests for behavior that changes.
- Backend priority tests: auth flows, permissions, drafts, publishing, posts, and comments.
- Frontend priority tests: login, protected-route behavior, post creation and editing, publishing, and comment submission.
- When implementing security-sensitive features, include verification for authorization and data visibility.

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