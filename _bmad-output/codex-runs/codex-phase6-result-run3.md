Implemented the Phase 6 browser-follow-up fixes and updated the spec implementation notes.

Key fixes include responsive logo/banner behavior, mobile checkout stacking, compact order items, wrapping benefit/cart rows, scrollable account tabs, constrained login divider, and 48px mobile chat buttons. Home’s desktop-only fixed widths are now behind `xl:`.

Verified:

- `node scripts/scan-fixed-widths.mjs` → no unprefixed fixed widths
- `npm run build` → passed

No commit, branch switch, reset, stash, admin-page edits, or BMAD workflow was used.