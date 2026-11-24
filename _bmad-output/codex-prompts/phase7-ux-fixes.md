# UX fixes from Claude's browser test (for Codex)

Claude walked through the whole shopper ordering flow at 375×812 in a real browser. Placing the order and looking it up both work. Fix these five UX issues with small, focused changes, and keep the desktop (≥1280px) look unchanged.

1. **Product page gallery on phone** (`/san-pham/:slug`, `ProductGallery.tsx` / `Product.tsx`): the gallery isn't stacked on top. The main image is a small box (about 60px) sitting beside the specs column. Per `responsive-layout.md`:
   - below `xl`, the gallery goes first at full width with a square main image you can swipe
   - the thumbnails become a horizontal strip
   - then the info section.
2. **Chat bubbles over the sticky bar:** on the product page on phones, the Zalo and Messenger bubbles overlap the "Mua ngay" button in the bottom bar. While the sticky purchase bar is showing, lift the bubbles above it (e.g. `bottom = bar height + 16px`), for example through a CSS variable or a body class that the product page sets.
3. **Add-to-cart feedback:** tapping "Thêm vào giỏ" (in the sticky bar or on the product page) adds the item but shows nothing.
   - Show a small accessible toast ("Đã thêm vào giỏ hàng", with a "Xem giỏ hàng" link, `role="status"`) that disappears after about 3 seconds.
   - The header cart badge must update immediately.
   - Use the same toast for `ProductCard`'s add button.
4. **Order form labels** (`CustomerForm.tsx`): the inputs have no accessible names, because the read-out says only "textbox". Give each label a `htmlFor`/`id` pair (or wrap the input in its label). Add `autocomplete` values: `name`, `tel`, `email`, `address-level1`, `address-level2`, `street-address`. Use `inputMode="tel"` for the phone.
5. **Scroll position on navigation:** a new page keeps the previous page's scroll position. After submitting the order, `/dat-hang-thanh-cong` opened scrolled to the footer. Add a scroll-to-top on route changes (pathname changes only, not hash-only changes) for storefront routes.

6. **Order tests share rate limits** (`server/test/orders.test.ts`): when Claude ran the suite (`npx vitest run test/orders.test.ts`), 4 of 5 tests failed with `expected 201 "Created", got 429 "Too Many Requests"` (lines 18–21). The create and lookup rate limiters keep their state across tests, because they use one app instance and the same IP. Isolate the tests without weakening the limits in production:
   - build a fresh app (or fresh limiter instances) per test, for example by creating the limiters inside the router factory;
   - or reset the limiter store in `beforeEach`.
   The test for the 6th creation returning 429 must still prove the limit works. You may edit server files for this item only.

## Verify
- root `npm run build`
- `node scripts/scan-fixed-widths.mjs`

## Rules
- Don't touch the server or `src/pages/admin`, except where the cart badge needs shared state.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Add what you changed to the Implementation Notes in `_bmad-output/implementation-artifacts/spec-phase7-ordering-and-customers.md`.
- Finish by summarizing your changes.
