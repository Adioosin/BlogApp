## Plan: Blogging Web App MVP

Build a greenfield blogging platform as a monorepo with a React + TypeScript frontend and a separate Express + TypeScript backend backed by PostgreSQL. The MVP supports registration/login, multi-author post creation, drafts, publishing, comments, rich text editing, and image upload. Prioritize auth and core content flows first, then layer in editor/media features and production hardening.

**Steps**
1. Phase 1: Project foundation
   Create the workspace structure as a monorepo with apps/frontend, apps/backend, and optionally packages/types for shared DTOs. Establish package management, TypeScript config, environment variable conventions, linting, formatting, and baseline README/setup docs. This phase blocks all later work.
2. Phase 2: Backend core and database design
   Set up the Express API, Prisma, and PostgreSQL connection. Model User, Post, and Comment with draft support implemented as Post.isPublished=false rather than a separate Draft table. Add migrations, seed strategy, request validation, error handling, and auth middleware. This depends on step 1.
3. Phase 3: Authentication and authorization
   Implement email/password registration and login using hashed passwords and JWT access tokens with refresh tokens. Add protected routes and ownership checks so only authenticated users can create posts and only owners can edit/delete their posts or comments. This depends on step 2.
4. Phase 4: Post authoring and publishing
   Implement API endpoints for listing published posts, fetching a single post, creating drafts, updating drafts/posts, publishing drafts, and deleting posts. Define pagination and sorting for the post list and ensure unpublished drafts are visible only to their author. This depends on step 3.
5. Phase 5: Commenting
   Add comment creation, retrieval, and deletion on published posts. Restrict deletion to the comment author or optionally post owner if moderation is later added. Add basic rate limiting to comment creation to reduce spam risk. This depends on step 4.
6. Phase 6: Frontend app shell and routing
   Build the React app structure with routes for home/feed, post details, login/register, dashboard/my posts, and post editor. Add API client utilities, auth state management, protected-route handling, and baseline page layouts. This can begin in parallel with steps 2-3 once the API contracts are defined, but full integration depends on steps 3-5.
7. Phase 7: Editor, draft UX, and image upload
   Integrate a rich text editor in the post editor flow and support draft save/publish actions. Add image upload using either Cloudinary for faster MVP delivery or S3 with presigned URLs if tighter storage control is required. Sanitize rendered rich text to avoid XSS. This depends on steps 4 and 6.
8. Phase 8: Testing and launch hardening
   Add backend integration tests for auth, posts, permissions, drafts, and comments. Add frontend tests for login, post creation/editing, publishing, and comment submission. Perform manual end-to-end verification, configure logging/error monitoring, and prepare deployment for frontend and backend. This depends on all earlier steps.

**Relevant files**
- /Users/adioosin/Documents/Personal/BlogApp/package.json - workspace root, scripts, and monorepo configuration.
- /Users/adioosin/Documents/Personal/BlogApp/apps/frontend/package.json - frontend dependencies and scripts.
- /Users/adioosin/Documents/Personal/BlogApp/apps/frontend/src - React pages, components, API client, auth state, and editor integration.
- /Users/adioosin/Documents/Personal/BlogApp/apps/backend/package.json - backend dependencies and scripts.
- /Users/adioosin/Documents/Personal/BlogApp/apps/backend/src/index.ts - API bootstrap.
- /Users/adioosin/Documents/Personal/BlogApp/apps/backend/src/routes - auth, posts, comments, upload routes.
- /Users/adioosin/Documents/Personal/BlogApp/apps/backend/src/middleware - auth, validation, error handling, rate limiting.
- /Users/adioosin/Documents/Personal/BlogApp/apps/backend/src/services - business logic for auth, posts, comments, uploads.
- /Users/adioosin/Documents/Personal/BlogApp/apps/backend/prisma/schema.prisma - database schema and relations.
- /Users/adioosin/Documents/Personal/BlogApp/packages/types/index.ts - shared request/response types if the monorepo shares contracts.
- /Users/adioosin/Documents/Personal/BlogApp/.env.example - required environment variables for API, DB, JWT, and storage.

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
- Recommended concrete stack: React 18 + TypeScript + Vite for frontend, Express + TypeScript for backend, PostgreSQL + Prisma for persistence.
- Recommended repository layout: single monorepo to keep frontend/backend changes coordinated.
- Auth recommendation: email/password with access + refresh tokens for the first version.
- Draft recommendation: store drafts in the Post table via an isPublished flag instead of introducing a separate Draft model.
- Image upload recommendation: choose Cloudinary if speed of delivery matters most; choose S3 if tighter storage ownership matters more.

**Further Considerations**
1. Deployment choice: Vercel for frontend plus Render/Railway for backend is the fastest path; containerized deployment can wait until after MVP validation.
2. Moderation/admin tooling is intentionally excluded from MVP and should be planned as a later phase if abuse becomes a real issue.
3. Search, tags/categories, likes, profiles, and notifications are also excluded from MVP to keep the first release focused.