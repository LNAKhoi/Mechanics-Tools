Implemented the Phase 8 import fixes and coverage.

- Replaced the crashing ExcelJS streaming parser with guarded workbook parsing that handles template comments and returns clear Vietnamese 400 errors for corrupt, empty, wrong-sheet, and wrong-header files.
- Fixed case-insensitive, trimmed existing-SKU updates through confirmation; partial updates preserve empty fields.
- Added invalid-image warnings and ZIP image/traversal/decompression-limit handling.
- Expanded `server/test/import.test.ts` across the full I/O matrix.
- Marked the test checkbox complete and added implementation notes in the Phase 8 spec.

Verification:
- `cd server && npx tsc -p tsconfig.json --noEmit` passes.
- `cd server && npm test` is blocked before tests run: Prisma attempts to download `schema-engine.exe` from `binaries.prisma.sh`, but sandbox networking is refused.