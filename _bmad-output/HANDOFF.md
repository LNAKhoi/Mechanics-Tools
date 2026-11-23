# Handoff: LEE's tools e-commerce (2026-11-23)

Read this first, then the files it points to. Keep UI copy in Vietnamese. Do not show numeric prices to shoppers.

## Where things stand

| Phase | Status | Where |
|---|---|---|
| 1: "Liên Hệ" pricing, breadcrumbs, payment/invoice removal | Done, committed | branch `feature/phase1-lien-he-pricing` (commit `efdfd85`) |
| 2: Own backend (catalog API + admin auth) | Done and reviewed; **not committed** | branch `feature/phase2-backend` (working tree) |
| 3: Admin panel UI | Not started | — |
| 4: Search, About/Contact, SEO, homepage rows | Not started | — |
| 5: Mobile/tablet responsive | Not started | — |
| Later: ordering, hosting | Not started | — |

The first action is to commit the Phase 2 working tree on `feature/phase2-backend`. All 37 server tests pass, the root build passes, and the server type-checks.

## Source of truth
- Product contract: `_bmad-output/specs/spec-lee-tools-storefront/SPEC.md`, plus `brownfield.md` and `stack.md` (same folder). Decisions history: `.memlog.md`.
- Phase build specs (each with tasks, review log and notes): `_bmad-output/implementation-artifacts/spec-phase1-*.md` and `spec-phase2-*.md`.
- Known follow-ups: `_bmad-output/implementation-artifacts/deferred-work.md`.

## Decisions to respect
- Shoppers always see "Liên Hệ" (`src/components/PriceLabel.tsx`). The public API never returns `price`; only admin responses do.
- Nothing about payment or invoices anywhere. Ordering is deferred; the "Đặt hàng ngay" button stays inactive.
- No price-range filter.
- Self-managed backend: Express + Prisma + PostgreSQL in `server/`. The owner rejected Supabase.
- Only a logged-in admin with the right permission can create, edit or delete products and categories. This is enforced in the API.
- Roles are data (`Role.permissions`): `super_admin` = `*`, `product_manager` = `products:write` + `categories:write`.
- Hosting is a separate, later phase. Everything runs locally for now.

## Run locally
See `README.md`. In short:
1. `npm run db:up`
2. `cd server`, then `npx prisma migrate dev`, `npx prisma db seed`, and `npm run create-admin` (the owner types the password; never put passwords in code or chat).
3. `npm run dev:server` (API on :4000) and `npm run dev` (site on :5173, which proxies `/api`).
4. Tests: `cd server && npm test` (needs `TEST_DATABASE_URL`; see README).

## Pending local cleanup
- Recreate the DB container once so the `127.0.0.1` port binding applies: `docker compose up -d --force-recreate`.
- The dev database still has the old Makita specs ("Chổi than", 355mm, 2000w). The seed no longer overwrites existing rows, so fix them by hand or rebuild the dev data.
- `server` `npm run build` fails with EPERM on Windows while the API dev server is running, because it locks the Prisma engine file. Stop the server first.
- `.claude/launch.json` is a local preview config, not part of the site.

## Suggested next step: Phase 3 (admin panel)
Admin pages for login, products (list/create/edit/delete, image upload), categories, and admin users/roles (CAP-8, CAP-11). They need the deferred admin read endpoints first: list and detail including price and id, plus admin deactivation that deletes that admin's sessions. Content management and popups (CAP-10, CAP-4) and customers (CAP-9) can follow.
