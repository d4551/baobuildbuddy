# Top 10 enterprise UX basis (2026-07-20)

SSOT: `docs/STACK-CONTRACT.md` (TS constants + CSS + validators). Evidence: `/opt/cursor/artifacts/top10-audit/`, `/opt/cursor/artifacts/top10-cycle2/`.

## TOP 5 journey gaps

1. **Floating chat cannot send @320** — FIXED (flex panel + in-panel Send + geometry gate).
2. **Jobs → Apply dead** — HARDENED (hero Configure when catalog empty; EmptyState primary-first CTAs).
3. **Setup ≠ readiness** — FIXED (hide XP card until `profile.name`; Setup demoted to secondary).
4. **Settings nested Profile + section friction** — FIXED (title → Settings; `omitActiveHeadingBelowLg`).
5. **AI Chat / Automation dock orphans** — FIXED (dock = dashboard/jobs/ai-chat/automation/settings + `/ai` prefix match).

## TOP 5 legacy blockers

1. **Fixed-height floating panel model** — FIXED.
2. **`btn-sm`/`btn-xs` on primary CTAs** — FIXED (`PRIMARY_ACTION_CLASS` + lint).
3. **PageHeader-as-hero-card / triple label** — HARDENED (compact header + settings heading collapse).
4. **Desktop tables forced @320** — FIXED (`ResponsiveDataSurface` + dual-surface gate on wide zebra).
5. **Touch floor class-tested not pixel-tested** — HARDENED (`box-border h-11 py-0` + smoke under-44 probe).

## Cycle-2 fix order (this tip)

1. Readiness contradiction kill (gamification gated on profile identity)
2. Dock IA: AI + Automation primary destinations + `isDockRouteActive`
3. `ResponsiveDataSurface` for runs / scraper jobs / interview history
4. Settings H1/H2/tab collapse + i18n title parity
5. Smoke probes: dock orphans, runs table width, touch under 44, setup×XP conflict
