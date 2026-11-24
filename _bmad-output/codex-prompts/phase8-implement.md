# Phase 8 implementation (for Codex)

Implement `_bmad-output/implementation-artifacts/spec-phase8-admin-products-excel.md`. The spec is the only source of truth: read all of it, plus the files in its frontmatter `context:` list, before you start. The approved Excel template is `_bmad-output/templates/mau-nhap-san-pham.xlsx`. Read it with exceljs to see the exact headers, data validations and example rows.

Do every task: the server import, tests, the template copy, the admin UI redesign and the README.

## Verify
- `cd server && npm test`
- root `npm run build`
- `cd server && npx tsc -p tsconfig.json --noEmit`
- `node scripts/scan-fixed-widths.mjs`

PostgreSQL runs at 127.0.0.1:5432. If the sandbox blocks the test suite, say so plainly and don't claim it passed; Claude will run it. Installing `exceljs`, `multer` (or `busboy`) and `yauzl` (plus types) in `server/` is approved.

## Rules
- Don't modify content inside `<frozen-after-approval>`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Never handle, create or invent admin passwords.
- Record judgment calls under Implementation Notes and tick finished task checkboxes.
- Finish by summarizing what you changed, how you verified it, and anything incomplete or risky.
