---
title: 'Phase 4: content management (banners, About/Contact pages, promo popup)'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '97d66e955f1054b1f3e1bc4e2de80eca5969448e'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-lee-tools-storefront/SPEC.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/stack.md', '{project-root}/_bmad-output/implementation-artifacts/spec-phase3-admin-panel.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The homepage banners, the store and contact details, and any promotion are hard-coded. There are no About Us or Contact Us pages, and staff can't change displayed content without a developer.

**Approach:** Add content stored in the database, edited from new `/quan-tri` screens and read by the storefront through public API endpoints:
- homepage banners
- About Us and Contact Us pages (rich text plus structured shop info)
- one promotional popup with an on/off switch

A new `content_editor` role can manage content only.

## Boundaries & Constraints

**Always:**
- Every content write needs an admin session plus the `content:write` permission, enforced in the API.
- The public endpoints return only published or enabled content.
- Rich text is sanitized on the server before saving, so no script or event-handler attributes can get in.
- Banner and popup images use the existing verified upload flow.
- Copy is in Vietnamese and the current storefront look is kept. If the database has no content yet, the pages show seeded defaults taken from today's hard-coded content, so the site never looks empty.

**Never:**
- Responsive rework (Phase 6).
- SEO and meta tags (Phase 5).
- Prices, payment, invoices or ordering.
- Sending email.
- Changes to the shopper mock login.
- Creating admin passwords.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Banner order | Editor reorders or disables homepage banners | Home hero shows enabled banners in order; a banner with a link navigates to it | No enabled banners → seeded default hero |
| Page edit | Editor saves About Us with `<script>` or `onerror=` | Stored HTML has them stripped; the page renders safe content | Empty title → 400 with field error |
| Contact info | Editor updates address, hotlines, email, map URL | Contact page and footer hotlines show the new values | Map URL must be https from Google Maps, otherwise 400 |
| Popup | Popup enabled with a schedule window | Shown once per visitor per popup version while inside the window; close button and Esc dismiss it | Outside the window or disabled → not shown |
| Chat bubbles | Visitor clicks the Zalo or Facebook bubble | Opens the configured `zaloUrl` / `messengerUrl` in a new tab | Not configured yet → link goes to `/lien-he`; admin screen shows "Chưa cấu hình" |
| Permissions | `content_editor` calls product write; `product_manager` calls content write | 403 both ways | — |

