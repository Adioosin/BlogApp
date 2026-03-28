---
description: 'Generate Vitest and Supertest tests for a given file or module.'
agent: 'agent'
argument-hint: "Which file or module to test (e.g., 'apps/backend/src/services/post-service.ts')"
---

Write tests for the specified file or module. Read the source code first, then generate a comprehensive test file.

## What to generate

1. **Test file** colocated in a `__tests__/` directory next to the source, or in the existing test directory if one is established. Use kebab-case filename with `.test.ts` suffix.
2. **Test cases** covering:
   - Happy path for each exported function or endpoint.
   - Input validation failures (bad types, missing fields, boundary values).
   - Auth and permission checks if the code is protected.
   - Edge cases specific to the logic (empty lists, not-found, duplicate data).
3. **Test setup** — use `beforeEach`/`afterEach` for shared setup. Mock external dependencies (database, external APIs) at the boundary, not deep inside.

## Backend tests

- Use **Vitest** as the test runner and **Supertest** for HTTP endpoint tests.
- For endpoint tests, import the Express app and wrap with `supertest(app)`.
- Assert on status codes, response shape (`{ data }` or `{ error }`), and key field values.
- Test auth-required endpoints both with and without a valid token.
- Test ownership-restricted endpoints with the owner and a different user.

## Frontend tests

- Use **Vitest** with `@testing-library/react` for component tests.
- Test rendering, user interactions, and conditional UI (loading, error, empty states).
- Mock API calls at the hook or API client level, not with global fetch mocks.

## Conventions

- Use `describe` blocks grouped by function or behavior.
- Use descriptive test names: `it('returns 403 when non-owner tries to delete post')`.
- Named exports, camelCase variables, kebab-case filenames.

## Do not

- Modify the source code being tested.
- Add snapshot tests unless explicitly requested.
- Test implementation details (private functions, internal state).
