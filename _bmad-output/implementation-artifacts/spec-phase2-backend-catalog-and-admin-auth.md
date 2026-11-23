---
title: 'Phase 2: self-managed backend — catalog API (A) and admin auth with protected product writes (B)'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '54090ab6b637b08f704ea1ee102c7d557c46113e'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-lee-tools-storefront/SPEC.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/stack.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The catalog is hard-coded in `src/data/products.ts`, so staff cannot manage products and the site cannot search. There is no admin identity, so nothing can restrict who changes products.

**Approach:** Add our own backend (`server/`: Express + Prisma + PostgreSQL in Docker). **Part A (implement first):** catalog schema, seed and public read API, with Home, Category, Product and header search reading from it. **Part B (implement after A passes):** admin accounts with roles, login sessions, and product/category create/edit/delete endpoints that only a logged-in admin with the right permission can call.

## Boundaries & Constraints

**Always:**
- The public API never returns `price` (CAP-1). Prices exist only in the database and admin responses.
- Every write endpoint requires an authenticated admin session plus permission. The server enforces this; hiding a UI element does not count.
- Passwords are stored only as bcrypt hashes. The first super-admin is created by an interactive CLI prompt, so the password is never in code, chat or git.
- Secrets live in `server/.env` (gitignored), with `server/.env.example` committed.
- Storefront visuals stay unchanged, and "Liên Hệ" still shows everywhere.

**Never:**
- Admin UI pages (Phase 3).
- Image upload (Phase 3).
- Shopper accounts and orders (the existing mock login stays).
- Hosting or deployment.
- Responsive rework.
- Managed backend services.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| A: List products | `GET /api/products?category=may-khoan&q=makita` | Matching products: slug, name, brand, image, badges, category; no `price` | Unknown category → empty list |
| A: Product detail | `GET /api/products/:slug` | Product with images, specs, stock; no `price` | 404 JSON → page shows "Không tìm thấy sản phẩm" |
| A: API down | Storefront fetch fails | Page shows an error message with retry, no crash | — |
| B: Login | Correct email and password | 200, HTTP-only, SameSite=Lax session cookie | Wrong credentials → 401, generic message |
| B: Brute force | More than 10 failed logins from one IP within 15 min | 429 | — |
| B: Write without session | `POST /api/admin/products` with no cookie | 401 | — |
| B: Write without permission | Session role lacks `products:write` | 403 | — |
| B: Admin create | Valid body, permitted role | 201; appears in the public list without `price` | Invalid body → 400 with field errors |

</frozen-after-approval>

## Code Map

- `src/data/products.ts`: mock catalog (5 products, `categoryTiles` with 6 categories). This is the seed source. After Part A it keeps only `categoryTiles` presentation data if still needed.
- `src/pages/Home.tsx` and `src/pages/Category.tsx`: import `products`, `recommendedProducts` and `categoryProducts`; switch to an API hook. The Category sidebar `groups` become API categories.
- `src/components/product/ProductInfo.tsx`, `ProductGallery.tsx`, `ProductDetails.tsx`: hard-coded name, specs, images and recommended products. Feed them from the API by slug. Rating, variants and the "Khuyến Mãi" box stay static.
- `src/components/ProductCard.tsx`: navigates to `/san-pham`; change it to `/san-pham/:slug`. `addItem` price becomes `0` (the price is not public).
- `src/components/Header.tsx`: the search is a fake `<div>`. Make it a real input that submits to `/danh-muc?q=`.
- `src/App.tsx`: add `/danh-muc/:slug` and `/san-pham/:slug`. `/san-pham` without a slug redirects to `/danh-muc`.
- `vite.config.ts`: add a dev proxy from `/api` and `/uploads` to `http://localhost:4000`.
- `src/context/AuthContext.tsx`: shopper mock. Do not touch.

## Tasks & Acceptance

**Execution, Part A:**
- [x] `docker-compose.yml`: PostgreSQL 16 on port 5432 with a named volume.
- [x] `server/` (own `package.json` and `tsconfig.json`): Express app; `npm run dev`, `build` and `test` scripts. Root scripts `dev:server` and `db:up`.
- [x] `server/prisma/schema.prisma`:
  - `Category` (slug, name, sortOrder)
  - `Product` (slug, name, brand, sku, description, price Int, stock Int, isBestseller, specs Json, categoryId)
  - `ProductImage` (url, sortOrder)
  - Initial migration.
