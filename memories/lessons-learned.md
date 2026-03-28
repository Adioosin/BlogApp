# Lessons Learned

## Prisma 7.x Setup (Phase 2)
- Pre-add `prisma`, `@prisma/engines` to `pnpm.onlyBuiltDependencies` in root package.json BEFORE installing prisma
- Prisma 7.x with `prisma-client` generator requires `@prisma/adapter-pg` + `pg` — always install together
- Seed config goes in `migrations.seed` (string), not top-level `seed` object
- `pnpm exec prisma init` is the correct way to init (not npx), since prisma is a workspace devDependency

## Git + GitHub API
- After pushing via GitHub API (mcp_io_github_git_push_files), always `git pull --rebase` locally before making more commits
- Avoid mixing API pushes and local pushes on the same branch when possible

## Testing
- When nesting tests in subdirectories (e.g., `__tests__/middleware/`), adjust relative imports accordingly (`../../` not `../`)

## PR Reviews
- Always read the actual file content before flagging missing items in reviews — avoid false positives

## GitHub PR Review Workflow (Phase 3)
- **GitHub PR Self-Approval Constraint**: Cannot use `APPROVE` event when reviewing your own PRs via GitHub API. GitHub returns "Can not approve your own pull request" error.
- **Solution**: Always use `COMMENT` event instead of `APPROVE` when the PR author and reviewer are the same user
- **Context**: This affects `/raise-pr` workflow and any automated PR review process - must detect ownership and adjust review event accordingly

## Prisma + Test Isolation (Phase 3)
- `lib/prisma.ts` uses eager init — importing any route that touches prisma will throw without `DATABASE_URL`. Use lazy init (Proxy pattern) so tests that import `app.ts` don't need a real DB connection.
- When adding new routes that import prisma, run existing tests FIRST before writing new ones to catch import-time breakage early.

## Auth Implementation Patterns (Phase 3)
- JWT tokens with identical payload generated in the same second produce identical strings. Test rotation behavior (DB calls) not string inequality.
- `bcrypt` requires native build scripts — pre-add to `pnpm.onlyBuiltDependencies` in root `package.json` before installing, same as prisma.
- Present Prisma schema changes to user before applying — backend instructions require explicit confirmation.
