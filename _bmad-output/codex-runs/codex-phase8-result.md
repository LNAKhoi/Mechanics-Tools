Completed the Phase 8 product-editor polish.

- Updated [ProductEditor.tsx](C:\Users\lnakh\Desktop\Mechanics-Tools\src\pages\admin\ProductEditor.tsx) with the proper drawer header/footer, image tiles and upload spinners, formatted VND prices, accessible spec controls, and compact bestseller toggle.
- Updated [admin.css](C:\Users\lnakh\Desktop\Mechanics-Tools\src\pages\admin\admin.css) so the drawer body scrolls while header/footer stay visible.
- Added implementation notes to [Phase 8 spec](C:\Users\lnakh\Desktop\Mechanics-Tools\_bmad-output\implementation-artifacts\spec-phase8-admin-products-excel.md).

Verification passed:

- `npm run build`
- `cd server && npm test` (after Prisma engine permission)
- `node scripts/scan-fixed-widths.mjs`

No commits, resets, stashes, or branch changes were made.