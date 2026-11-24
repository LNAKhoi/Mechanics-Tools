# Phase 7: finish the remaining work (for Codex)

Spec: `_bmad-output/implementation-artifacts/spec-phase7-ordering-and-customers.md`. The backend and the shopper flow are done and Claude has verified them: the API works, lookups don't leak data, and all 51 tests pass. Two pieces are still missing.

1. **Admin screens in `src/pages/admin/AdminPanel.tsx`**, wired to the existing admin order and customer APIs:
   - **"Đơn hàng":**
     - a paged list, newest first: code, customer name, phone, item count, status label, date
     - a status filter, and search by code, phone or name
     - a badge in the admin navigation showing the count of `moi` orders, refreshed when the list loads and after a status change
     - **detail view:** customer info, delivery address and option, note, line items with image and quantity, the status history (who and when), and a form that offers only the allowed next statuses plus the optional quoted total (VND) and admin note. Saving refreshes the detail.
   - **"Khách hàng":**
     - a list with name, phone, order count and last order date, searchable by phone or name
     - a detail view with the customer's order history, linking to each order's detail
   - **Visibility:** hide sections the logged-in role can't use (needs `orders:read` or `customers:read`), and handle 403 with the existing access notice. Use Vietnamese labels and the existing admin desktop layout.
2. **`server/test/orders.test.ts`:** extend it to cover every row of the spec's I/O matrix:
   - place an order; invalid phone; out-of-stock and unknown products
   - honeypot, and the 6th order in 15 minutes returning 429
   - lookup, and that a wrong code and a wrong phone give the same 404
   - the admin list as `order_manager`, and 403 for `content_editor`
   - status change with a quote and note, history entry, and the invalid transition `hoan_thanh` → `moi` returning 400
   - customers list and detail
   - and that public create and lookup responses never contain `quotedTotal`, `adminNote`, phone, address or email
3. **Spec checkboxes:** tick every finished task in the spec, including the ones the previous run completed.

## Verify
- `cd server && npm test`; if the sandbox blocks it, say so plainly
- root `npm run build`
- `cd server && npx tsc -p tsconfig.json --noEmit`
- `node scripts/scan-fixed-widths.mjs`

## Rules
- Don't modify content inside `<frozen-after-approval>`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Never handle admin passwords.
- Finish by summarizing your changes and anything left.
