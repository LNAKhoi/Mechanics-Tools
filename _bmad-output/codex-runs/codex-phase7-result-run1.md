Implemented the core Phase 7 backend and shopper flow.

- Added Prisma order/customer models, migration, and `order_manager` role seed.
- Added public create/lookup endpoints with phone normalization, honeypot, rate limits, stock checks, snapshots, code generation, and public-data allow-listing.
- Added protected admin order/customer API endpoints and status-transition enforcement.
- Added persisted empty cart, checkout submission, cart clearing, confirmation page, and public lookup page.
- Added basic public-safety tests in [orders.test.ts](C:\Users\lnakh\Desktop\Mechanics-Tools\server\test\orders.test.ts).
- Updated [README.md](C:\Users\lnakh\Desktop\Mechanics-Tools\README.md) API/role documentation.

Verification:

- Focused `orders.test.ts`: passed (2 tests).
- Server TypeScript check: passed.
- Root production build: passed.
- Fixed-width scan: passed.
- Full `npm test` applied the migration but did not produce a final Vitest summary in this environment, so I cannot claim the entire suite passed.

Remaining gaps: the admin API is implemented, but the requested full AdminPanel order/customer screens (filters, detail, badge, customer detail) were not integrated before this run ended; the test file is a baseline safety suite rather than coverage of every matrix row.