# Top 10 enterprise UX basis (2026-07-20)

SSOT: `docs/STACK-CONTRACT.md` (TS constants + CSS + validators). Evidence: `/opt/cursor/artifacts/top10-audit/`.

## TOP 5 journey gaps

1. **Floating chat cannot send @320** — panel `h-96` clips composer; Send under dock.
2. **Jobs → Apply dead** — empty board; CTAs below fold; providers unconfigured from setup.
3. **Setup ≠ readiness** — dashboard “Complete Setup” vs Level/XP; wizard omits job providers.
4. **Settings nested Profile + section friction** — duplicate titles; first-tap section fail.
5. **AI Chat settings-first; dock orphans `/ai/*`** — STT/TTS dominate; no dock active state.

## TOP 5 legacy blockers

1. **Fixed-height floating panel model** — `FLOATING_CHAT_PANEL_SIZE_CLASS` + non-flex body.
2. **`btn-sm`/`btn-xs` on primary CTAs** — density habit; need `PRIMARY_ACTION_CLASS` + lint ban.
3. **PageHeader-as-hero-card everywhere** — triple label (crumb + h1 + dock).
4. **Desktop tables forced @320** — runs/API docs need card surfaces.
5. **Touch floor class-tested not pixel-tested** — navbar computed 40px.

## Fix order (this cycle)

1. Floating chat flex + in-panel composer + geometry gate
2. PRIMARY_ACTION_CLASS + ban `btn-primary`+`btn-sm`
3. Jobs empty first-viewport CTAs
4. AI chat conversation-first; hide FAB on `/ai/chat`
5. PageHeader compact mobile + settings nest reduce
