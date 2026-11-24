# Phase 8: real-file crash plus the approved admin design (for Codex)

Spec: `_bmad-output/implementation-artifacts/spec-phase8-admin-products-excel.md`.

## Run the tests yourself
```
$env:PRISMA_SCHEMA_ENGINE_BINARY = "C:\Users\lnakh\Desktop\Mechanics-Tools\server\node_modules\@prisma\engines\schema-engine-windows.exe"
$env:PRISMA_QUERY_ENGINE_LIBRARY = "C:\Users\lnakh\Desktop\Mechanics-Tools\server\node_modules\.prisma\client\query_engine-windows.dll.node"
$env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1"
```
PostgreSQL runs at 127.0.0.1:5432.

## 1. Crash with the real template, highest priority
Claude uploaded the real approved template (`public/templates/mau-nhap-san-pham.xlsx`) through the logged-in admin. The preview returned **500**:

```
TypeError: Cannot read properties of undefined (reading 'toLowerCase')
  at src/routes/admin-import.ts:314   const key = sku.toLowerCase();
```

**Cause:** the template has formatted but empty rows down to row 500 (fonts, number formats and data validations), so exceljs returns them as rows with undefined cells.

**Fix:**
- Skip rows whose 10 columns are all empty after trimming.
- A row with data but no SKU or name becomes a row **error** ("Thiếu mã sản phẩm" / "Thiếu tên sản phẩm"), never an exception.
- Read every cell defensively: rich text, numbers, formulas (use the result), hyperlinks, and `null`.

**Regression test:** in `server/test/import.test.ts`, upload the actual `public/templates/mau-nhap-san-pham.xlsx` file from disk, without images. Expect 200 with exactly 3 data rows: DTD171Z, GWS750-100 and M18FIW2F12. Image file names that weren't uploaded are warnings. The https link is accepted. No error from the empty rows.

## 2. The admin UI doesn't match the approved design
In the browser, the admin is nearly unstyled: about 9 lines of CSS in `src/index.css`. Implement the approved mockup, desktop only:
- **Layout:**
  - left sidebar, about 220px wide, with "LEE's tools", then Sản phẩm, Danh mục and Nội dung (Tabler-style icons optional, SVG inline is fine)
  - Đăng xuất at the bottom
  - the active item is highlighted
  - main content on the right, with a max width of about 1280px
- **Products toolbar:**
  - a title "Sản phẩm · N" on the left
  - on the right, three real buttons: "File mẫu" (secondary), "Nhập Excel" (secondary) and "Thêm sản phẩm" (primary, brand red `#D70114`, white text)
  - below that, one filter row: a search input that takes the remaining width, then the category select and the stock select
- **Table:** a 40px rounded thumbnail; the price right-aligned as `6.994.000 ₫`; stock right-aligned, with a red "Hết" pill for 0; hover highlight; the whole row clickable; pagination as real buttons with the page count
- **Product editor:** a right-side drawer, about 640px wide, over the list with a dimmed backdrop; Esc and × close it, and focus is trapped. It has:
  - a 2-column form, with fields on the left and images, specs and "Bán chạy" on the right
  - every input with a `<label htmlFor>`, so screen readers announce it
  - image thumbnails at 72px, the first marked "Ảnh đại diện", with drag handles (or ↑/↓) and remove buttons, plus a dashed "+" tile for upload
  - a sticky footer with Xóa (danger, only when editing), Hủy and Lưu (primary)
- **Import wizard:** a modal, or a full page with a step indicator (1 Chọn file → 2 Xem trước → 3 Hoàn tất):
  - **step 1:** a drop zone for the `.xlsx` plus a separate zone for images or a `.zip`, with a "Tải file mẫu" link
  - **step 2:** three count cards (Thêm mới green, Cập nhật blue, Lỗi red), then a row table with status pills (Thêm mới / Cập nhật / Lỗi / Cảnh báo) and notes, then "Chọn file khác" and "Xác nhận nhập N sản phẩm" (primary)
  - **step 3:** a result summary and a "Về danh sách sản phẩm" button
- **Login page:** a centered card (about 380px) with the LEE's tools title, labeled inputs, a full-width primary "Đăng nhập" button, and the error message under the button
- **Shared elements:** consistent spacing (8px grid), 8px radius, inputs 40px tall, readable 14px text, focus rings. Put the styles in a dedicated `src/pages/admin/admin.css` (imported by `AdminLayout`) or in Tailwind classes, not a giant `index.css` block.
- Keep the existing behavior and API calls, and keep the code readable.

## Done means
- `npm test` passes in full, including the real-template test, and your summary gives the counts
- root `npm run build` passes
- `cd server && npx tsc -p tsconfig.json --noEmit` passes
- `node scripts/scan-fixed-widths.mjs` passes

## Rules
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Never handle admin passwords.
- Add to the Implementation Notes, and finish by summarizing.
