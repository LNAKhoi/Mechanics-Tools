- source_spec: `_bmad-output/implementation-artifacts/spec-phase1-contact-pricing-and-payment-cleanup.md`
  summary: Empty cart still renders the summary panel and an active "Đặt hàng" link, and `/thanh-toan` with an empty cart shows totals and the order button.
  evidence: CartSummary and OrderSummary had no `items.length` guard at baseline 9820672; pre-existing, belongs with the ordering phase.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase1-contact-pricing-and-payment-cleanup.md`
  summary: Order form remaps item images into `/assets/checkout/`, so products whose image is missing there (e.g. `8f51b.png`, Milwaukee M18) show a broken image.
  evidence: `public/assets/checkout/` has no 8f51b.png; OrderItem rewrites `item.image` to `/assets/${assetGroup}/…` since baseline.

- source_spec: `_bmad-output/implementation-artifacts/spec-phase1-contact-pricing-and-payment-cleanup.md`
  summary: Add a test setup (e.g. Vitest + Testing Library or a Playwright route smoke test) asserting every route shows "Liên Hệ" and no đ amount, no payment/invoice/price-filter copy, and breadcrumbs link to `/`.
  evidence: Repo has no test framework; user chose to skip tests for Phase 1 on 2026-11-23, so CAP-1/2/12 can regress silently.
