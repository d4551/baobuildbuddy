# Top 10 enterprise UX — Cycle 13 (2026-07-20)

Evidence: explore audit + browser smoke artifacts + Eden runtime probe. SSOT: `docs/STACK-CONTRACT.md`.

## TOP 5 journey gaps (wired)

1. **Dashboard Quick Actions re-primary hero** — `primaryAction` + every tile `PRIMARY_ACTION_CLASS`. **Fix:** secondary actions only; `OUTLINE_ACTION_CLASS`.
2. **Job-apply dead primary (0 resumes)** — disabled Run, no EmptyState. **Fix:** EmptyState → `/resume` when no resumes.
3. **Automation Workflows dual primary** — hero primary + grid `PRIMARY_BUTTON_VARIANT`. **Fix:** grid outline-only; ring marks recommended.
4. **Filtered empties dead-end** — `FilteredEmptyAlert` message-only. **Fix:** EmptyState + clear CTA; ban FilteredEmptyAlert.
5. **Jobs feed empty by default** — Hitmarker/portals off. **Fix:** default `hitmarkerEnabled` + Hitmarker portal on (primary feed).

## TOP 5 legacy blockers (refactored)

1. **api-docs `requestApi` dual path** — Eden `docs.api.json` works. **Fix:** ClientApi `docs` + Eden fetch; gate owns `apiDocs`.
2. **No OUTLINE_ACTION SSOT** — raw `btn btn-outline` + touch. **Fix:** `OUTLINE_ACTION_CLASS`.
3. **FilteredEmptyAlert soft component** — bypasses EmptyState CTA gate. **Fix:** delete + ban.
4. **PRIMARY density on soft grids** — Quick Actions. **Fix:** outline tiles.
5. **Stack pins** — Nuxt/Vue/daisyUI/eden tip; Elysia `2.0.0-exp.46` (not npm 1.x).

## Proof

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
