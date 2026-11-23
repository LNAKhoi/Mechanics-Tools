---
title: 'Phase 1: "Liên Hệ" pricing, home breadcrumbs, payment/invoice removal'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '9820672d4372432515877335db2cdc1d15a8380f'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-lee-tools-storefront/SPEC.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/brownfield.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The storefront shows numeric prices, discounts and price filters the shop does not publish. It shows payment and invoice options the project excludes. Its "Trang chủ" breadcrumbs are not clickable.

**Approach:** Show "Liên Hệ" in every price slot, remove the price filter, discount UI, payment and invoice surfaces, and link the breadcrumbs to `/`. Frontend only, in one PR. This covers SPEC CAP-1, CAP-2, CAP-12 and the price part of CAP-6.

## Boundaries & Constraints

**Always:** Vietnamese copy. Keep the existing visual style. Use one shared price element so a future "show real price" switch changes one place. Keep `price` in the data types (admin will own it later).

**Never:** Add a backend or order submission. Do the responsive rework (later phase). Delete the cart, quantity or customer-info fields. Leave any `đ` amount visible to shoppers.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Product card | Any product, incl. one with `oldPrice` | "Liên Hệ", no `<del>`, no "Giảm x%" badge | N/A |
| Cart totals | 3 items, mixed qty | Unit, line, subtotal show "Liên Hệ"; no shipping fee row | N/A |
| Empty cart | 0 items | Existing empty message unchanged | N/A |
| Old invoice URL | Visit `/thanh-toan/hoa-don` | Falls through to `*` → Home | N/A |
| Breadcrumb | Click "Trang chủ" on Category/Product/Cart/Order form | Navigates to `/` | N/A |

Decisions: shipping-fee rows are removed (the shop quotes them). Discount badges and old prices are removed with prices. The order-form route stays `/thanh-toan` for now; only its visible text changes. The "Đặt hàng ngay" button stays but does nothing (ordering is deferred).

</frozen-after-approval>

## Code Map

- `src/components/PriceLabel.tsx` (new) -- renders "Liên Hệ"; accepts `className` so callers keep their sizing.
- `src/components/ProductCard.tsx:12` -- replace `product.price` / `<del>{oldPrice}`; drop `'Giảm 30%'` badge styling; keep `addItem` (price stays numeric internally).
- `src/data/products.ts:10-14` -- strip `'Giảm 30%'` from `badges`; leave `price`/`oldPrice` fields.
- `src/components/product/ProductInfo.tsx:15` -- 56px `6.994.000đ`, `<del>`, "Giảm 30%" chip → PriceLabel at the same size.
- `src/components/cart/CartTable.tsx:10-11` and `CartSummary.tsx` -- `formatVnd(...)` → PriceLabel; remove "Phí vận chuyển"; "Tổng thanh toán" → "Tổng cộng"; button "Thanh toán ngay" → "Đặt hàng".
- `src/components/checkout/OrderSummary.tsx:4-6` -- same changes; remove the `shipping = 700000` row.
- `src/components/checkout/CustomerForm.tsx` -- remove the invoice checkbox and fields, the `payment` state and the "Thanh toán" RadioGroup, plus the `invoiceRequested`/`onInvoiceChange` props. Keep the "Giao hàng" radio.
- `src/pages/Checkout.tsx` -- drop the `routeInvoice`/state/effect and the `checkout-invoice` asset group; breadcrumb "Thông tin thanh toán" → "Thông tin đặt hàng".
- `src/App.tsx` -- remove the `/thanh-toan/hoa-don` route.
- `src/pages/Category.tsx:6,14,20` -- remove `prices`, the "Khoảng giá" FilterGroup, the manual price inputs and the `!category` branch.
- `src/components/Footer.tsx:5` -- remove "Hướng dẫn thanh toán". `src/pages/Home.tsx:17` -- remove " / Hóa đơn chứng từ đầy đủ".
- Breadcrumb `<span>Trang chủ</span>` in Category, Product, Cart and Checkout → `<Link to="/">`.
- Do not touch: `Logo.tsx` and `AuthLayout.tsx` (they already link to `/`), and `CartContext` logic.

## Tasks & Acceptance

