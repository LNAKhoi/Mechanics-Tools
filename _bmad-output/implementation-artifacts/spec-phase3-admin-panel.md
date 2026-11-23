---
title: 'Phase 3: protected Vietnamese admin panel'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '54090ab6b637b08f704ea1ee102c7d557c46113e'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/specs/spec-lee-tools-storefront/SPEC.md', '{project-root}/_bmad-output/specs/spec-lee-tools-storefront/stack.md', '{project-root}/_bmad-output/HANDOFF.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Catalog writes and admin authentication exist, but staff have no usable protected interface for managing the catalog, images, or administrator access.

**Approach:** Build Vietnamese `/quan-tri` pages backed by protected admin read, upload, and administrator-management endpoints. Preserve the public storefront contract: it never receives prices, and shopper authentication remains separate.

## Boundaries & Constraints

**Always:** Require an active server session for every admin resource; enforce permissions in the API. Product managers may manage products, categories, and product image uploads. Only a super-admin may view/deactivate administrators or roles. Upload only bounded, verified raster image files into local `server/uploads`; return `/uploads/...` paths. Deactivating an administrator deletes their sessions immediately. Use Vietnamese UI copy; show numeric prices only inside protected admin pages.

**Never:** Change public price behavior, shopper mock authentication, payment/invoice/order flows, responsive rework, hosting, content/popups/customers, or existing Phase 2 changes. Do not create, solicit, transmit, display, or invent any admin password; first-admin creation remains the existing local interactive CLI workflow.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Admin entry | Anonymous visits `/quan-tri/*` | Redirect to `/quan-tri/dang-nhap`; successful login returns to dashboard | Generic Vietnamese login error; no password persistence |
| Catalog list/detail | Authenticated product manager | Paged/searchable products include id and price; detail and categories feed editor | 401 returns login; 403 shows access notice; API error supports retry |
| Product image | Product manager selects PNG/JPEG/WebP image within 5 MB | Server stores a generated safe filename and returns its `/uploads/` URL | Reject invalid type/signature, size, or count with 400/413 |
| Product/category mutations | Valid permitted form submission | Create/edit/delete calls guarded routes and refreshes UI | Field errors and 409 conflicts appear in Vietnamese; destructive action requires confirmation |
| Admin access | Super-admin views admins/roles and deactivates another active admin | List excludes hashes; deactivation revokes sessions | 403 for other roles; reject self-deactivation/final super-admin |

</frozen-after-approval>

## Code Map

- `server/src/app.ts` -- mounts auth before globally guarded admin router and exposes `uploadsDir`; add upload handling safely.
- `server/src/routes/admin-catalog.ts`, `server/src/serializers.ts` -- reuse validators, Prisma error mapping, `adminProduct`, and `adminCategory`; add protected reads only.
- `server/src/auth/{middleware,routes,password,session}.ts` -- reuse session context, permissions and deletion; add access management without hashes.
- `server/prisma/schema.prisma` -- existing role/admin/session relations support list and transactional deactivation.
- `server/test/admin.test.ts` -- existing isolated auth helpers; extend endpoint and revocation coverage.
- `src/lib/api.ts` -- remains public-only; new credentialed admin client/types/hooks go separately.
- `src/App.tsx`, `src/main.tsx`, `src/index.css`, `src/admin/` -- register isolated admin routes, shell, guard, tables and forms without changing shopper providers.

## Tasks & Acceptance

**Execution:**
- [x] `server/src/routes/admin-catalog.ts`, `server/src/serializers.ts` -- add protected product/category list and product-by-id endpoints, including price/id, pagination and search.
- [x] `server/src/routes/admin-upload.ts`, `server/package.json`, `server/src/app.ts` -- add permission-gated, signature-checked image upload with generated filenames and limits.
- [x] `server/src/routes/admin-users.ts`, `server/src/app.ts` -- add super-admin role/admin lists and transactional deactivation with session deletion and unsafe-target guards.
- [x] `server/test/admin.test.ts` -- cover reads, permission boundaries, upload rejection/success and immediate session invalidation.
- [x] `src/lib/admin-api.ts`, `src/admin/`, `src/pages/admin/`, `src/App.tsx` -- implement typed client, session guard, Vietnamese login/shell, catalog/category CRUD, uploads, and administrator/role list/deactivation.
- [x] `README.md` -- document local routes and upload behavior without credentials.

**Acceptance Criteria:**
- Given a logged-in product manager, when they create or edit a product with an uploaded image, then it appears in protected admin UI and its public response still has no `price`.
- Given no valid session or permission, when an admin resource is called, then the server rejects it and no data/files change.
- Given a super-admin deactivates another active admin, when that admin’s session calls `/api/admin/auth/me`, then it is rejected.
- Given a non-super-admin opens administrators, then page and API deny access.

## Implementation Notes

- Auto-proceed decision: preserve the owner-authorized dirty Phase 2 worktree. Use `/quan-tri` to avoid shopper-route collisions. Administrator creation is deferred because the owner prohibited handling or inventing admin passwords; the existing interactive CLI remains provisioning.

## Spec Change Log

## Review Triage Log

| # | Layer | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | B | Saving a product erases specs | medium | `ProductForm` submits `specs: []` for every save; existing product details contain specs. | patch |
| 2 | B | Products beyond first 20 cannot be managed | medium | Admin client/UI only requests default page and has no pagination controls. | patch |
| 3 | B | Search can show stale results | low | Each query starts an unguarded promise that may resolve out of order. | patch |
| 4 | B | Revoked/expired session remains in admin shell | medium | 401 is rendered as a request error instead of returning to sign-in, contrary to matrix behavior. | patch |
| 5 | B | Unauthorized direct admin route renders raw feature content | medium | Nested routes have no permission guard; a product manager reaches Users then sees only a 403 error. | patch |
| 6 | B | Field validation messages are hidden | medium | `AdminApiError.fieldErrors` is collected but never rendered. | patch |
| 7 | B | Failed loads have no retry control | low | Error display is static although the matrix calls for retry. | patch |
| 8 | B | Existing category sort order cannot be edited | medium | Edit prompt preserves the prior `sortOrder`; category CRUD needs editable ordering. | patch |
| 9 | B | Fractional admin pagination can reach Prisma skip | medium | `Number()` accepts `2.5` and sends a non-integer skip rather than a normalized request. | patch |
| 10 | B | Simultaneous super-admin deactivation can remove all super-admins | medium | Independent transactions can each observe two active super-admins before either writes. | patch |
| 11 | E | Edge-case review unavailable | maybe-false | Generated reviewer instruction file was sandbox-denied; no claims were reviewed. | defer |
| 12 | V | Verification-gap review unavailable | maybe-false | Generated reviewer instruction file was sandbox-denied; no claims were reviewed. | defer |

## Design Notes

Use HTTP-only session cookies and `GET /me` for page access; client-side navigation is never the security boundary.

Implemented protected catalog reads, signature-verified local uploads, super-admin access management with transactional session revocation, and an isolated Vietnamese `/quan-tri` application surface.

## Verification

**Commands:**
- `cd server && npm test` -- suite passes against the separate test database.
- `npm run build` -- storefront type-check and build pass.
- `cd server && npm run build` -- Prisma generation and server type-check pass while API is stopped.

**Manual checks:**
- Run both local servers; a locally provisioned administrator can exercise login, edits, image upload, categories and session revocation without credentials entering chat or source.