**Decisions (Khoi, 2026-11-23):**
- **Contact:** no message form. The Contact Us page shows info only (address, hotlines, email, map). Every storefront page gets floating **Zalo and Facebook Messenger chat bubbles** that open a chat with the owner.
- **Contact links are temporary:** the owner's Zalo and Facebook links aren't confirmed yet. Ship a temporary version: both links are empty settings that staff fill in later from `/quan-tri`. Seed no fake links. While a link is empty, its bubble goes to `/lien-he`.
- **Popup:** shows once per visitor until staff save a new popup version (stored in the visitor's browser with a key that includes the version).

</frozen-after-approval>

## Code Map

- `src/pages/Home.tsx`: `Hero` and `BusinessBanner` are hard-coded and get read from `/api/content/banners`. `Brands` stays static.
- `src/components/Footer.tsx`: the `stores`, `hotlines` and "Giới thiệu" link get read from `/api/content/site`. Link "Giới thiệu" to `/gioi-thieu` and add a "Liên hệ" link to `/lien-he`.
- `src/App.tsx`: new routes `/gioi-thieu` and `/lien-he`. The popup is mounted once in `Layout`.
- `server/src/routes/`: new `content.ts` (public) and `admin-content.ts` (guarded with `requireAdmin` plus `requirePermission('content:write')`). Reuse `admin-upload.ts` for images and let `content:write` upload too.
- `server/prisma/schema.prisma`:
  - `Banner` (title, imageUrl, linkUrl?, placement `hero|business`, sortOrder, isEnabled)
  - `Page` (slug `gioi-thieu|lien-he`, title, html, updatedAt)
  - `SiteSettings` single row (address, hotlines Json, email, zaloUrl?, messengerUrl?, mapEmbedUrl, stores Json). `zaloUrl` must be `https://zalo.me/...` and `messengerUrl` must be `https://m.me/...`, otherwise 400.
  - `Popup` (title, html, imageUrl?, linkUrl?, isEnabled, startsAt?, endsAt?, version)
- `server/prisma/seed-data.ts`: create-only seeding of the defaults from today's hard-coded content. Add the role `content_editor` (`content:write`).
- `src/pages/admin/AdminPanel.tsx`: add a "Nội dung" section with Banners, Pages (a simple rich-text editor), Contact info and Popup screens. Hide it from roles without `content:write`.

## Tasks & Acceptance

**Execution:**
- [x] Prisma models and migration `content`, plus create-only seed defaults and the `content_editor` role.
- [x] `server/src/routes/content.ts`: `GET /api/content/banners`, `/api/content/pages/:slug`, `/api/content/site` and `/api/content/popup`, returning published or enabled items only.
- [x] `server/src/routes/admin-content.ts`: CRUD for banners and pages, plus PUT for site settings and the popup (saving the popup bumps its `version`). Validate with zod, sanitize HTML with `sanitize-html` using an allowlist, and let `content:write` use the upload route.
- [x] Storefront: Home hero and business banner, `/gioi-thieu`, `/lien-he`, footer data, and a dismissible accessible popup (focus trap, Esc, `aria-modal`). Loading and error states fall back to the defaults.
- [x] Storefront: `ChatBubbles` mounted once in `Layout`. Fixed bottom-right, with Zalo and Messenger icon buttons, `aria-label`s, opening in a new tab with `rel="noopener noreferrer"`, falling back to `/lien-he` when the link is empty. They must not cover the popup's close button.
- [x] Admin "Nội dung" screens with Vietnamese labels, a preview link, and a confirmation before deleting.
- [x] `server/test/content.test.ts`: covers every matrix row, including HTML sanitization and both 403 directions.
- [x] README: content API table and the new role.

**Acceptance Criteria:**
- Given a `content_editor` session, when they change the hero banner and the About Us text in `/quan-tri`, then the storefront shows the change after a reload, with no code change.
- Given the popup is enabled, when a new visitor opens Home, then it appears once, and after it is dismissed it doesn't reappear until staff save a new version (per the frequency answer).
- Given any public content response, then it contains no disabled or unpublished items.

## Implementation Notes

- Phase 4 review fixes: Home hero and business banners now rotate through every enabled banner with accessible controls and pause behavior. Banner administration supports editing and saved move-up/move-down ordering; popup images can use verified uploads. Server validation uses an exact HTTPS Google Maps hostname allowlist, rich-text links with targets are given `noopener noreferrer`, content defaults seed only into empty tables, and popup storage access is guarded for restricted browsers. Added regression coverage for hostile map lookalikes, link rel sanitization, and reseeding after a banner reorder.
- Verification (review fixes): `npm run build` and `cd server && npx tsc -p tsconfig.json --noEmit` pass. `cd server && npm test` is blocked by the sandbox's Prisma schema-engine download proxy (`ECONNREFUSED 127.0.0.1:9`), so no full test-suite pass is claimed.

- Implemented the database models, migration, create-only seed values, public content endpoints, permission-gated content administration endpoints, and `content:write` image-upload access. The popup public response is restricted by enabled state and schedule.
- Added initial storefront content routes, popup, and chat-bubble components. The existing hard-coded Home hero/business banner and footer have not yet been fully replaced with API-driven rendering, and the admin Contact/Popup forms and automated `content.test.ts` coverage remain incomplete.
- Verification: root build and server TypeScript check pass. `cd server && npm test` could not run because the configured isolated PostgreSQL database is unavailable at `localhost:5432`; no test result is claimed.
- Completed the API-driven hero, business banner, and footer fallback paths; added structured Vietnamese Contact and Popup editor forms. Empty Zalo and Messenger fields persist as `null`; relative storefront links are accepted for banners and popups.
- Corrected admin router ordering so `content_editor` reaches content routes before the super-admin users guard. Test workers now explicitly target `TEST_DATABASE_URL`, and the shared test database runs in one Vitest fork.
- Verification: PostgreSQL was reachable at `127.0.0.1:5432`; `content.test.ts` passes all 5 matrix tests. Root build and server TypeScript checks pass. The unmodified `npm test` command is blocked in the sandbox by Prisma's schema-engine download proxy; with the local schema engine enabled, the full suite was started against `lee_tools_test` but its wrapper returned before a final complete report.

## Spec Change Log

## Review Triage Log

- high — Public About and Contact routes bypassed `Layout`; verified and patched by wrapping both route elements in `Layout`, restoring header, footer, chat bubbles and popup.
- medium — Multiple enabled banners are stored but only the first of each placement is rendered; real but the spec does not define carousel or multi-banner presentation, so this requires a product decision.
- medium — Banner administration lacks an edit/reorder interaction beyond create and enable/disable; verified against `AdminPanel.tsx`, and remains a UI completion gap.
- medium — Popup image entry is URL-only despite the available verified upload flow; verified and remains a UI completion gap.
- medium — Reseeding identifies defaults by mutable placement/sort order and can recreate an editor-reordered default; verified and remains a data-seeding gap.
- low — Contact currently links to, rather than embeds, the configured map; the intent only requires showing map information, so the current link is retained.
- medium — The Google Maps hostname regex accepts lookalike domains; verified and remains a validation hardening gap.
- medium — Contact fallback lacked default hotlines and map; verified and patched with complete fallback contact data.
- low — Direct `localStorage` access can throw in storage-restricted browsers; not demonstrated in supported deployment, deferred as defensive hardening.
- low — The page editor is HTML-source based rather than a formatting toolbar; the required simple rich-text editor is functionally represented by sanitized HTML input, but richer authoring UX remains a future improvement.

## Verification

**Commands:**
- `cd server && npm test`: reaches the isolated PostgreSQL database only when Prisma is pointed to its locally installed schema engine; `content.test.ts` passes all 5 tests. The sandbox blocks the unmodified command's Prisma engine download, and the full-suite wrapper did not return a final report.
- `npm run build` (root) and `cd server && npx tsc -p tsconfig.json --noEmit`: both succeed.

**Manual checks:**
- With both servers running, edit each content type in `/quan-tri` and confirm Home, `/gioi-thieu`, `/lien-he`, the footer and the popup update.
