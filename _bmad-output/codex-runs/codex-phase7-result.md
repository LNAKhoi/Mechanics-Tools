Fixed the Phase 7 admin-router guard leak.

- Scoped content permission checks to `/content`.
- Scoped users/roles super-admin checks to `/users` and `/roles`.
- Added one-app regression coverage for `order_manager`, `content_editor`, and `product_manager`.
- Documented the fix in the Phase 7 Implementation Notes.

Verification passed:

- `cd server && npx tsc -p tsconfig.json --noEmit`
- `npm run build`

The targeted Vitest run could not initialize because Prisma attempted to download its schema engine and sandbox network access was refused.