Implemented Phase 8 updates without touching existing intentional work.

- Fixed real-template parsing: skips formatted empty rows; defensively handles rich text, formulas, hyperlinks, numbers, and nulls.
- Added regression coverage for the approved template: 3 rows — DTD171Z, GWS750-100, M18FIW2F12; preview counts are 3 added, 0 updated, 0 skipped. Missing local images warn; HTTPS image is accepted.
- Rebuilt admin presentation with a dedicated [admin.css](C:\Users\lnakh\Desktop\Mechanics-Tools\src\pages\admin\admin.css), sidebar, product toolbar/table, import wizard, login card, and drawer behavior.
- Added implementation notes to the Phase 8 spec.

Verification passed:

- `server npm test`
- `server npx tsc -p tsconfig.json --noEmit`
- root `npm run build`
- `node scripts/scan-fixed-widths.mjs`