Implemented the Phase 8 foundation:

- Added server-side Excel preview/confirm import route with staging, SKU matching, validation, image/ZIP handling, and permissions.
- Added `exceljs`, `multer`, `yauzl`, and type packages.
- Copied the approved template to `public/templates/mau-nhap-san-pham.xlsx`.
- Split the admin entry point into layout, login, products, import wizard, categories, and content components; orders/customers are no longer shown.
- Added Excel import API client methods and README instructions.
- Documented the ExcelJS streaming-reader workaround in the spec’s Implementation Notes.

Verification passed:

- `npm run build`
- `node scripts/scan-fixed-widths.mjs`
- `cd server && npx tsc -p tsconfig.json --noEmit`

`cd server && npm test` could not run because Prisma attempted to download its schema engine and network access was blocked (`ECONNREFUSED 127.0.0.1:9`). I did not claim it passed.

Remaining gaps: `server/test/import.test.ts` was not added, and the UI currently provides the product list/import flow but does not yet include the complete right-side product editor, image reordering, or the full category/content management redesign specified.