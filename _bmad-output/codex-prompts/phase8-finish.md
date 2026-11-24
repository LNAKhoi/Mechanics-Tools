# Phase 8: crash fix plus remaining work (for Codex)

Spec: `_bmad-output/implementation-artifacts/spec-phase8-admin-products-excel.md`. Approved mockup:
- Product list with the buttons "File mẫu", "Nhập Excel" and "Thêm sản phẩm", search, category and stock filters, and a table (image, name, SKU, category, internal price, stock).
- A right-side editor panel with a 2-column form (name, SKU, category, brand, price, stock, description on the left; images, specs and "Bán chạy" on the right), plus Hủy and Lưu.
- A 3-step import showing counts of new, updated and error rows, and a per-row table.

## 1. Crash, highest priority
Claude ran the tests: all 5 server test files fail to load, and the dev API server is down. The error:

```
TypeError: The "paths[0]" argument must be of type string. Received undefined
 ❯ src/routes/admin-import.ts:17:26   const stagingRoot = path.resolve(uploadsDir, '..', '.import-staging');
 ❯ src/app.ts:8:1
```

**Cause:** a circular import. `admin-import.ts` (and `admin-upload.ts`) import `uploadsDir` from `app.ts`, while `app.ts` imports those routers, so `uploadsDir` is still undefined when the router module runs.

**Fix:** move `uploadsDir` (and the new staging dir) into a small module with no route imports, e.g. `server/src/paths.ts`, and import it from `app.ts` and from every router. Don't compute paths at module top level from anything imported from `app.ts`.

## 2. Remaining spec work
- **`server/test/import.test.ts`:** cover every row of the spec's I/O matrix. Build `.xlsx` fixtures in the test with exceljs, use tiny real PNG/JPEG buffers, and build a zip in the test (both a valid zip and a `../evil.jpg` entry).
- **Product editor (right-side panel):**
  - used to add and to edit; opened from "Thêm sản phẩm" or by clicking a table row
  - fields as in the mockup, with field errors from the API shown under each field
  - images uploaded through the existing verified upload endpoint, drag to reorder (or up/down buttons as a fallback), the first image marked "Ảnh đại diện", and a remove button per image
  - spec rows: Tên and Giá trị, plus "+ Thêm thông số" and a remove button
  - a "Bán chạy" checkbox; Hủy and Lưu
  - after saving, refresh the list and show "Đã lưu"
  - a delete button with confirmation
- **Products list:** 20 per page with pagination; search by name, SKU or brand; category and stock filters (Tất cả / Còn hàng / Hết hàng); out-of-stock shows a red "Hết" label; clicking a row opens the editor.
- **Categories page:** list, add, rename and delete (deleting a category that has products shows the API's 409 message).
- **Content page:** keep the existing content screens working inside the new layout. A full redesign isn't required.
- **Menu by permission:** Sản phẩm needs `products:write`, Danh mục needs `categories:write`, Nội dung needs `content:write`. Đơn hàng and Khách hàng stay hidden.
- **Spec:** tick every finished task checkbox.

## Verify
- `cd server && npm test`; if the sandbox blocks it, say so plainly
- root `npm run build`
- `cd server && npx tsc -p tsconfig.json --noEmit`
- `node scripts/scan-fixed-widths.mjs`

## Rules
- Don't modify content inside `<frozen-after-approval>`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Never handle admin passwords.
- Add to the Implementation Notes, and finish by summarizing your changes and anything left.