- [x] `server/prisma/seed.ts`: 6 categories from `categoryTiles` and the 4 distinct mock products with their prices; images point to the existing `/assets/...` paths.
- [x] `server/src/routes/catalog.ts`:
  - `GET /api/categories`
  - `GET /api/products` with `q` (case-insensitive name/brand/sku), `category`, `page` and `limit`
  - `GET /api/products/:slug`
  - A public serializer that omits `price`.
- [x] `src/lib/api.ts` plus hooks; wire Home, Category, Product, ProductCard and Header search; loading, empty and error states.
- [x] `server/test/catalog.test.ts` (Vitest + supertest against a test database): covers the A rows of the matrix, including asserting that the `price` key is absent.

**Execution, Part B:**
- [x] Prisma:
  - `AdminUser` (email unique, name, passwordHash, roleId, isActive)
  - `Role` (name, permissions String[])
  - `Session` (id, adminUserId, expiresAt)
  - Seed roles `super_admin` (`*`) and `product_manager` (`products:write`, `categories:write`).
- [x] `server/src/auth/`:
  - bcrypt hashing.
  - `POST /api/admin/auth/login`, `logout` and `GET me`.
  - Session cookie expires after 7 days.
  - `requireAdmin` and `requirePermission(p)` middleware.
  - `express-rate-limit` on login.
- [x] `server/src/routes/admin-catalog.ts`: `POST`, `PUT` and `DELETE /api/admin/products` and `/api/admin/categories`, guarded and validated with zod. Delete is refused for a category that still has products.
- [x] `server/scripts/create-admin.ts` (`npm run create-admin`): prompts for email, name and a hidden password; creates a `super_admin`.
- [x] `server/test/admin.test.ts`: covers the B rows of the matrix.
- [x] `README.md`: setup steps (`db:up`, migrate, seed, create-admin, run both servers).

**Acceptance Criteria:**
- Given Docker and the seeded database, when `npm run dev` and `npm run dev:server` run, then Home, Category and Product show seeded products, and typing "Makita" in the header search lists only matching products.
- Given any public endpoint response, when it is inspected, then it contains no `price` field.
- Given no admin session, when any `/api/admin/*` write is called, then it is rejected, and nothing in the database changes.

## Implementation Notes

- Migrations are split: `init_catalog` (Part A) and `admin_auth` (Part B).
- Tests: `globalSetup` runs `prisma migrate deploy` on `TEST_DATABASE_URL` (Prisma refuses `migrate reset` when run by an AI agent), then each test file truncates and re-seeds its tables. `vitest.config.ts` refuses to run if `TEST_DATABASE_URL` equals `DATABASE_URL`.
- Session ids are the SHA-256 of the cookie token; bcrypt is via `bcryptjs` (cost 12, pure JS, no native build on Windows).
- Admin write paths use numeric ids (`/api/admin/products/:id`, `/api/admin/categories/:id`); product bodies reference the category by `categorySlug`. Duplicate slug/sku gives 409.
- Root `.gitignore` gained `!.env.example` so `server/.env.example` is committed.

## Spec Change Log

## Review Triage Log

