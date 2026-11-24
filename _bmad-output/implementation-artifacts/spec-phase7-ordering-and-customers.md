---
title: 'Phase 7: guest ordering (quote requests), order lookup, admin orders and customers'
type: 'feature'
created: '2026-11-24'
status: 'done'
baseline_commit: '95db6347171aa40402f84efaad4c572da0e10834'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-lee-tools-storefront/SPEC.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/stack.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/responsive-layout.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Shoppers can fill the cart and the order form, but "Đặt hàng ngay" does nothing. The cart starts with three hard-coded demo items and is lost on reload. The shop can't see orders or customers (CAP-7, CAP-9).

**Approach:** Guest ordering, where an order is a **quote request** (prices are "Liên Hệ"):
- The shopper submits name, phone and address and gets an order code.
- The shop handles orders and statuses in `/quan-tri`.
- Customers are identified by phone number.
- The shopper can look up their order status with the code plus their phone number.

**Decisions (Khoi, 2026-11-24):**
- **1A:** guest ordering, no login.
- **2A:** new-order alerts in the admin panel only (a badge). No email or Zalo alerts yet.
- **3:** statuses `moi` (Mới) → `da_lien_he` (Đã liên hệ / báo giá) → `da_xac_nhan` (Đã xác nhận) → `dang_giao` (Đang giao) → `hoan_thanh` (Hoàn thành). `da_huy` (Đã hủy) is allowed from any status except `hoan_thanh`.
- **4:** a confirmation page with the order code, plus a public order lookup by code and phone.

## Boundaries & Constraints

**Always:**
- **No price shown to shoppers:** order lines store a product snapshot (productId, slug, name, sku, image, quantity) and never a price. The admin may record an internal quoted total and notes, which appear only in admin responses and are never in any public response.
- **Phone:** normalized to `0XXXXXXXXX` (an input of `+84…` is accepted). It must match `^0(3|5|7|8|9)\d{8}$`.
- **Order codes:** `LT-` followed by a 6-digit sequence, e.g. `LT-000123`. Generated in a transaction so they are never duplicated.
- **Spam protection:**
  - order creation is rate-limited (5 per IP per 15 minutes)
  - a hidden honeypot field rejects bots
  - each order has at most 50 lines, with quantity 1–99 per line
  - products must exist and not be out of stock; otherwise 400 naming the product
- **Order lookup:**
  - rate-limited (10 per IP per 15 minutes)
  - a wrong code and a wrong phone return the same 404
  - the response shows status, status history dates, line items and the delivery option only
  - no address, phone or notes are echoed back
- **Admin access:**
  - every admin order and customer endpoint needs a session plus permission: `orders:write` to change status or quote, `orders:read` and `customers:read` to view
  - new role `order_manager` with `orders:read`, `orders:write` and `customers:read`
  - every status change records who made it and when
- **Cart:**
  - starts empty (remove the `initialCartItems` demo data from use)
  - is saved in `localStorage` (wrapped in try/catch)
  - is cleared after a successful order
- **Layout:** follows `responsive-layout.md`; the new pages work at 375px.

**Never:**
- Online payment or invoices.
- Sending email, SMS or Zalo.
- Shopper accounts or login (the existing Login, Register and Account pages stay as mock).
- Showing any price to shoppers.
- Hosting.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Place order | Valid form and 2 cart lines | 201 `{ code: "LT-000001" }`; redirect to `/dat-hang-thanh-cong?ma=LT-000001`; cart emptied | — |
| Invalid phone | `phone: "12345"` | 400 with field error "Số điện thoại không hợp lệ" shown under the field | Cart kept |
| Out-of-stock or unknown product | A line has stock 0 or an unknown id | 400 naming the product | Cart kept; message shown |
| Empty cart | `/thanh-toan` with an empty cart | Shows "Giỏ hàng trống" plus a link to `/danh-muc`; submit disabled | — |
| Bot or spam | Honeypot filled, or the 6th order in 15 minutes | 400 / 429 | Generic message |
| Lookup | `/tra-cuu-don-hang` with a valid code and phone | Status timeline and items, no price or address | Wrong code or phone → the same "Không tìm thấy đơn hàng" |
| Admin list | `order_manager` opens Đơn hàng | Paged list, newest first; filter by status; search by code, phone or name; badge with the count of `moi` | `content_editor` → 403 |
| Status change | `moi` → `da_lien_he` with quote 1,500,000 and a note | Saved, with history entry (who, when); public lookup shows the new status but not the quote | Invalid transition (e.g. `hoan_thanh` → `moi`) → 400 |
| Customers | Open Khách hàng | One row per phone: name (latest), phone, order count, last order date; detail shows order history | — |

