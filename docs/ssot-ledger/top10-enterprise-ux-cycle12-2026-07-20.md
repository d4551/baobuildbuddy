# Top 10 enterprise UX — Cycle 12 (2026-07-20)

Evidence: browser visual audit (mobile) + Eden runtime path probe. SSOT: `docs/STACK-CONTRACT.md`.

## TOP 5 journey gaps (wired)

1. **Cover letters Eden 404** — `api.coverLetters` → `/api/coverLetters` (404); route is `/api/cover-letters`. Broke `/cover-letter` + interview bootstrap. **Fix:** ClientApi key `"cover-letters"` + all consumers; gate bans camel.
2. **Interview hub hard-error from cover-letter fetch** — Promise.all failed on camel path. **Fix:** same kebab Eden path.
3. **BootstrapErrorAlert SVG warn** — `SVG_STROKE_WIDTH_DEFAULT` used without import. **Fix:** import + repair other consumers.
4. **Gamification max-level copy** — Level 10 has no nextLevel; UI said "0 XP until level 11". **Fix:** `xpMaxLevelLabel` when until=0.
5. **PRIMARY_ACTION literals** — remaining Vue `btn-primary` strings. **Fix:** migrate to `PRIMARY_ACTION_CLASS` + ban quoted `btn-primary` in `.vue`.

## TOP 5 legacy blockers (refactored)

1. **Eden kebab mismatch soft typing** — hand ClientApi claimed `coverLetters`. **Fix:** typed `"cover-letters"` + validator.
2. **PRIMARY density gate incomplete** — only shrunk primaries. **Fix:** ban quoted `btn-primary` literals.
3. **SURFACE_GLASS_SUBTLE** — cycle 11 consumer literals (prior).
4. **Stack pins** — Nuxt/Vue/daisyUI tip; Elysia stays `2.0.0-exp.46` (npm 1.x is wrong axis).
5. **Missing SVG stroke imports** after bulk PRIMARY migration.

## Proof

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
