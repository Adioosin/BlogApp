## Plan: Blogging Web App MVP

Build a blogging platform as a monorepo with a React + TypeScript frontend and a separate Express + TypeScript backend backed by PostgreSQL. The MVP supports registration/login, multi-author post creation, drafts, publishing, comments, rich text editing, and image upload. Prioritize auth and core content flows first, then layer in editor/media features and production hardening.

**Steps**

1. Phase 1: Project foundation
   Create the workspace structure as a monorepo with apps/frontend, apps/backend, and optionally packages/types for shared DTOs. Establish pnpm workspace, TypeScript config, environment variable conventions (.env.example), ESLint + Prettier, and baseline README/setup docs. This phase blocks all later work.
   **Done when:** `pnpm install` succeeds from root, `pnpm dev` starts both apps (even if they only return a placeholder response), linting passes with zero errors, and .env.example exists with documented variables.

2. Phase 2: Backend core and database design
   Set up the Express API, Prisma, and PostgreSQL connection. Model User, Post, and Comment with draft support implemented as Post.isPublished=false rather than a separate Draft table. Add migrations, seed strategy, Zod request validation, and centralized error handling. Stub a health-check route.
   **Done when:** `pnpm --filter backend dev` starts the server, `GET /api/v1/health` returns 200, Prisma migrations run cleanly against a local database, and seed script is idempotent.

3. Phase 3: Authentication and authorization
   Implement email/password registration and login using bcrypt-hashed passwords, JWT access tokens, and refresh tokens. Add auth middleware, protected routes, and ownership-check middleware so only authenticated users can create posts and only owners can edit/delete their own resources.
   **Done when:** register → login → access protected route → refresh token → reject expired token all work via API calls. A non-owner receives 403 when attempting to edit another user's resource.

4. Phase 4: Post authoring and publishing
   Implement API endpoints for listing published posts, fetching a single post, creating drafts, updating drafts/posts, publishing drafts, and deleting posts. Add pagination and sorting to the post list. Ensure unpublished drafts are visible only to their author.
   **Done when:** CRUD operations work, paginated list returns correct meta, a draft is invisible to other users and anonymous requests, and publishing flips visibility.

5. Phase 5: Commenting
   Add comment creation, retrieval, and deletion on published posts. Restrict deletion to the comment author. Add basic rate limiting to comment creation to reduce spam risk.
   **Done when:** comments can be created on published posts, attempting to comment on a draft returns 404, delete is restricted to the comment author, and rate limiting rejects excessive requests.

6. Phase 6: Frontend app shell and routing
   Build the React app structure with routes for home/feed, post details, login/register, dashboard/my-posts, and post editor. Add API client utilities, auth state management (context + hooks), protected-route guard, and baseline page layouts. This can begin in parallel with steps 2-3 once API contracts are defined, but full integration depends on steps 3-5.
   **Done when:** all routes render, login/register forms submit to the backend, protected routes redirect unauthenticated users to login, and token refresh happens transparently.

7. Phase 7: Editor, draft UX, and image upload
   Integrate TipTap rich text editor in the post editor flow and support draft save/publish actions. Add image upload via Cloudinary (or S3 if requested). Sanitize rendered rich text to prevent XSS.
   **Done when:** a post can be authored with rich text and images, saved as draft, published, and rendered on the detail page with sanitized HTML. A `<script>` tag in post content does not execute.

8. Phase 8: Testing and launch hardening
   Add backend integration tests (Vitest + Supertest) for auth, posts, permissions, drafts, and comments. Add frontend tests (Vitest + Testing Library) for login, post creation/editing, publishing, and comment submission. Perform manual end-to-end verification, configure logging/error monitoring, and prepare deployment.
   **Done when:** `pnpm test` passes across both apps, all verification scenarios below have been validated, and the app runs with production environment variables.

**Relevant files**

- package.json — workspace root, scripts, and monorepo configuration.
- apps/frontend/package.json — frontend dependencies and scripts.
- apps/frontend/src/ — React pages, components, API client, auth state, and editor integration.
- apps/backend/package.json — backend dependencies and scripts.
- apps/backend/src/index.ts — API bootstrap.
- apps/backend/src/routes/ — auth, posts, comments, upload routes.
- apps/backend/src/middleware/ — auth, validation, error handling, rate limiting.
- apps/backend/src/services/ — business logic for auth, posts, comments, uploads.
- apps/backend/prisma/schema.prisma — database schema and relations.
- packages/types/index.ts — shared request/response types if the monorepo shares contracts.
- .env.example — required environment variables for API, DB, JWT, and storage.

**Verification**

1. Confirm local setup can start frontend and backend independently and together from the workspace root.
2. Verify the auth flow: register, login, refresh token, protected route access, logout/expired-session behavior.
3. Verify authoring flow: create draft, edit draft, publish post, view published post in public feed, confirm drafts remain private.
4. Verify commenting flow: comment on a published post, load comments on the post detail page, and enforce delete permissions.
5. Verify rich text sanitization by testing malicious HTML/script input and ensuring it is not executed when rendered.
6. Verify image upload end-to-end, including upload failure handling and image rendering inside posts.
7. Run backend automated tests for auth, posts, and comments; run frontend tests for the main user flows.
8. Smoke-test the deployed frontend and backend with production environment variables.

**Decisions**

- Included in MVP: registration/login, multi-author posting, drafts, publish flow, comments, rich text editor, image upload.
- Stack: React 18 + TypeScript + Vite for frontend, Express + TypeScript for backend, PostgreSQL + Prisma for persistence.
- Package manager: pnpm with workspace support.
- Pinned libraries: Zod (validation), bcrypt (password hashing), TipTap (rich text editor), Vitest + Supertest (testing), ESLint + Prettier (linting/formatting).
- Repository layout: single monorepo to keep frontend/backend changes coordinated.
- Auth: email/password with JWT access + refresh tokens for the first version.
- Drafts: stored in the Post table via an isPublished flag instead of a separate Draft model.
- Image upload: Cloudinary for fastest MVP delivery; S3 with presigned URLs if tighter storage control is requested.

**Further Considerations**

1. Deployment choice: Vercel for frontend plus Render/Railway for backend is the fastest path; containerized deployment can wait until after MVP validation.
2. Moderation/admin tooling is intentionally excluded from MVP and should be planned as a later phase if abuse becomes a real issue.
3. Search, tags/categories, likes, profiles, and notifications are also excluded from MVP to keep the first release focused.
