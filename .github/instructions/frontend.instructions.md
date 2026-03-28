---
description: 'Use when editing frontend code: React components, pages, hooks, API client, or routing in apps/frontend.'
applyTo: 'apps/frontend/**'
---

# Frontend Guidelines

## Project Structure

- `src/pages/` — Route-level components (home/feed, post detail, login, register, dashboard, editor).
- `src/components/` — Reusable UI components.
- `src/hooks/` — Custom hooks for auth state, API calls, etc.
- `src/lib/` — API client, utilities, and constants.

## Patterns

- Organize the app around routes: home/feed, post details, login/register, dashboard/my-posts, and post editor.
- Use a shared API client module instead of scattering fetch logic across components.
- Manage auth state (tokens, user info) in a single context or hook, not per-component.
- Protect authenticated routes with a guard component that redirects to login.
- Handle expired sessions and token refresh transparently to the user.

## State Management

- Use React context and hooks for auth and lightweight shared state.
- Do not introduce external state-management libraries (Redux, Zustand, etc.) unless the need is clearly justified.
- Colocate component state — lift only when two or more siblings need the same data.

## Forms and Validation

- Validate user inputs with Zod schemas, matching the backend validation where applicable.
- Show inline validation errors, not just toast messages.

## Security

- Sanitize any rich text / HTML content before rendering with `dangerouslySetInnerHTML`.
- Store tokens in memory or httpOnly cookies — never in localStorage.
- Do not expose API secrets or backend URLs beyond the configured API base.
