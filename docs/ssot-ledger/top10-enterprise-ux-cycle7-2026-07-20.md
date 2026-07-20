# Top 10 enterprise UX — Cycle 7 (2026-07-20)

Evidence: `/opt/cursor/artifacts/cycle7-audit/` (Playwright m→t→d). SSOT: `docs/STACK-CONTRACT.md` (TS constants + CSS + validators; no `.bao` archives).

## TOP 5 journey gaps (wired)

1. **Chat WS dead / fake streaming** — `WS_ENDPOINTS.chat` unused; empty streaming bubble. **Fixed:** `useChatRealtime` streams chunks into `streamingContent`; HTTP chat remains fallback; bubbles show live text.
2. **Typed `AutomationApi` unused** — all `useAutomation` via `requestApi`. **Fixed:** Eden `api.automation.*` for job-apply/email/scrape/runs/capabilities/verify; removed fetch-drift allowlist for `useAutomation.ts`.
3. **Auth card below fold** — after long profile form. **Fixed:** `SettingsAuthAccessCard` first in settings profile section.
4. **Portfolio empty stacks profile** under EmptyState. **Fixed:** profile gated; EmptyState secondary toggles profile editor.
5. **Jobs empty hero Refresh** burned fold. **Fixed:** hero `#actions` hidden when catalog empty; Refresh secondary inside EmptyState.

## TOP 5 legacy blockers (refactored)

1. **Page-state `'empty'` string softening** — **Fixed:** evidence = `<EmptyState` or `<DashboardOnboardingCard` only.
2. **Empty-state `SKIP_FILES` zombie** — **Fixed:** deleted; tests assert chat EmptyState without CTA fails.
3. **Eden / `requestApi` dual path (automation)** — **Fixed:** `validate:no-eden-dual-path` + Eden migration.
4. **`btn-xs` touch debt** — **Fixed:** `validate:touch-target-density` + upgrade to `btn-sm` + `TOUCH_TARGET_MIN_CLASS`.
5. **Script string sizing escapes** — e.g. ChatVoiceControls `"h-4 w-4"`. **Fixed:** scan script sizing literals; use `ICON_SIZE_CLASS`.

## Also

- Dashboard onboarding: single primary (`PRIMARY_ACTION_CLASS`) + outline secondary (dual-primary ban).

## Proof commands

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
