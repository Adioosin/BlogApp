---
description: 'Scaffold a new backend API endpoint: route, Zod validation schema, service function, and test file.'
agent: 'agent'
argument-hint: "Describe the endpoint (e.g., 'GET /posts/:id — fetch a single published post')"
---

Scaffold a new API endpoint in the backend. Create all required files following the project conventions.

## What to generate

1. **Zod validation schema** in the appropriate route file or a shared validation file — cover params, query, and body as needed.
2. **Service function** in `apps/backend/src/services/` — business logic only, no request/response objects.
3. **Route handler** in `apps/backend/src/routes/` — validate input with Zod, call the service, return the response.
4. **Register the route** in the existing router setup if one exists for that domain, or create a new router file and note where to mount it.
5. **Test file** in `apps/backend/src/__tests__/` or colocated — use Vitest and Supertest, cover the happy path and at least one error case.

## Conventions to follow

- Route prefix: `/api/v1`
- Success: `{ data: T }` — Error: `{ error: { message, code? } }`
- Use named exports, kebab-case filenames, camelCase functions.
- Add auth middleware if the endpoint requires authentication.
- Add ownership checks if the endpoint modifies a user-owned resource.
- If the endpoint is paginated, accept `page` and `limit` query params and return `{ data: T[], meta: { page, limit, total } }`.

## Do not

- Create frontend code — this prompt is backend only.
- Add features beyond what the endpoint needs.
