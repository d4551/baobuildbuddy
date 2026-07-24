# Top 10 enterprise UX — Cycle 14 (2026-07-24)

Evidence: explore audit + live browser smoke/burndown + Cmd+K probe. SSOT: `docs/STACK-CONTRACT.md` (TS/CSS tokens — not `.bao` archives).

## TOP 5 journey gaps (wired)

1. **Cmd/Ctrl+K opened chat** — enterprise palette expects search. **Fix:** Cmd/Ctrl+K → `bao:open-omni-search`; Cmd/Ctrl+Shift+K → chat focus.
2. **Omni search incomplete fabric** — jobs/studios/skills/resumes only. **Fix:** cover-letters, portfolio-projects, interview-sessions, automation-runs via `SEARCH_RESULT_TYPES`.
3. **AI chat shell SUBPAR** — no PageScaffold; bespoke empty card. **Fix:** PageScaffold + EmptyState CTA to AI dashboard; prompt chips in actions.
4. **Email delivery unconfigured soft link** — **Fix:** `PRIMARY_ACTION_CLASS` configure CTA.
5. **Keyboard↔nav incomplete** — **Fix:** g-then shortcuts for cover letter/portfolio/skills/studios/AI/automation/gamification; `keyboardOptional` for AI dashboard; gate.

## TOP 5 legacy blockers (refactored)

1. **Search type DRIFT + swallow** — shared singular vs server plural. **Fix:** `@bao/shared/constants/search` SSOT; settle+log table failures; parity gate.
2. **OUTLINE_ACTION under-gated** — ~24 raw `btn btn-outline`. **Fix:** migrate + `validate:outline-action-density` (+ soft).
3. **Stack tip lag** — Elysia `2.0.0-exp.49` + `websocket()`, typebox 1.3.8, daisyUI 5.7, biome 2.5.5, playwright 1.61, vitest/zod/vue-query tip.
4. **Desktop soft echo lint** — **Fix:** `validate-desktop-package` + ban soft package scripts.
5. **`btn-soft` chips / control debt** — **Fix:** `SOFT_ACTION_CLASS` SSOT.

## Proof

```bash
bun run lint   # EXIT 0 (warnings-only html-indent remain)
bun run test   # server 183 + scripts 278 green
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke   # 0 failures
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown # 0 findings
# Cmd+K probe: dialogVisible=true inputFocused=true → browser-cycle14/desktop-cmdk-omni.png
```
