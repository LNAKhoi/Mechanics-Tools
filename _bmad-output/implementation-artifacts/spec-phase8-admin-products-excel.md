---
title: 'Phase 8: products-first admin redesign with Excel bulk import'
type: 'feature'
created: '2026-11-24'
status: 'done'
baseline_commit: 'ad5c1645da48c343049658f92e58fcfdd9f7d294'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-lee-tools-storefront/SPEC.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/stack.md', '{project-root}/_bmad-output/templates/mau-nhap-san-pham.xlsx']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The current admin doesn't fit how staff work. Its main job, adding and updating products, is buried among other sections, there is no way to add many products at once, and the whole UI is crammed into one 19-line file (`src/pages/admin/AdminPanel.tsx`).

**Approach:** Redesign `/quan-tri` around products, following the approved mockup (Khoi, 2026-11-24):
1. **Product list:** search, filters, and the buttons "File mẫu", "Nhập Excel" and "Thêm sản phẩm".
2. **Product editor:** a right-side panel for adding and editing.
3. **Three-step Excel import:** choose files → preview → confirm. It matches products by SKU, adding new ones and updating existing ones.

Danh mục and Nội dung stay as secondary sections. Đơn hàng and Khách hàng are hidden for now: menu links and routes are removed from the UI, while the backend and data stay untouched.

**Decisions (Khoi, 2026-11-24):**
- **Excel format:** the approved template `_bmad-output/templates/mau-nhap-san-pham.xlsx`, sheet "Sản phẩm", with these headers in this order: Mã sản phẩm (SKU) *, Tên sản phẩm *, Danh mục *, Thương hiệu, Giá (VNĐ), Tồn kho, Bán chạy, Mô tả, Thông số, Ảnh.
- **Matching:** by SKU, case-insensitive and trimmed. A new SKU is added; an existing SKU is updated.
- **Images:**
  - The "Ảnh" cell lists image file names and/or `https://` links, separated by `;`. The first is the main image.
  - Image files are uploaded with the Excel file, either as separate files or as one `.zip`, and matched by file name (case-insensitive, base name only).
  - Links are stored as-is; the server never downloads them.
