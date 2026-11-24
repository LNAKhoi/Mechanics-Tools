Completed the Phase 8 import fixes and retained the intentional working-tree changes.

- Fixed case-insensitive SKU confirmation lookup and separated create/update image relation payloads.
- Converted malformed ZIP traversal reader failures to a 400 response.
- Fixed sparse Excel-row handling so trailing empty cells remain valid.
- Formatted the Phase 8 admin/import TypeScript and React files for readability.
- Added implementation notes to the Phase 8 spec.

Verification passed:

- `server`: full `npm test` completed (6 files, 57 declared tests; no failures observed).
- Focused import suite: 9/9 passing.
- `npx tsc -p tsconfig.json --noEmit` passed.
- Root `npm run build` passed.