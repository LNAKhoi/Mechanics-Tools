# Phase 6 fixes from browser verification (for Codex)

Spec: `_bmad-output/implementation-artifacts/spec-phase6-responsive-storefront.md`. Layout design: `_bmad-output/specs/spec-lee-tools-storefront/responsive-layout.md`.

Claude measured every storefront route in a real browser. At 375px, all pages that use the shared `Layout` still scroll sideways: `scrollWidth` is 392 while the client width is 375. Fix each item below. Keep today's exact desktop classes behind `xl:` so 1920px doesn't change.

1. **Header (phone):** the logo is too wide (`Logo.tsx` uses `w-[310px]`/`w-[190px]`), which pushes the search and cart icons past the right edge (right = 392px). Scale the logo below `xl` (for example about 140px wide) so ☰, logo, search and cart fit within 360px.
2. **Home hero and business banner (phone/tablet):** the absolutely positioned art overflows, e.g. `IMG.absolute.-left-[89px].-top-[40px]` reaches right = 2019px. Text overflows as well: `DIV.absolute.left-[94px].top-[48px]` and `H1.text-[56px]` reach 587px. Below `xl`:
   - clip the banner (`overflow-hidden`) and let the image cover it
   - put the text in normal flow with smaller sizes (roughly 28px heading, 16px body)
   Also convert the 3 desktop literals your scan flagged (`1776px`, `1476px` ×2) to `xl:` classes.
3. **Product page (phone):** a row `DIV.flex.items-center.gap-[8px]` with `SPAN.text-[16px].font-bold` and `SPAN.text-[12px].text-xam` children reaches right = 541–565px. This is probably the gift/"Khuyến Mãi" or rating row. Let it wrap or stack below `md`.
4. **Cart (phone):** the same kind of row inside the cart cards reaches right = 400–557px. Make it wrap the same way.
5. **Order form `/thanh-toan` (phone):** `OrderSummary` is still `w-[726px]`, with grid columns `1fr_126px_137px`. Make it full width below `xl`, stack it under `CustomerForm`, and use a compact item layout. Make `CustomerForm` full width too.
6. **Account `/tai-khoan` (phone):** the `AccountMenu` buttons overflow (right = 427–602px). Make it a horizontally scrollable tab strip (`overflow-x-auto`, no wrapping), and make `ProfilePanel` full width.
7. **Login (phone):** the decorative divider `IMG.h-px.flex-1` reaches right = 450px. Constrain it to the card width.
8. **Chat bubbles (phone):** they currently render as large text pills ("Zalo", "Messenger") that cover footer content. Below `md`, make them round 48px icon buttons stacked vertically with 16px insets, keeping their `aria-label`s. Above that, keep the current look.
9. **Desktop baseline:** at 1920×1080, `/danh-muc` is now 1379px tall (baseline 1400) and `/gio-hang` is 1503px (baseline 1500). Find the desktop class that changed on those pages and restore the exact `xl:` values.

## Verify
- root `npm run build`
- `node scripts/scan-fixed-widths.mjs`, which should report nothing left

Claude will re-measure in the browser afterwards.

## Rules
- Don't start a BMAD workflow. The uncommitted changes are intentional; continue from them without asking.
- Don't modify content inside `<frozen-after-approval>`.
- Don't touch `src/pages/admin`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Add what you changed to the spec's Implementation Notes.
- Finish by summarizing what you changed and anything left.
