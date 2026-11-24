Implemented all requested Phase 7 UX fixes and updated the Phase 7 implementation notes.

- Mobile product gallery now stacks first with a full-width swipeable image and horizontal thumbnails; desktop layout remains unchanged.
- Product-page chat bubbles lift above the mobile purchase bar.
- Cart additions show a 3-second accessible toast with “Xem giỏ hàng”; header cart counts update immediately; product cards use it too.
- Checkout fields now have explicit labels, autocomplete metadata, and phone input mode.
- Storefront navigation scrolls to top on pathname changes.
- Order routers now create fresh rate limiters per app instance, preserving the sixth-create 429 test behavior while isolating tests.

Verification:
- `npm run build` — passed
- `node scripts/scan-fixed-widths.mjs` — passed
- `cd server && npx tsc -p tsconfig.json --noEmit` — passed
- `npx vitest run test/orders.test.ts` — blocked before test execution because Prisma’s schema-engine download hit the environment’s refused proxy (`ECONNREFUSED 127.0.0.1:9`).

The branch remains `feature/phase2-backend`; no commit, reset, stash, push, or branch switch was performed.