- **Errors and warnings:**
  - Rows with errors are skipped and the other rows still import.
  - Rows with warnings (e.g. an image file wasn't found) import without that image.
  - Nothing is saved until "Xác nhận".
- **Updates:** an update changes only the columns that have values; an empty cell keeps the existing value. A non-empty "Ảnh" cell replaces that product's image list.
- **Price** stays internal only; the storefront still shows "Liên Hệ".

## Boundaries & Constraints

**Always:**
- **Permissions:** every import and product endpoint requires an admin session with `products:write`.
- **Excel parsing:** done on the server only, with `exceljs`. Don't use the npm `xlsx` package, which has known vulnerabilities.
- **Upload limits:**
  - `.xlsx` only, up to 5 MB, 1,000 data rows at most
  - up to 300 images, each up to 5 MB, all checked by signature (reuse the PNG/JPEG/WebP checks in `admin-upload.ts`)
  - a `.zip` up to 200 MB uncompressed
  - inside a zip, ignore folders and `__MACOSX` entries, reject absolute or `..` paths, and stop when the uncompressed size goes over the limit (zip-bomb guard)
- **Staged imports:**
  - the preview creates a staged import (an id, the parsed rows and the verified images in a temp folder) that only the same admin can confirm
  - it expires after 30 minutes, and expired imports and their temp files are cleaned up
- **Confirming:**
  - writes all valid rows in one database transaction
  - moves the matched images into `uploads/` with generated safe file names
  - returns counts of added, updated and skipped rows
- **Columns:**
  - "Danh mục" accepts a category name or slug that already exists; otherwise that row is an error
  - "Bán chạy" accepts Có/Không (also yes/no/1/0)
  - "Giá (VNĐ)" and "Tồn kho" are whole numbers 0 or more
  - "Thông số" is `Tên: Giá trị | …`
  - unknown or missing header columns make the whole file fail with a clear message
- **"File mẫu" button:** serves the approved template, copied to `public/templates/mau-nhap-san-pham.xlsx`.
- **Admin UI:**
  - Vietnamese labels
  - desktop layout (the admin is desktop-only)
  - the code is split into readable components under `src/pages/admin/` (layout, products list, product editor, import wizard, categories, content, login), with no single giant file

**Never:**
- Changing storefront behavior or showing prices.
- Deleting order or customer data or backend routes.
- Downloading remote image links on the server.
- Exporting to Excel (not requested).
- Creating admin passwords.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Preview mixed file | 3 rows: new SKU, existing SKU, a row missing the name | Counts: 1 new, 1 update, 1 error; per-row list with row number, status and note | — |
| Image matching | "Ảnh" = `a.jpg; https://x/y.jpg`, and `a.jpg` uploaded | Both images attached, the file first | `b.jpg` listed but not uploaded → warning, imported without it |
| Zip images | `.zip` with `img/A.JPG` and a "Ảnh" cell with `a.jpg` | Matched (base name, case-insensitive) | `../evil.jpg` entry, or uncompressed size over the limit → whole upload rejected with a message |
| Fake image | `.jpg` that isn't really a JPEG | Warning "Ảnh không hợp lệ", row imported without it | — |
| Bad category | "Danh mục" = "Không tồn tại" | Row error "Danh mục không tồn tại" | — |
| Wrong template | Missing or renamed header | 400 "File không đúng mẫu: thiếu cột …" | — |
| Duplicate SKU in file | Same SKU on rows 4 and 9 | Row 9 error "SKU trùng với dòng 4" | — |
| Partial update | Existing SKU; only "Tồn kho" filled | Only stock changes | — |
| Confirm | Valid staged import | One transaction; product list refreshes; result screen shows the counts | Expired or other admin's import → 404 "Phiên nhập đã hết hạn" |
| Permission | `content_editor` calls preview or confirm | 403 | — |

</frozen-after-approval>

## Code Map

- `src/pages/admin/AdminPanel.tsx`: the whole admin in 19 long lines. Replace it with components:
  - `AdminLayout` (left menu: Sản phẩm, Danh mục, Nội dung, Đăng xuất)
  - `ProductsPage` (search, category/stock filters, 20 per page)
  - `ProductEditor` (right panel; image upload with drag to reorder; spec rows)
  - `ImportWizard` (3 steps)
  - `CategoriesPage`
  - `ContentPage` (move the existing content screens here)
  - `LoginPage`
  Keep the existing session and login logic.
- `src/lib/admin-api.ts`: add `previewImport(formData)` and `confirmImport(id)`; reuse the existing product endpoints.
- `server/src/routes/admin-catalog.ts`: already has `GET/POST/PUT/DELETE /products` and categories. Reuse its validation and the product create/update logic in the import so both behave the same.
- `server/src/routes/admin-upload.ts`: the image signature checks to reuse.
- New `server/src/routes/admin-import.ts`:
  - `POST /api/admin/products/import/preview` (multipart: `file` plus `images[]` and/or `zip`)
  - `POST /api/admin/products/import/:id/confirm`
  - mounted with a path-scoped guard, following the Phase 7 router-guard lesson
- New dependencies in `server/`: `exceljs`, `multer` (or `busboy`) for multipart, and a zip reader such as `yauzl` that allows streaming size checks.

## Tasks & Acceptance

**Execution:**
- [x] Server import: parse, validate, match images, stage, confirm, clean up expired imports, with limits and the zip guards.
- [x] `server/test/import.test.ts`: covers every matrix row. Build `.xlsx` fixtures in the test with exceljs, and tiny PNG/JPEG buffers.
- [x] Copy the template to `public/templates/`.
- [x] Admin UI split into components; products list, editor and import wizard as in the mockup. Hide Đơn hàng and Khách hàng.
- [x] README: how the Excel import works.

**Acceptance Criteria:**
- Given the template with 3 example rows plus the matching image files, when imported and confirmed, then the products appear on the storefront with images, and the storefront still shows "Liên Hệ".
- Given a file with errors, then the preview lists them by row, and only the valid rows are saved after confirming.
- Given a `product_manager` logged in, then the menu shows Sản phẩm and Danh mục (not Nội dung, Đơn hàng or Khách hàng).

## Implementation Notes

- Used ExcelJS's streaming reader because the approved template contains comments that cause the normal workbook reader to fail while reconciling comment relationships.
- Moved upload and staging directory resolution into `server/src/paths.ts`, removing the app/router circular import that prevented the API and test suite from loading.
- Completed the product side-panel editor, list pagination/filtering, and category CRUD controls. Image ordering has accessible up/down fallbacks.
- Replaced the ExcelJS streaming reader, which crashed before reading workbook metadata, with a guarded loader that removes only legacy comment/VML metadata from the approved template. It validates the named `Sản phẩm` sheet and headers and converts corrupt, empty, or wrong-template workbooks to clear 400 responses.
- Added import coverage for all I/O-matrix cases, including ZIP traversal and decompression limits, image matching and invalid-image warnings, partial updates, staging expiry/ownership, and permissions.
- Fixed confirmation to locate SKUs case-insensitively with `findFirst`, separated create-image relation data from update replacement data, and treated malformed/traversal ZIP reader errors as a 400 response. Formatted the Phase 8 admin and import files for readable maintenance.
- Made the approved real template safe to preview: defensive Excel cell extraction now handles rich text, formulas, links, numbers and nulls, and ignores the template's formatted empty padding rows. Added a disk-backed regression test for its three data rows and rebuilt the desktop admin layout in its dedicated stylesheet.
- Polished the product editor drawer with a fixed header and footer around a scrolling two-column body, accessible image tile controls and per-image upload states, formatted VND price entry, accessible specification rows, and a compact bestseller toggle.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd server && npm test`: all pass, including `import.test.ts`.
- `npm run build` (root), `cd server && npx tsc -p tsconfig.json --noEmit`, and `node scripts/scan-fixed-widths.mjs`: all pass.

**Manual checks (Claude, in the browser):**
- Log in, add and edit a product, then import the template file with images and confirm.

- Final check (Claude, browser, logged in as super_admin at 1440x900): sidebar/products table/toolbar/import modal/login and the editor drawer match the approved mockup. Import preview with the real template: row 2 DTD171Z update (missing-image warning), row 3 new (warning), row 4 new (https link), 496 formatted empty rows ignored. Not exercised in-browser: picking local files (the pane cannot attach files); the preview API behind it was exercised. 64/64 server tests pass. Took 6 Codex rounds: circular import crash, SKU update bug, wrong-template 500, real-template empty-row crash, unstyled UI, editor polish.
