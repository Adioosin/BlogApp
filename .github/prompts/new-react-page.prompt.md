---
description: 'Scaffold a new React page: page component, route registration, and API hook if the page fetches data.'
agent: 'agent'
argument-hint: "Describe the page (e.g., 'Post detail page — displays a single post with comments')"
---

Scaffold a new page in the frontend app. Create all required files following the project conventions.

## What to generate

1. **Page component** in `apps/frontend/src/pages/` — named export, PascalCase component name, kebab-case filename.
2. **Route entry** — add the route to the existing router configuration. Use lazy loading if the router supports it.
3. **API hook** in `apps/frontend/src/hooks/` — if the page fetches data, create a custom hook that uses the shared API client. Return loading, error, and data states.
4. **Auth guard** — if the page is protected, wrap the route with the existing auth guard component.

## Conventions to follow

- Named exports only, no default exports.
- Use the shared API client from `apps/frontend/src/lib/` — do not use raw `fetch` in components.
- Match API response shapes from `packages/types` if they exist, otherwise define local types.
- Use `camelCase` for variables/functions, `PascalCase` for component and type names.
- Keep the page component focused on layout and composition — extract reusable pieces into `apps/frontend/src/components/` only if they're clearly shared.

## Do not

- Create backend code — this prompt is frontend only.
- Add state management libraries beyond React context and hooks.
- Add UI library dependencies not already in the project.
