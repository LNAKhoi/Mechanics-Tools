# Phase 7 implementation (for Codex)

Implement `_bmad-output/implementation-artifacts/spec-phase7-ordering-and-customers.md`. The spec is the only source of truth: read all of it, plus every file in its frontmatter `context:` list, before you start. Implement every task, including the tests and the README.

## Resuming
A previous run was interrupted. It left uncommitted changes in `server/prisma/schema.prisma`, `server/prisma/seed-data.ts` and `server/test/helpers.ts`, plus `server/prisma/migrations/20261124090000_orders/`. Review those, keep what matches the spec, fix what doesn't, and finish every remaining task.

## Verify
- `cd server && npm test`
- root `npm run build`
- `cd server && npx tsc -p tsconfig.json --noEmit`
- `node scripts/scan-fixed-widths.mjs`

PostgreSQL runs at 127.0.0.1:5432. If the sandbox blocks the test suite, say so plainly and don't claim it passed; Claude will run it.

## Rules
- Don't modify content inside `<frozen-after-approval>`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Never handle, create or invent admin passwords.
- Record judgment calls under Implementation Notes and tick finished task checkboxes.
- Finish by summarizing what you changed, how you verified it, and anything incomplete or risky.
