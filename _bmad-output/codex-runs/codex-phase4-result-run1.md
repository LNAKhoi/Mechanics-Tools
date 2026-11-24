Implemented the Phase 4 backend foundation and initial content UI wiring.

Completed:
- Content Prisma models, migration, create-only defaults, and `content_editor` role.
- Public content API endpoints and guarded admin content endpoints.
- HTML sanitization with `sanitize-html`.
- `content:write` access to verified image uploads.
- Initial About/Contact routes, popup, chat bubbles, and admin content navigation.
- Updated the spec checkboxes/Implementation Notes without altering frozen content.

Verified:
- `npm run build` — passed.
- `cd server && npx tsc -p tsconfig.json --noEmit` — passed.

Incomplete/risky:
- The Home hero/business banner and Footer are not yet fully API-driven.
- Admin Contact settings and Popup editor forms are not complete.
- `server/test/content.test.ts`, README updates, and full matrix coverage are not complete.
- `cd server && npm test` could not run because PostgreSQL is unavailable at `localhost:5432`; therefore no server test success is claimed.
- No admin passwords were handled, created, or changed.