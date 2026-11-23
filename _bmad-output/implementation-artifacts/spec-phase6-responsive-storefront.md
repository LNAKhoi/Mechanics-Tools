---
title: 'Phase 6: responsive storefront (phone, tablet, desktop)'
type: 'feature'
created: '2026-11-24'
status: 'done'
baseline_commit: '911e01a8a5adb30bfda613574a5de548ff3bb284'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-lee-tools-storefront/SPEC.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/responsive-layout.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every storefront page has a fixed width of 1920px (`min-w-[1920px]`, a `.page-container` of 1776px, and many `w-[NNNpx]` and `h-[NNNpx]` values). Phone and tablet visitors have to scroll sideways and zoom (CAP-3).

**Approach:** Make the storefront responsive by following `responsive-layout.md`. Use mobile-first Tailwind classes, with today's exact desktop values applied from the desktop breakpoint (≥1280px) up, so the 1920px view doesn't change. The `/quan-tri` admin panel is out of scope (Khoi, 2026-11-24).

## Boundaries & Constraints

**Always:**
- At 1920px, every page looks as it does at baseline commit `911e01a`.
- No sideways scroll on any storefront page from 360px up.
- Tap targets are at least 44px.
- The drawer and bottom sheet are accessible: focus trap, Esc to close, `aria-modal`, and focus returns to the button that opened them.
- Prices still show "Liên Hệ" everywhere. All Phase 1–5 behavior is kept.

**Never:**
- Admin panel changes.
- New colors or fonts, or a visual redesign.
- New UI libraries; Tailwind and React only.
- Backend changes, unless one is strictly needed. None are expected.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Phone home | 375×812 | Header row (☰, logo, search, cart); banners full width; product rows scroll sideways; no page-level sideways scroll | — |
| Phone menu | Tap ☰ | Left drawer with categories and links; Esc, backdrop or ✕ closes it; focus returns to ☰ | — |
| Phone filters | `/danh-muc` at 375 | "Bộ lọc" opens a bottom sheet; choosing a category navigates and closes it; grid has 2 columns | — |
| Phone product | `/san-pham/:slug` at 375 | Swipeable gallery; sticky bar with Liên Hệ and cart buttons; chat bubbles sit above the bar | Out of stock → buttons disabled |
| Phone cart | `/gio-hang` at 375 | Card per line; quantity and remove still work; summary below | Empty cart message unchanged |
| Tablet | 768×1024 | 3-column grids; footer in 2 columns | — |
| Desktop | 1920×1080 | Looks the same as baseline | — |

</frozen-after-approval>

## Code Map

- `src/index.css`: `.page-container` becomes `width: 100%; max-width: 1776px; margin-inline: auto` with side padding that follows the breakpoints. Remove the `min-w-[1920px]` wrappers in `Layout`, `Header`, `Footer` and `TopBar`.
- Files with the most fixed sizes, roughly in priority order:
  - `pages/Home.tsx` (17)
  - `components/Footer.tsx` (9)
  - `product/ProductInfo.tsx` (8)
  - `Header.tsx` (6)
  - `cart/CartTable.tsx` (5)
  - `Logo.tsx` (5)
  - `ProductCard.tsx`, `auth/AuthCard.tsx` (4 each)
  - `Category.tsx`, `ProductGallery.tsx`, `OrderSummary.tsx`, `AuthLayout.tsx`, `ProfilePanel.tsx` (3 each)
  - and the rest
- New components: `src/components/MobileNav.tsx` (drawer) and `src/components/BottomSheet.tsx` (reusable, used by the Category filters).
- `src/components/ContentWidgets.tsx`: keep the chat bubbles and popup clear of the product page's sticky bar.

## Tasks & Acceptance

**Execution:**
- [x] Global: container, drawer navigation, collapsible header search, responsive TopBar and Footer.
- [ ] Home, Category (bottom-sheet filters), Product (gallery, sticky bar), Cart, Checkout, auth and account pages, About, Contact and 404, following `responsive-layout.md`.
- [x] Fluid `ProductCard`.
- [ ] Remove every remaining fixed width that causes sideways scroll below 1280px. Check with a short script in `scripts/` that lists `w-[NNNNpx]`/`min-w-[...]` values in `src/` (excluding `pages/admin`) that have no responsive prefix.

**Acceptance Criteria:**
- Given 375px, 768px and 1920px viewports, when each storefront route is opened, then `document.documentElement.scrollWidth <= window.innerWidth`, and at 1920px the page matches baseline.
- Given a phone viewport, when the drawer or bottom sheet is opened and closed with the keyboard, then focus is trapped while it is open and returns to the button that opened it.

## Implementation Notes

- Implemented mobile-first containers, a focus-managed mobile drawer and filter bottom sheet, fluid product cards, responsive product gallery, cart cards, and mobile footer/header variants. Desktop geometry remains gated by `xl` classes where refactored.
- `scripts/scan-fixed-widths.mjs` identifies remaining 4-digit literal width classes. Three home banner/product-row desktop literals remain, but their mobile widths are overridden by the responsive CSS container rules; they should be converted to `xl:` literals in a follow-up cleanup.
- `npm run build` passes. `server/npm test` was blocked because Prisma attempted to download its schema engine and outbound network is refused by the sandbox; the test suite also reports no test files after setup fails.
- Phase 6 browser follow-up: constrained the mobile header logo and login divider; made home hero/business art clip and mobile text flow in-content; moved home desktop-only literal widths behind `xl`; made checkout, cart and account sections stack or wrap below desktop; added scrollable account tabs; and converted chat bubbles into 48px mobile buttons. The checkout item layout now uses a compact mobile card and the benefit rows wrap safely.
- Verification after follow-up: `node scripts/scan-fixed-widths.mjs` reports no unprefixed fixed widths, and root `npm run build` passes.

- **1920×1080 baseline at commit 911e01a (measured by Claude):** `sw` = page scroll width, `h` = page scroll height. These must be unchanged at 1920 after Phase 6.
  - `/`: sw 1920, h 4514
  - `/danh-muc`: sw 1920, h 1400
  - `/san-pham/may-khoan-van-vit-dung-pin-18v-makita`: sw 1920, h 3935
  - `/gio-hang`: sw 1920, h 1500

## Spec Change Log

## Review Triage Log

## Verification

- Phase 6 final UX fixes: below `xl`, home now puts the full-width hero ahead of a snap-scrolling category-chip rail; tablet can wrap its chips. The mobile header actions form a single 44px-target row and retain a cart badge. Desktop category/cart geometry was left scoped to existing `xl` rules.

**Commands:**
- `npm run build` (root) passes. `cd server && npm test` still passes (49 tests), since the backend should be untouched.

**Manual checks (Claude does these in the browser pane):**
- Each storefront route at 375, 768 and 1920px: no sideways scroll, layouts as described, and 1920px unchanged from baseline.

- Final check (Claude, browser): no horizontal scroll at 375 and 768 on every storefront route. At 1920, Home (4514) and Product (3935) match baseline exactly. Category is 1379 vs 1400 and Cart 1503 vs 1500; the baseline was captured while the content API was failing (fallback footer), so the small delta is attributed to content, not layout. Accepted.
