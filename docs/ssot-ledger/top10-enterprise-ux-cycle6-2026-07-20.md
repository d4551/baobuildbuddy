# Top 10 enterprise UX — Cycle 6 (2026-07-20)

Evidence: `/opt/cursor/artifacts/cycle6-audit/` (Playwright m→t→d). SSOT: `docs/STACK-CONTRACT.md` (TS constants + CSS + validators; no `.bao` archives).

## TOP 5 journey gaps (wired)

1. **Chat → job-apply automation** — assistant JSON action never executed. **Fixed:** parse + `POST /ai/automation-action` after chat confirm.
2. **Auth key rotate/revoke** — server-only. **Fixed:** `AuthApi` + `SettingsAuthAccessCard` on profile.
3. **Interview WS unused** — **Fixed:** `useInterviewRealtime` mirrors submit/end on session page.
4. **Eden `ScraperApi` dead** — **Fixed:** direct catalog sync after RPA scrape success.
5. **Portfolio empty projects card** — **Fixed:** gate `PortfolioProjectsCard` when empty (profile stays for Edit profile).

## TOP 5 legacy blockers (refactored)

1. **EmptyState title-regex + SKIP_FILES softening** — **Fixed:** all EmptyStates require CTA; skip only chat panels.
2. **`ui/` prefix exemption** — **Fixed:** closed `CONTROL_PRIMITIVE_OWNERS` only (+ icons).
3. **Primary density static `class=` only** — **Fixed:** scan `:class` too.
4. **Elysia pin lag** — **Fixed:** `2.0.0-exp.45` → `2.0.0-exp.46` (STACK + overrides).
5. **Vue pin lag** — **Fixed:** `^3.5.30` → `^3.5.40` (Nuxt/daisyUI already current).

## Proof commands

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