Layers: B = blind, E = edge-case, V = verification-gap (pre-verified).

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | B | Home category rows show identical products | medium | Baseline Home also passed the same `products` to every row; pre-existing | defer |
| 2 | B | Makita seed specs contradict description (brushed vs BL, 355mm, 2000w) | medium | Copied from old mock ProductInfo into seed-data.ts; now shown as product data | patch |
| 3 | B | Static variants/promo/rating on every product | false | Frozen Code Map decision: rating, variants, Khuyến Mãi stay static | reject |
| 4 | B | Out-of-stock product still addable/buyable | medium | ProductInfo shows "Hết hàng" but buttons stay enabled | patch |
| 5 | B | No admin read endpoints (GET list/detail with price, ids) | medium | Not in frozen intent; needed by Phase 3 admin UI | defer |
| 6 | B+E | Login limiter per-IP only; trust proxy unset | medium | Local-only today (all traffic 127.0.0.1); matters at hosting | defer |
| 7 | B+E | Expired sessions never purged | low | session.ts deletes only on presentation | patch |
| 8 | B | Deactivated admin's sessions revive on reactivation | low | No deactivation endpoint exists yet | defer (with 5) |
| 9 | B | Search not diacritic-insensitive | medium | `contains` + insensitive handles case only; Vietnamese users type unaccented | defer |
| 10 | B | Image URLs unvalidated | low | zod `string().max(500)` accepts any scheme | patch |
| 11 | B | No-image products render broken `<img>` | low | API returns `image: null` / `images: []`; UI has no fallback | patch |
| 12 | B | Gallery "+N" hides images 6+ | low | Seed has ≤5 images; cosmetic, fix adds UI | reject |
| 13 | B+E+V | Related fallback request error hides good results | low | `error = sameCategory.error ?? fallback.error` | patch |
| 14 | B+E | Category unknown slug / page beyond range show empty state | low | Rare URL-typed paths; fix adds branches | defer |
| 15 | B | Cart items price 0 shows 0đ | false | Phase 1 removed all formatVnd from cart/checkout; PriceLabel shows "Liên Hệ" | reject |
| 16 | B | Postgres exposed on all interfaces with hardcoded password | medium | compose `"5432:5432"` | patch |
| 17 | B | README omits test DB setup | low | README covers DATABASE_URL only | patch |
| 18 | B+V | Missing tests (409 on update, unknown categorySlug, secure cookie, etc.) | medium (pre-verified) | See V rows | patch |
| 19 | B | PUT is partial (PATCH semantics) undocumented | low | Omitted fields kept | patch (README) |
| 20 | V | Viewer 403 on PUT/DELETE categories untested | medium | admin.test.ts covers products + POST category only | patch |
| 21 | V | skipSuccessfulRequests untested | medium | Rate-limit test uses only failures | patch |
| 22 | V | Secure cookie flag in production untested | medium | NODE_ENV forced to test | patch |
| 23 | V | Pagination order/distinctness untested | medium | Test asserts sizes only | patch |
| 24 | V | PUT partial paths untested | medium | Only one PUT test | patch |
| 25 | V+E | Storefront/API-down behavior has no automated test | medium | No frontend test setup; verified manually in browser | defer |
| 26 | E | price/stock/sortOrder > INT4 → 500 | low | zod has no max | patch |
| 27 | E | `:id` > INT4 → 500 | low | coerce without max | patch |
| 28 | E | huge `page` → 500 | low | skip overflows | patch |
| 29 | E | Category deleted mid-request → P2003 500 | low | Race; unlikely; fix adds branch | reject |
| 30 | E | create-admin accepts password/email login rejects | medium | Login caps 200/254; script doesn't | patch |
| 31 | E | bcrypt truncates >72 bytes | medium | bcryptjs truncation; Vietnamese chars multi-byte | patch |
| 32 | E | `dist` path segment breaks uploadsDir | low | Unlikely checkout path; fix adds logic | reject |
| 33 | E | Non-numeric PORT crashes start | low | Dev config error fails loudly | reject |
| 34 | E | Missing upload 404 has misleading message | low | Cosmetic | reject |
| 35 | E | Unknown /api/admin/* returns 401 not 404 | false | Hiding admin surface from anonymous callers is acceptable behavior | reject |
| 36 | E | Test-DB guard compares raw URL strings | medium | localhost vs 127.0.0.1 bypasses; TRUNCATE could wipe dev DB | patch |
| 37 | E | Re-seed reverts admin edits | medium | `upsert update: data` + image replace | patch |
| 38 | E | Seed aborts on sku conflict with admin product | low | Unlikely; loud failure | reject |
| 39 | E | Stale success overwrites newer useApi state | medium | api.ts:50 success path lacks abort check | patch |
| 40 | E | `?page=2.5` mislabels page | low | Direct floor fix | patch |
| 41 | E | Categories error hides filter silently | low | Unlikely; adds branch | reject |
| 42 | E | Duplicate spec labels collide React keys | low | Direct key fix | patch |
| 43 | V | `limit>100` falls back to 20 | low | Defensible; no harm | reject |

## Design Notes

**Why the public API omits price:** "Liên Hệ" is a business rule, not only display. A price sent to the browser can be read in DevTools, so it never leaves the server for anonymous users.

**Why sessions are stored in the database:** logout and deactivating an admin take effect immediately, which JWTs can't do without extra machinery. One indexed lookup per admin request is negligible at this scale.

**Why roles are data:** permission strings stored on `Role` let Phase 3 add roles such as `content_editor` without code changes.

## Verification

**Commands:**
- `npm run db:up` and `cd server && npx prisma migrate dev && npx prisma db seed`: expected to succeed and create 6 categories and 4 products.
- `cd server && npm test`: all catalog and admin tests pass.
- `npm run build` (root) and `cd server && npm run build`: both succeed with no type errors.

**Manual checks:**
- With both servers running, browse Home → Category → Product, try the search, and confirm "Liên Hệ" shows and the network responses contain no `price`.