</frozen-after-approval>

## Code Map

- `src/context/CartContext.tsx`: starts from `initialCartItems`, in memory only. Change it to start empty and persist in `localStorage`; add `clear()`.
- `src/components/checkout/CustomerForm.tsx`: has the fields Họ và tên, Điện thoại, E-mail, Tỉnh/Thành phố, Phường/Xã, Địa chỉ, Ghi chú, and the Giao hàng radio. Make it a controlled form with field errors and the honeypot.
- `src/components/checkout/OrderSummary.tsx`: the "Đặt hàng ngay" button has no handler. Make it submit the form, show a loading state, and keep the cart if the order fails.
- New pages: `/dat-hang-thanh-cong` and `/tra-cuu-don-hang`. Add a "Tra cứu đơn hàng" link to the footer and the mobile drawer.
- Server:
  - `server/prisma/schema.prisma`: new `Customer` (phone unique, name, email?, timestamps), `Order` (code unique, customerId, address fields, deliveryOption, note, status, quotedTotal Int?, adminNote?, timestamps), `OrderItem` (snapshot fields), and `OrderStatusEvent` (orderId, from, to, adminUserId?, at). Seed the `order_manager` role.
  - `server/src/routes/orders.ts` (public: create and lookup) and `admin-orders.ts` (list, detail, status/quote update, customers list and detail).
- Admin: `src/pages/admin/AdminPanel.tsx` gets "Đơn hàng" (with the new-order badge) and "Khách hàng" sections, desktop layout.

## Tasks & Acceptance

**Execution:**
- [x] Prisma models, migration and the `order_manager` role (create-only seed).
- [x] Public order create and lookup endpoints with validation, normalization, honeypot, rate limits, transactional code generation and stock checks.
- [x] Admin order and customer endpoints with permissions, the allowed-transitions table and status history.
- [x] Cart persistence and clearing; working order form; confirmation page; lookup page (responsive).
- [x] Admin Đơn hàng (list, filters, detail, status and quote form, badge) and Khách hàng (list and detail) screens.
- [x] `server/test/orders.test.ts` covering every matrix row, including that public responses never contain `quotedTotal`, `adminNote`, phone or address.
- [x] README: the orders API table and the `order_manager` role.

**Acceptance Criteria:**
- Given products in the cart, when a shopper submits a valid order on a 375px phone, then they see the confirmation page with an `LT-` code and the cart is empty.
- Given that code and phone, when looked up, then the current status shows; after an admin changes the status, the lookup shows the new one.
- Given any public order response, then it contains no price, quote, admin note, phone or address.

## Implementation Notes

- Resumed the existing Prisma migration/schema and create-only role seed. Guest-cart product slugs are resolved server-side into immutable numeric product snapshots.
- Quote and internal-note fields are confined to admin responses. Public creation returns only a code and lookup uses an explicit allow-list serializer.
- Phase 7 UX follow-up: product galleries now stack with a swipeable full-width image on phone; chat bubbles clear the mobile purchase bar; cart additions show a three-second accessible toast and update both header counts immediately. Checkout fields have explicit label associations and autofill hints, storefront pathname changes scroll to the top, and fresh order-router limiters isolate each test app without changing production limits.
- Scoped content and user router guards to their own admin URL paths so their permission checks cannot block orders, customers, or other sibling admin routers. Added role-isolation coverage for `order_manager`, `content_editor`, and `product_manager` in one app instance.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd server && npm test`: all pass, including `orders.test.ts`.
- `npm run build` (root), `cd server && npx tsc -p tsconfig.json --noEmit`, and `node scripts/scan-fixed-widths.mjs`: all pass.

**Manual checks (Claude, in the browser):**
- Place an order at 375px and at desktop, look it up, and change its status in admin.

- Final check (Claude): 54/54 server tests pass; root build and server tsc pass. API: order LT-000001 created; lookup returns no price/quote/phone/address/note; wrong code and wrong phone give the same 404; honeypot 400; admin without session 401. Browser at 375: add-to-cart toast and badge, labelled checkout with autocomplete, order LT-000002 placed, cart cleared, confirmation page opens at top, lookup shows status. Found and fixed a real router-guard leak (content router blocked order_manager). Admin order screens not exercised in the browser (needs an admin login).
