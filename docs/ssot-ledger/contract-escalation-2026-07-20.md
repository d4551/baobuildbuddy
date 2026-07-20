# CONTRACT_ESCALATION (2026-07-20)

## Conflict
Parent playbook DONE_IFF mandates `.bao` exclusive UI/UX SSOT.
Repo `docs/STACK-CONTRACT.md` Binding Decision Cycle 1: SSOT = TS constants + CSS tokens + validators; **zero `*.bao` archives**.

## Resolution (owner_wins)
`docs/STACK-CONTRACT.md` wins for BaoBuildBuddy (AGENTS.md §BINDING SSOT).
DONE_IFF clauses requiring `.bao` archive compile / generated primitives = **N/A (waived by contract)**.
Mapped bars:
- UI tokens → `packages/client/constants/*` + `assets/css/main.css`
- Gates → `bun run lint` validators (`validate:ui-*`, daisyUI, glass, etc.)
- Fabric UI proof → `proof:browser-smoke` + `proof:browser-burndown` (Playwright)

## New bar (declared)
Convergence judged under STACK-CONTRACT + browser responsive matrix + mutation-killed validators.
Parent `.bao`-archive migration = out of scope unless product owner starts cutover.
