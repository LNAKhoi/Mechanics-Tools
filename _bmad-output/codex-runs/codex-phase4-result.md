Implemented all Phase 4 review fixes and updated the spec’s Implementation Notes.

- Added accessible, auto-advancing hero/business banner sliders.
- Added banner edit, enable state, and move up/down reordering.
- Added verified image upload to popup editing.
- Hardened Maps URL and rich-text link sanitization.
- Changed content seeding to create only into empty tables.
- Guarded popup storage access.
- Added regression tests for URL lookalikes, link rel attributes, and reseeding.

Verified:

- `npm run build` ✅
- `cd server && npx tsc -p tsconfig.json --noEmit` ✅
- `cd server && npm test` blocked before tests run: Prisma’s schema-engine download is refused by the sandbox proxy (`127.0.0.1:9`).