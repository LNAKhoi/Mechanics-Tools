---
title: 'Phase 2: self-managed backend — catalog API (A) and admin auth with protected product writes (B)'
type: 'feature'
created: '2026-11-23'
status: 'draft'
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
- [ ] `docker-compose.yml`: PostgreSQL 16 on port 5432 with a named volume.
- [ ] `server/` (own `package.json` and `tsconfig.json`): Express app; `npm run dev`, `build` and `test` scripts. Root scripts `dev:server` and `db:up`.
- [ ] `server/prisma/schema.prisma`:
  - `Category` (slug, name, sortOrder)
  - `Product` (slug, name, brand, sku, description, price Int, stock Int, isBestseller, specs Json, categoryId)
  - `ProductImage` (url, sortOrder)
  - Initial migration.
- [ ] `server/prisma/seed.ts`: 6 categories from `categoryTiles` and the 4 distinct mock products with their prices; images point to the existing `/assets/...` paths.
- [ ] `server/src/routes/catalog.ts`:
  - `GET /api/categories`
  - `GET /api/products` with `q` (case-insensitive name/brand/sku), `category`, `page` and `limit`
  - `GET /api/products/:slug`
  - A public serializer that omits `price`.
- [ ] `src/lib/api.ts` plus hooks; wire Home, Category, Product, ProductCard and Header search; loading, empty and error states.
- [ ] `server/test/catalog.test.ts` (Vitest + supertest against a test database): covers the A rows of the matrix, including asserting that the `price` key is absent.

**Execution, Part B:**
- [ ] Prisma:
  - `AdminUser` (email unique, name, passwordHash, roleId, isActive)
  - `Role` (name, permissions String[])
  - `Session` (id, adminUserId, expiresAt)
  - Seed roles `super_admin` (`*`) and `product_manager` (`products:write`, `categories:write`).
- [ ] `server/src/auth/`:
  - bcrypt hashing.
  - `POST /api/admin/auth/login`, `logout` and `GET me`.
  - Session cookie expires after 7 days.
  - `requireAdmin` and `requirePermission(p)` middleware.
  - `express-rate-limit` on login.
- [ ] `server/src/routes/admin-catalog.ts`: `POST`, `PUT` and `DELETE /api/admin/products` and `/api/admin/categories`, guarded and validated with zod. Delete is refused for a category that still has products.
- [ ] `server/scripts/create-admin.ts` (`npm run create-admin`): prompts for email, name and a hidden password; creates a `super_admin`.
- [ ] `server/test/admin.test.ts`: covers the B rows of the matrix.
- [ ] `README.md`: setup steps (`db:up`, migrate, seed, create-admin, run both servers).

**Acceptance Criteria:**
- Given Docker and the seeded database, when `npm run dev` and `npm run dev:server` run, then Home, Category and Product show seeded products, and typing "Makita" in the header search lists only matching products.
- Given any public endpoint response, when it is inspected, then it contains no `price` field.
- Given no admin session, when any `/api/admin/*` write is called, then it is rejected, and nothing in the database changes.

## Implementation Notes

## Spec Change Log

## Review Triage Log

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
