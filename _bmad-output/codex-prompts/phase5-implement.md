# Phase 5 implementation (for Codex)

Implement `_bmad-output/implementation-artifacts/spec-phase5-discovery-and-seo.md`. The spec is the only source of truth: read all of it, plus every file in its frontmatter `context:` list, before you start.

## Verify
- `cd server && npm test`
- root `npm run build`
- `cd server && npx tsc -p tsconfig.json --noEmit`

PostgreSQL runs at 127.0.0.1:5432 in Docker. The `unaccent` extension must be created by a Prisma migration, not by hand. If the sandbox blocks the full test suite, for example because Prisma's engine download is refused, say so plainly and don't claim it passed. The owner's side will run it.

## Rules
- Don't start a BMAD workflow (bmad-build or similar). Implement the spec directly.
- The working tree may have uncommitted changes. They are intentional; start from them without asking.
- Don't modify content inside `<frozen-after-approval>`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Never handle, create or invent admin passwords.
- Work on your own and don't stop to ask. When something is unclear, pick the safest option consistent with the spec and record it under Implementation Notes.
- Tick each finished task checkbox in the spec.
- Finish by summarizing what you changed, how you verified it, and anything incomplete or risky.
