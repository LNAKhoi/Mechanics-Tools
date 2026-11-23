- source_spec: `_bmad-output/implementation-artifacts/spec-phase1-contact-pricing-and-payment-cleanup.md`
  summary: Empty cart still renders the summary panel and an active "Đặt hàng" link, and `/thanh-toan` with an empty cart shows totals and the order button.
  evidence: CartSummary and OrderSummary had no `items.length` guard at baseline 9820672; pre-existing, belongs with the ordering phase.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase1-contact-pricing-and-payment-cleanup.md`
  summary: Order form remaps item images into `/assets/checkout/`, so products whose image is missing there (e.g. `8f51b.png`, Milwaukee M18) show a broken image.
  evidence: `public/assets/checkout/` has no 8f51b.png; OrderItem rewrites `item.image` to `/assets/${assetGroup}/…` since baseline.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase1-contact-pricing-and-payment-cleanup.md`
  summary: Add a test setup (e.g. Vitest + Testing Library or a Playwright route smoke test) asserting every route shows "Liên Hệ" and no đ amount, no payment/invoice/price-filter copy, and breadcrumbs link to `/`.
  evidence: Repo has no test framework; user chose to skip tests for Phase 1 on 2026-11-23, so CAP-1/2/12 can regress silently.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase2-backend-catalog-and-admin-auth.md`
  summary: Homepage category rows ("Máy khoan", "Máy mài", "Máy cưa") all show the same product list instead of each row's category.
  evidence: Pre-existing at baseline; rows have no category slug. Natural fit for Phase 4 storefront work.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase2-backend-catalog-and-admin-auth.md`
  summary: Add admin read endpoints (list/detail with price and ids) and an admin deactivation flow that also deletes that admin's sessions.
  evidence: Admin writes need ids/prices no endpoint exposes; required by the Phase 3 admin panel.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase2-backend-catalog-and-admin-auth.md`
  summary: Harden login throttling for hosting: set trust proxy for the deployment and add a per-account (email) limiter.
  evidence: Per-IP limit only; behind a reverse proxy all clients share one IP. Local-only today, so belongs to the hosting phase.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase2-backend-catalog-and-admin-auth.md`
  summary: Make product search diacritic-insensitive (e.g. Postgres unaccent) so "may mai" finds "Máy mài".
  evidence: contains + mode insensitive handles case only; Vietnamese shoppers often type without accents (CAP-6, Phase 4).

- source_spec: `_bmad-output/implementation-artifacts/spec-phase2-backend-catalog-and-admin-auth.md`
  summary: Category page edge states: unknown /danh-muc/:slug should show not-found, and ?page beyond last page should offer a way back.
  evidence: Both currently show the generic empty state with pagination hidden.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase2-backend-catalog-and-admin-auth.md`
  summary: Frontend tests for the API wiring (URL building, 404 page, API-down error/retry state).
  evidence: Verified manually in the browser only; no frontend test setup exists (joins the Phase 1 test-setup item).

- source_spec: `_bmad-output/implementation-artifacts/spec-phase3-admin-panel.md`
  summary: Run the generated edge-case review lens once its instruction snapshot is readable to reviewers.
  evidence: The mandated edge-case reviewer could not read its generated instruction file because the sandbox denied access.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase3-admin-panel.md`
  summary: Run the generated verification-gap review lens once its instruction snapshot is readable to reviewers.
  evidence: The mandated verification reviewer could not read its generated instruction file because the sandbox denied access.
