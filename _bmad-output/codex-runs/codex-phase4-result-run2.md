Implemented Phase 4 content management work, including API-driven homepage/footer fallbacks, public About/Contact pages, popup/chat bubbles, admin content screens, seeded defaults, sanitization, permissions, and README documentation.

Also fixed:
- `content_editor` access being blocked by router ordering.
- Empty Zalo/Messenger fields persisting as `null`.
- Relative storefront banner links.
- Test database isolation and single-fork test configuration.
- Contact-page layout/fallback content and Google Maps hostname validation.
- Seed duplication after banner reordering.

Verification:
- `npm run build` — passed.
- `cd server && npx tsc -p tsconfig.json --noEmit` — passed.
- `server/test/content.test.ts` — 5/5 passed against PostgreSQL at `127.0.0.1:5432`.

The unmodified `cd server && npm test` remains blocked in the sandbox because Prisma attempts to download its schema engine through a blocked proxy. With the locally installed engine explicitly selected, the suite reached the test DB; the execution wrapper returned before a complete final suite report, so I cannot honestly claim the full suite passed.

I did not commit, push, reset, stash, switch branches, or handle any admin passwords.