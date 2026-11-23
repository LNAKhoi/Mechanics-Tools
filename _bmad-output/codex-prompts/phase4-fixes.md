# Phase 4 review fixes (for Codex)

Spec: `_bmad-output/implementation-artifacts/spec-phase4-content-management.md`. Review found the problems below. Fix each one with the smallest change that does the job and keep the existing look. Where the server is involved, add or extend tests in `server/test/content.test.ts`.

1. **Home banners** (`src/pages/Home.tsx`): only the first enabled hero banner renders, but the spec matrix requires all enabled banners in order. Render all enabled hero banners as a simple, accessible slider:
   - prev/next buttons with `aria-label`s
   - dot indicators
   - auto-advance that pauses on hover or focus
   - the current hero size
   Apply the same rule to business banners.
2. **Admin banners:** add edit and reorder to the "Nội dung › Banners" screen.
   - Edit covers title, image (through the existing verified upload), link, placement and enabled.
   - Reorder is move up/down and saves `sortOrder`.
3. **Admin popup editor:** allow choosing the popup image through the existing verified upload flow, not only by URL.
4. **`mapEmbedUrl` validation (server):** replace the hostname regex with URL parsing plus an exact hostname allowlist: `www.google.com`, `google.com`, `maps.google.com`, `maps.app.goo.gl`, `goo.gl`. Accept https only. Add tests that reject lookalikes such as `google.com.evil.com` and `evilgoogle.com`.
5. **Seeding:** defaults must not come back after editors reorder, edit or delete them. Seed banners, pages, the popup and site settings only when their table is empty (create-only). Leave roles as they are. Add a test that re-running the seed after a reorder keeps the editor's state.
6. **Popup storage:** wrap every `localStorage` read and write in try/catch, so browsers that restrict storage still render the page. In that case the popup simply shows.
7. **sanitize-html:** force `rel="noopener noreferrer"` on any `<a>` that keeps a `target`.

## Verify
- `cd server && npm test`
- root `npm run build`
- `cd server && npx tsc -p tsconfig.json --noEmit`

PostgreSQL runs at 127.0.0.1:5432. If the sandbox blocks the full test suite, say so plainly and don't claim it passed.

## Rules
- This is a direct fix list for work already in progress. Don't start a BMAD workflow (bmad-build or similar) for it.
- The uncommitted changes in the working tree are Phase 2-4 work and are intentional. Start from them as they are, without asking.
- Don't modify content inside `<frozen-after-approval>`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Never handle, create or invent admin passwords.
- Add what you changed to the spec's Implementation Notes.
- Finish by summarizing what you changed, how you verified it, and anything left.
