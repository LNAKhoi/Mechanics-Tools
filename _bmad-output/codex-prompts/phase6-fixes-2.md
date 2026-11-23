# Phase 6 final UX fixes (for Codex)

Layout design: `_bmad-output/specs/spec-lee-tools-storefront/responsive-layout.md`. Claude re-checked the site in the browser. Sideways scrolling is gone at 375 and 768px, but three issues remain.

1. **Homepage at 375px, `CategoryMenu` plus `Hero`:**
   - **Problem:** the vertical category menu (Công cụ, dụng cụ / Thiết bị dùng Pin / …) fills the whole first screen, and the hero banner is squeezed into a roughly 40px strip beside it.
   - **Design below `xl`:**
     - Stack them: the hero banner first, full width, keeping its aspect ratio, with its slider.
     - Then the category menu as a single row of horizontally scrollable chips (icon plus label, `overflow-x-auto`, snap, no wrapping). At 768px the chips may wrap into 2 rows.
   - **Desktop (`xl`):** keep today's side-by-side layout exactly.
2. **Header at 375px:** the search and cart icons are stacked vertically on the right. Put them in one row, in this order: ☰ on the left, the logo in the middle-left, then search and cart side by side on the right. Each needs a 44px tap target, and the cart badge stays.
3. **Desktop baseline at 1920×1080:** `/danh-muc` measures 1379px tall but was 1400 at commit `911e01a`, and `/gio-hang` measures 1503px but was 1500. Use `git diff 911e01a -- src/pages/Category.tsx src/components/cart src/components/BenefitsStrip.tsx src/components/Footer.tsx` to find the desktop spacing or height that changed, and restore the exact `xl:` values.

## Verify
- root `npm run build`
- `node scripts/scan-fixed-widths.mjs`

## Rules
- Don't touch `src/pages/admin`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Add what you changed to Implementation Notes in `_bmad-output/implementation-artifacts/spec-phase6-responsive-storefront.md`.
- Finish by summarizing your changes.
