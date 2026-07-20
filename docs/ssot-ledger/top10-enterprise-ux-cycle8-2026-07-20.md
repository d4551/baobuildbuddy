# Top 10 enterprise UX — Cycle 8 (2026-07-20)

Evidence: `/opt/cursor/artifacts/cycle8-audit/`. SSOT: `docs/STACK-CONTRACT.md` (TS constants + CSS + validators; no `.bao` archives).

## TOP 5 journey gaps (wired)

1. **Interview WS double-write / no onmessage** — **Fixed:** WS-or-HTTP single path via `submitViaWs` + `onmessage` feedback; removed post-HTTP mirror submit/end.
2. **Gamification weekly/monthly dead** — **Fixed:** hub fetches Eden `weekly`/`monthly`; `GamificationTrendsCard` surfaces trends.
3. **Automation hub dual primary** — **Fixed:** hero sole `PRIMARY_ACTION_CLASS`; overview card demoted to outline + touch floor.
4. **Hero fold stats/steps on mobile** — **Fixed:** cover/portfolio/interview asides gated with `VISIBILITY_HIDE_BELOW_SM_CLASS`.
5. **AI dashboard zero-providers alert** — **Fixed:** `EmptyState` + CTA to Settings `aiProviders`.

## TOP 5 legacy blockers (refactored)

1. **CoverLetters Eden dual path** — **Fixed:** `useCoverLetter` + job-apply bootstrap use `api.coverLetters.*`; export download stays binary helper.
2. **`validate:no-eden-dual-path` automation-only** — **Fixed:** owns `coverLetters` prefix too.
3. **Touch density btn-xs-only** — **Fixed:** `btn-sm` also requires `TOUCH_TARGET_MIN_CLASS` / `PRIMARY_ACTION_CLASS`.
4. **Page-state loading/error string softening** — **Fixed:** evidence = `<LoadingSkeleton` / `<BootstrapErrorAlert` only.
5. **Stack pins** — Nuxt 4.5.0 / Vue 3.5.40 / daisyUI 5.6.18 / Elysia `2.0.0-exp.46` already tip (npm); no bump needed.

## Proof commands

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
