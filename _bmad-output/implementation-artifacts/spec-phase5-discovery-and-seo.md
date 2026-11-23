---
title: 'Phase 5: discovery and SEO (accent-insensitive search, category rows, category edge states, meta tags, sitemap)'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: 'd14cf6130d00df79fd88041ee226fd1de3292c87'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-lee-tools-storefront/SPEC.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/stack.md', '{project-root}/_bmad-output/implementation-artifacts/deferred-work.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Shoppers who type without accents ("may mai") find nothing. The three homepage product rows all show the same products. Unknown categories and out-of-range pages show a confusing empty list. Every page has the same title, there is no meta description, and there is no sitemap, so search engines can't index the shop well (CAP-5, CAP-6).

**Approach:**
- Make search ignore accents and case, including đ/Đ.
- Feed each homepage row from its own category.
- Give the category page proper not-found and out-of-range states.
- Add per-page titles, meta descriptions and canonical links.
- Have the API serve `sitemap.xml` and `robots.txt`.

## Boundaries & Constraints

**Always:**
- Search matches name, brand and SKU ignoring diacritics and case. Results keep today's order.
- No price appears anywhere in meta tags, structured data or the sitemap. Product structured data (JSON-LD `Product`) omits `offers`.
- The site's base URL comes from the `SITE_URL` env var (default `http://localhost:5173`), so hosting can change it without code changes.
- Vietnamese titles follow the pattern `<page> | LEE's tools`, and descriptions are 160 characters or fewer.

**Never:**
- Server-side rendering or a framework change.
- Responsive rework (Phase 6).
- Ordering.
- Changing how admins edit content.
- Making up product facts for SEO.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Unaccented search | `q=may mai` | Returns "Máy mài góc Bosch 100 mm" | — |
| đ search | `q=dung cu` and `q=đá` | Match "dụng cụ…" and "Đá…" items | — |
| Home rows | Home loads | Row 1 = `may-khoan`, row 2 = `may-mai-may-cat`, row 3 = `may-cua-gia-cong-go` products | Empty category → "Sản phẩm đang được cập nhật" plus a "Xem danh mục" link |
| Unknown category | `/danh-muc/khong-ton-tai` | "Không tìm thấy danh mục" with a link to `/danh-muc` | — |
| Page out of range | `/danh-muc?page=99` with 1 page | "Trang không tồn tại" with a link to page 1 | — |
| Meta | Product page | `<title>` = product name pattern; description from product description; canonical `/san-pham/:slug`; JSON-LD Product without offers | API error → generic site meta |
| Sitemap | `GET /sitemap.xml` | Valid XML listing `/`, `/danh-muc`, every category, every product, `/gioi-thieu`, `/lien-he` with `SITE_URL` | — |
| robots | `GET /robots.txt` | Allows all, disallows `/quan-tri`, and references the sitemap | — |

**Decision (Khoi, 2026-11-23):** Zalo/Facebook link previews (server-injected Open Graph tags) wait for the hosting phase. This phase sets meta tags in the browser only; `index.html` keeps a generic LEE's tools title, description and image for shared links.

</frozen-after-approval>

## Code Map

- `server/src/routes/catalog.ts:32`: search uses `contains` with `mode: 'insensitive'` on name, brand and SKU. Switch to the Postgres `unaccent` extension (enabled in a new migration), comparing `unaccent(lower(field))` with `unaccent(lower(q))` through a Prisma raw query or a generated `searchText` column. Keep pagination and ordering identical.
- `src/pages/Home.tsx`: the hard-coded `rows` titles map to the category slugs above, and each row calls `useProducts({ category, limit: 6 })`.
- `src/pages/Category.tsx`: add the unknown-slug and page-out-of-range states, using the categories list it already loads.
- `src/lib/seo.ts` (new): a `useSeo({ title, description, canonical, jsonLd })` hook that sets `document.title` and upserts meta, link and JSON-LD tags. Use it on Home, Category, Product, About, Contact and the 404 page. `index.html` keeps the default meta.
- `server/src/routes/seo.ts` (new): `GET /sitemap.xml` and `GET /robots.txt`. Add the Vite dev proxy entries for both.

## Tasks & Acceptance

**Execution:**
- [x] Migration enabling `unaccent`, plus the accent-insensitive search in `catalog.ts`. Add tests for the matrix's search rows, including đ and uppercase.
- [x] Per-category Home rows with the empty-row state.
- [x] Category not-found and out-of-range states.
- [x] `src/lib/seo.ts` hook, applied to all public pages. JSON-LD `Product` (name, brand, sku, image, description) and `BreadcrumbList`, with no price.
- [x] `server/src/routes/seo.ts`: sitemap and robots, with tests checking valid XML and the URLs listed.
- [x] `SITE_URL` added to `server/.env.example` and the README.

**Acceptance Criteria:**
- Given the seeded catalog, when a shopper searches "may mai", then the Bosch grinder appears.
- Given any product page, when its HTML head is inspected in the browser, then the title, description and canonical are product-specific, and no price appears in any tag.
- Given `GET /sitemap.xml`, then every public product and category URL is listed and `/quan-tri` is not.

## Implementation Notes

- Implemented accent-insensitive filtering in PostgreSQL with a Prisma migration that enables `unaccent`; raw SQL selects ordered product IDs, then Prisma loads the existing public serializer shape, preserving the established bestseller/id ordering and pagination.
- `useSeo` derives browser canonical URLs from the active storefront origin. `SITE_URL` is used by the API's crawled discovery documents, avoiding a build-time hosting URL requirement for the SPA.
- Added explicit catalog edge states and a 404 page rather than routing unknown paths back to Home.
- `server/npm test` could not complete in this sandbox: Prisma attempted to download `schema-engine.exe` from `binaries.prisma.sh`, but network access was refused (`ECONNREFUSED 127.0.0.1:9`). The owner should rerun it where Prisma's engine is available.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `cd server && npm test`: blocked by the sandbox's refused Prisma engine download; not claimed as passed.
- `npm run build` (root) and `cd server && npx tsc -p tsconfig.json --noEmit`: both succeeded.

**Manual checks:**
- In the browser, search "may mai" and "dung cu"; open an unknown category and `?page=99`; view the product page head; open `/sitemap.xml` and `/robots.txt`.
