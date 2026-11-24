Implemented the Phase 6 follow-up fixes:

- Mobile home now shows hero first, full-width with preserved banner ratio, then scrollable category chips.
- Mobile header actions are one row with 44px targets and a cart badge.
- Added the required implementation note.
- Preserved existing uncommitted work; no branch, commit, stash, reset, or admin changes.

Verification passed:

- `npm run build`
- `node scripts/scan-fixed-widths.mjs` — no unprefixed fixed-width classes found.