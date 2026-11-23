# Phase 6 implementation (for Codex)

Implement `_bmad-output/implementation-artifacts/spec-phase6-responsive-storefront.md`, following the layout design in `_bmad-output/specs/spec-lee-tools-storefront/responsive-layout.md`. The spec and that design are the only source of truth: read both fully before you start.

Work page by page. Keep today's exact desktop classes behind the desktop breakpoint (`xl:`, 1280px and up) so the 1920px view doesn't change.

## Verify
- root `npm run build`
- `cd server && npm test`, which should be unaffected; if the sandbox blocks it, say so plainly
- the fixed-width scan script described in the spec

Claude will do the visual checks at 375, 768 and 1920px in the browser afterwards.

## Rules
- Don't start a BMAD workflow. Implement the spec directly.
- The working tree may have uncommitted changes. They are intentional; start from them without asking.
- Don't modify content inside `<frozen-after-approval>`.
- Don't touch `src/pages/admin` or `src/lib/admin-api.ts`.
- Stay on `feature/phase2-backend`. Don't commit, push, reset, stash or switch branches.
- Never handle admin passwords.
- Work on your own and don't stop to ask. Record judgment calls under Implementation Notes and tick finished task checkboxes.
- Finish by summarizing what you changed, how you verified it, and anything incomplete or risky.
