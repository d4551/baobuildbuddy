# Top 10 enterprise UX — Cycle 11 (2026-07-20)

Evidence: explore audit + mobile smoke screenshots. SSOT: `docs/STACK-CONTRACT.md`.

## TOP 5 journey gaps (wired)

1. **Dashboard challenge claim unwired** — progress-only; claim only on `/gamification`. **Fix:** claim CTA → `completeChallenge` + refresh.
2. **Skills empty fold clutter** — insights/filters/hero primary before EmptyState. **Fix:** gate on `hasMappings`; EmptyState owns create.
3. **Job detail Apply / i18n / SVG** — raw primary, prop-`t`, unbound stroke. **Fix:** `PRIMARY_ACTION_CLASS`, `useI18n()`, `SVG_STROKE_WIDTH_DEFAULT`.
4. **Interview dual primary** — hero + card both `btn-primary`. **Fix:** hero sole `PRIMARY_ACTION_CLASS`; card outline + touch.
5. **Gamification challenges empty** — muted `<p>`. **Fix:** `EmptyState` CTA dashboard.

## TOP 5 legacy blockers (refactored)

1. **Eden dual-path missing `jobs` prefix** — **Fix:** own `jobs` in validator.
2. **PRIMARY_ACTION debt hot paths** — welcome/interview/skills/detail/settings/studios. **Fix:** migrate + keep density gate.
3. **Consumer `glass-subtle` literals** — **Fix:** `SURFACE_GLASS_SUBTLE_CLASS` SSOT + migrate hot consumers.
4. **Job detail prop-drilled `t`** — **Fix:** `useI18n()` in MainContent/Sidebar/ApplyDialog.
5. **Stack pins** — Nuxt/Vue/daisyUI tip; Elysia `2.0.0-exp.46` (not npm 1.x).

## Proof

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
