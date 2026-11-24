Implemented the responsive storefront foundation: mobile drawer/search, accessible filter sheet, fluid product cards and gallery, mobile cart cards, responsive footer/auth layouts, and product sticky purchase bar.

Verification:

- `npm run build` passes.
- `server/npm test` is blocked: Prisma’s engine download is refused by the sandbox, then Vitest reports no test files.
- `scripts/scan-fixed-widths.mjs` runs and flags 3 remaining desktop-width literals in `Home.tsx` (`1776px`, `1476px` ×2). Mobile CSS currently constrains them, but they still need conversion to `xl:` classes for the scan to pass cleanly.

I recorded these notes and task status in the Phase 6 spec.