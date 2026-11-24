# Phase 8: Excel import bugs found by running the tests (for Codex)

Spec: `_bmad-output/implementation-artifacts/spec-phase8-admin-products-excel.md`. Claude ran `cd server && npx vitest run test/import.test.ts` against the real PostgreSQL. The 54 older tests pass. 2 of the 3 import tests fail, and both failures are real product bugs, not test problems.

## Bug 1: existing SKUs are not updated
```
FAIL reports new, update and invalid rows without saving before confirm
AssertionError: expected { added: 1, updated: +0, skipped: 2 } to deeply equal { added: 1, updated: 1, skipped: 1 }
 ❯ test/import.test.ts:15
```
A row whose SKU already exists ends up skipped instead of updated, so re-importing a file never updates products.
- Find out why the row is skipped. It may be the SKU comparison (case, trim, or the column read from the wrong cell), the row being marked as an error, or confirm not applying updates.
- Matching must be case-insensitive and trimmed, against existing `Product.sku`.
- An update applies only the non-empty cells, as the spec says.

## Bug 2: a wrong template returns 500 instead of 400
```
FAIL rejects wrong templates and denies a missing session
Error: expected 400 "Bad Request", got 500 "Internal Server Error"
TypeError: Cannot read properties of undefined (reading 'sheets')
```
Any file that isn't a valid workbook in the expected template must give a 400 with a clear Vietnamese message, never a 500. That covers:
- a missing "Sản phẩm" sheet
- missing or renamed headers ("File không đúng mẫu: thiếu cột …")
- a non-xlsx or corrupt file
- an empty sheet

Wrap the parsing, and check that the workbook and sheet exist before reading. The streaming-reader workaround recorded in Implementation Notes is the likely cause.

## Missing coverage
`test/import.test.ts` has 3 tests, but the spec's I/O matrix has 10 rows. Add tests for every row:
- preview with a mix of rows
- image matching by file name and by link
- zip matching, a `../evil.jpg` entry, and the uncompressed-size limit (set the limit low through a test hook or a small fixture)
- a fake image file, which gives a warning
- a bad category
- a wrong template
- a duplicate SKU in the file
- a partial update, where only stock changes
- confirming an expired import, or another admin's import (404)
- the 403 for `content_editor`

Use real tiny PNG/JPEG buffers and build the zips in the test.

## Verify
`cd server && npm test`. If the sandbox blocks Prisma, say so; Claude runs it.

## Rules
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Tick the last spec checkbox when done.
- Add to the Implementation Notes, and finish by summarizing.
