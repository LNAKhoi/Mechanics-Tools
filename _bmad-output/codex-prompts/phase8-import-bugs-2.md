# Phase 8: Excel import, round 3 (for Codex)

Spec: `_bmad-output/implementation-artifacts/spec-phase8-admin-products-excel.md`.

## You can run the tests yourself
Prisma doesn't need to download anything; the engines are already installed. Set these in the shell before running tests (PowerShell):

```
$env:PRISMA_SCHEMA_ENGINE_BINARY = "C:\Users\lnakh\Desktop\Mechanics-Tools\server\node_modules\@prisma\engines\schema-engine-windows.exe"
$env:PRISMA_QUERY_ENGINE_LIBRARY = "C:\Users\lnakh\Desktop\Mechanics-Tools\server\node_modules\.prisma\client\query_engine-windows.dll.node"
$env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1"
cd server; npx vitest run test/import.test.ts
```

PostgreSQL runs at 127.0.0.1:5432. Iterate until `npm test` passes in full. Only if it still can't start, report the exact error.

## Current failures (Claude's run): 5 of 9 import tests
```
PrismaClientValidationError: Invalid `tx.product.findUnique()` invocation
  in src/routes/admin-import.ts:145 (confirm handler)
Error: invalid relative path: ../            (zip handling, gives 500 instead of 400)
FAIL reports new, update and invalid rows...     expected 200, got 500
FAIL matches uploaded names and https links...   expected 200, got 500
FAIL matches images in a zip and rejects unsafe or oversized zip input   expected 400, got 500
FAIL marks bad categories and duplicate file SKUs    expected {added:1,updated:0,skipped:2}, got {added:0,updated:0,skipped:3}
FAIL applies only populated fields when updating an existing SKU   expected {updated:1}, got {skipped:1}
```

The likely causes are below. Verify each one; don't assume.
1. **`findUnique` on SKU:** `Product.sku` may not be `@unique` in the schema, or the call passes `mode: 'insensitive'`, which `findUnique` doesn't accept. For case-insensitive SKU matching, use `findFirst({ where: { sku: { equals: sku, mode: 'insensitive' } } })`. Or normalize SKUs to a stored form, but don't change existing data.
2. **Zip entries:** yauzl throws "invalid relative path: ../" for traversal entries before your code sees them. Catch that, and any other yauzl or entry error, and return 400 "File .zip không hợp lệ", never 500.
3. **Errors from confirm:** these probably cascade into "everything skipped". Once confirm stops throwing, re-check the counts.

## Code quality, required
`server/src/routes/admin-import.ts` is written as very long single-line statements (line 143 holds a whole handler). That's why bugs hide in it. Rewrite it as normal readable TypeScript, keeping the behavior:
- small named functions for parsing the sheet, validating a row, matching images, reading the zip, and confirming
- one statement per line

Apply the same to any other new Phase 8 files written that way, including the `src/pages/admin/*` components.

## Done means
- `npm test` passes in full (all files) with the env vars above, and your summary includes the passing test counts
- root `npm run build` passes
- `cd server && npx tsc -p tsconfig.json --noEmit` passes

## Rules
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Add to the Implementation Notes, and finish by summarizing.
