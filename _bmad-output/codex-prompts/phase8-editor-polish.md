# Phase 8: product editor polish (for Codex)

Claude checked the redesigned admin in the browser at 1440×900, logged in. The sidebar, products table, toolbar, import modal and login now match the approved mockup. Only the right-side **product editor drawer** (`src/pages/admin/ProductEditor.tsx` and `admin.css`) still falls short:

1. **Header:** "Sửa sản phẩm" and the × render as tiny unstyled text in the top-left corner. Make it a proper drawer header:
   - the 18px title "Thêm sản phẩm" or "Sửa sản phẩm · <SKU>"
   - a 32px icon button for × with `aria-label="Đóng"`
   - a bottom border
2. **Footer:** it renders as the plain run-together text "HủyXóaLưu". Make it a sticky footer with real buttons:
   - "Xóa" on the left: danger outline, only when editing, with a confirmation
   - "Hủy" (secondary) and "Lưu" (primary, `#D70114`) on the right
   - "Lưu" shows "Đang lưu…" while saving
3. **Images:**
   - use 72px thumbnail tiles in a wrapping row
   - mark the first tile "Ảnh đại diện" with a small badge
   - each tile gets ↑/↓ (or drag) and × remove buttons with `aria-label`s
   - replace the raw "Choose Files" input with a dashed "+" tile that opens the file picker (multiple), showing a spinner per uploading image and the error under the tiles
4. **Price input:** shows `6994000`. Show thousands separators while typing (`6.994.000`) with a "₫" suffix, and send a plain integer to the API.
5. **Spec rows:**
   - two inputs (Tên / Giá trị) with accessible labels, e.g. `aria-label="Tên thông số 1"`
   - a small "Xóa" icon button
   - "+ Thêm thông số" as a text button
6. **"Bán chạy":** a normal-size checkbox with its label beside it, not a large box with the label below.
7. Keep the 2-column layout, and scroll the body inside the drawer so the header and footer stay visible.

## Verify
Set the Prisma env vars before testing:

```
$env:PRISMA_SCHEMA_ENGINE_BINARY = "C:\Users\lnakh\Desktop\Mechanics-Tools\server\node_modules\@prisma\engines\schema-engine-windows.exe"
$env:PRISMA_QUERY_ENGINE_LIBRARY = "C:\Users\lnakh\Desktop\Mechanics-Tools\server\node_modules\.prisma\client\query_engine-windows.dll.node"
$env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING = "1"
```

Then check:
- root `npm run build`
- `cd server && npm test` still passes
- `node scripts/scan-fixed-widths.mjs`

## Rules
- Frontend only. Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Keep the code readable.
- Add to the Implementation Notes in the Phase 8 spec, and finish by summarizing.
