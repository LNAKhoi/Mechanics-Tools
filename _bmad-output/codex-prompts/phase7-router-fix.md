# Fix: admin router guards block other admin routes (for Codex)

**Bug (confirmed by Claude):** `cd server && npx vitest run test/orders.test.ts` fails 2 tests with `expected 200 "OK", got 403 "Forbidden"`, at `test/orders.test.ts` lines 20–21. An `order_manager` is refused on `/api/admin/orders` and `/api/admin/customers`.

**Cause:** in `server/src/app.ts`, the admin routers are all mounted at `/api/admin` in this order:
1. catalog
2. upload
3. content
4. orders
5. users

`adminContentRouter.use(requireAdmin, requirePermission('content:write'))` (`src/routes/admin-content.ts:21`) runs for **every** `/api/admin/*` request that reaches that router. So any request meant for a router mounted after it (orders, customers, users) is refused unless the admin has `content:write`.

`adminUsersRouter.use(..., requirePermission('*'))` has the same latent problem for anything mounted after it.

**Fix:** a router-level permission guard must apply only to that router's own paths. Either:
- mount each router at its own prefix (e.g. content routes under `/api/admin/content`, and update `src/lib/admin-api.ts` to match), or
- move the permission checks onto each route (or onto a sub-path `router.use('/content', ...)`).

The fix must not change any public or admin URL that the storefront or admin panel already uses, unless you update the callers in the same change. Keep `requireAdmin` behavior as it is.

**Regression test:** add a test in `server/test/admin.test.ts` or `orders.test.ts` that, in one app:
- logs in as `order_manager` and gets 200 on orders and customers
- logs in as `content_editor` and gets 200 on a content admin route and 403 on orders
- logs in as `product_manager` and gets 200 on admin products and 403 on content and orders

## Verify
- `cd server && npx tsc -p tsconfig.json --noEmit`
- root `npm run build`

If the sandbox can't run the tests, say so; Claude will run them.

## Rules
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Add what you changed to the Implementation Notes in `_bmad-output/implementation-artifacts/spec-phase7-ordering-and-customers.md`.
- Finish by summarizing your changes.
