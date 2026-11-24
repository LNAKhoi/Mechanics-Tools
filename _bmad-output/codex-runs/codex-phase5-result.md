Implemented Phase 5 discovery and SEO.

- Added Prisma `unaccent` migration and accent/case-insensitive name, brand, SKU search.
- Made homepage rows category-specific with an empty-category state.
- Added category not-found and out-of-range page states.
- Added browser SEO metadata, canonical links, product JSON-LD/BreadcrumbList, and a 404 page.
- Added `/sitemap.xml` and `/robots.txt`, Vite proxy routes, `SITE_URL` docs/config, and API tests.
- Updated the Phase 5 spec checklist and implementation notes.

Verification:
- Passed: `npm run build`
- Passed: `npx tsc -p server\tsconfig.json --noEmit`
- Blocked: `cd server && npm test` because Prisma’s schema-engine download was refused by the sandbox (`ECONNREFUSED`). It should be rerun in an environment with Prisma binary access.