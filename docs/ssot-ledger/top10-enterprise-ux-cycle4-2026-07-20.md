# Top 10 enterprise UX — Cycle 4 (2026-07-20)

Evidence: `/opt/cursor/artifacts/cycle4-audit/` (Playwright m→t→d). SSOT: `docs/STACK-CONTRACT.md` (TS constants + CSS + validators; no `.bao` archives).

## TOP 5 journey gaps (wired)

1. **`/ai` 404** — section root had no page; dock/prefixes pointed at orphan. **Fixed:** `pages/ai/index.vue` → `aiChat`.
2. **Empty CTAs missing** — interview/cover-letter/studios/resume/skills/portfolio/docs empties dead-ended. **Fixed:** EmptyState `cta-label-key` + routes/emits; gate `validate:empty-state-ctas`.
3. **Email configure → bare Settings** — lost section context. **Fixed:** `settingsSection('emailDelivery')`.
4. **Settings export/import + Search API server-only** — capabilities unwired. **Fixed:** Settings backup card + `WorkspaceOmniSearch` (navbar) + typed `SearchApi`/`SettingsApi`.
5. **Job recommendations / AI match / analyzeResume unwired** — **Fixed:** bootstrap `fetchRecommendations` strip; jobs AI Match; resume score calls `analyzeResume`.

## TOP 5 legacy blockers (refactored)

1. **Burndown `page.evaluate` after navigation** — context destroyed flake. **Fixed:** locator clicks + settle + re-home.
2. **Nuxt 4.4.8 behind 4.5.0** — bump client pin `^4.5.0` (Elysia stays 2.0.0-exp.45 per STACK-CONTRACT).
3. **Misleading studio empty CTAs labeled Retry** — now Browse studios.
4. **Dual-chat lint wiring** — `validate:no-dual-chat-chrome` in `lint`/`lint:fix` (committed).
5. **Cat-and-mouse empty surfaces** — empty-CTA validator added to lint chain.

## Proof commands

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