**Execution:**
- [x] `src/components/PriceLabel.tsx` -- create -- single source of the "Liên Hệ" display
- [x] `src/components/ProductCard.tsx`, `src/data/products.ts` -- swap price, remove old price and discount badge -- CAP-1
- [x] `src/components/product/ProductInfo.tsx` -- swap price block -- CAP-1
- [x] `src/components/cart/CartTable.tsx`, `CartSummary.tsx`, `src/components/checkout/OrderSummary.tsx` -- PriceLabel, drop shipping rows, rename totals/CTA -- CAP-1/CAP-12
- [x] `src/components/checkout/CustomerForm.tsx`, `src/pages/Checkout.tsx`, `src/App.tsx` -- remove payment, invoice form and route -- CAP-12
- [x] `src/pages/Category.tsx` -- remove price filter -- CAP-6
- [x] `src/components/Footer.tsx`, `src/pages/Home.tsx` -- remove payment guide link and invoice copy -- CAP-12
- [x] `src/pages/{Category,Product,Cart,Checkout}.tsx` -- breadcrumb Link to `/` -- CAP-2
- [x] Remove `public/assets/checkout-invoice/` only if no other file references it.

**Acceptance Criteria:**
- Given the built app, when searching the rendered text of every route, then no `\d+\.\d{3}đ` amount, "Thanh toán", "hóa đơn" or "Khoảng giá" appears.
- Given any page with a logo or a "Trang chủ" breadcrumb, when it is clicked, then the URL is `/`.
- Given the cart, when the shopper adds, removes or changes quantities, then the cart updates as before.

## Implementation Notes

- Implemented by subagent; diff verified against every task. `npm run build` passes; grep of `src` finds no banned copy.
- Matrix test audit: project has no test framework. Khoi chose (2026-11-23) to skip automated tests for Phase 1; matrix rows were verified manually by scripted checks in the dev server (all routes, breadcrumbs, `/thanh-toan/hoa-don` → Home, cart add/remove/qty). Add a test setup in a later phase.
- `public/assets/checkout-invoice/` (42 files) deleted; no remaining code references.
- `CartContext.subtotal` is now unused by the UI; left in place per spec.

## Spec Change Log

## Review Triage Log

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | edge | Empty cart still shows summary + active "Đặt hàng" | medium | Baseline CartSummary had no `items.length` guard; pre-existing | defer |
| 2 | edge | `/thanh-toan` with empty cart shows totals + button | medium | Same pre-existing gap in OrderSummary | defer (with 1) |
| 3 | edge | Order form remaps images to `/assets/checkout/`; `8f51b.png` absent | medium | `ls public/assets/checkout` lacks 8f51b.png; remap existed at baseline | defer |
| 4 | edge+blind | `/thanh-toan/hoa-don` lands on Home, not order form | false | Frozen matrix row specifies fall-through to Home | reject |
| 5 | edge+blind | `formatVnd`, `subtotal`, `oldPrice`, `assetGroup`, badge type now unused | low | Frozen intent keeps price data for admin/real-price switch; no named harm beyond tidiness | reject |
| 6 | verif | No automated check that no đ amount renders | medium (pre-verified) | No test framework; user chose to skip tests 2026-11-23 | defer |
| 7 | verif | No automated check for route/payment/breadcrumb removal | medium (pre-verified) | Same | defer (with 6) |
| 8 | verif+blind | README lists removed `/thanh-toan/hoa-don` | low | README.md:22 | patch |
| 9 | blind | features.md says price-range search + subtotals | false | User decisions 2026-11-23 recorded in SPEC memlog; source-doc update offered to user, not a code defect | reject |
| 10 | blind | Subtotal row duplicates total ("Liên Hệ" twice) | low | CartSummary/OrderSummary render both rows with identical value | patch |
| 11 | blind | "Liên Hệ" has no contact link; casing | false | Frozen intent/assumption: plain text OK; casing is the user's literal wording | reject |
| 12 | blind | "Đặt hàng ngay" inert with no feedback | false | Frozen decision: button stays, ordering deferred | reject |
| 13 | blind | Category sidebar track fixed `h-[806px]` overruns single group | low | Category.tsx:14 fixed height sized for two groups | patch |
| 14 | blind | ProductInfo/ProductCard leftover wrappers and fixed height gap | low | Cosmetic; no visible defect named beyond minor gap; fix is restyling | reject |
| 15 | blind | Regression guard missing | medium | Duplicate of 6 | defer (with 6) |
| 16 | blind | Cart "Liên Hệ" cells lack header association for screen readers | low | Grid header row is pre-existing div layout, not table semantics | reject |

## Verification

**Commands:**
- `npm run build` -- expected: tsc and vite succeed with no type errors (catches the removed props).
- `grep -rnE "Thanh toán|hóa đơn|Khoảng giá|formatVnd\(" src` -- expected: no shopper-visible matches (a `formatVnd` definition may remain).

**Manual checks:**
- In `npm run dev`, walk Home → Category → Product → Cart → order form, click each "Trang chủ" and logo, and confirm "Liên Hệ" appears everywhere.
