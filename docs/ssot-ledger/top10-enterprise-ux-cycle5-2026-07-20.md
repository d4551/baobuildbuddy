# Top 10 enterprise UX — Cycle 5 (2026-07-20)

Evidence: `/opt/cursor/artifacts/cycle5-audit/` (Playwright m→t→d). SSOT: `docs/STACK-CONTRACT.md` (TS constants + CSS + validators; no `.bao` archives).

## TOP 5 journey gaps (wired)

1. **Jobs empty @320** — search/filters + duplicate Configure/Refresh burned fold. **Fixed:** hide search/filters when catalog empty; EmptyState owns Configure (`cta-to` settingsSection); hero keeps one Refresh.
2. **Resume / cover-letter empty CTA papering** — `cta-label-key=""` while hero owned primary. **Fixed:** EmptyState owns Create/Generate; hero primary hidden when catalog empty; gate rejects empty CTA strings.
3. **Portfolio empty** — Stats/Preview/Export/filters above fold before Add. **Fixed:** gate hero actions/stats/filters when `isPortfolioEmpty`; EmptyState owns Add Project.
4. **Studios @320** — vertical StatsRow before filters. **Fixed:** filters first; stats `VISIBILITY_HIDE_BELOW_SM_CLASS`; true-empty vs filtered-empty CTAs.
5. **Dense tables / touch** — Settings AI routing + interview recent sessions overflow traps; prep `btn-xs`; job-apply join without touch floor. **Fixed:** ResponsiveDataSurface dual-surface across wide tables; prep + join CTAs use `PRIMARY_ACTION_CLASS` / `TOUCH_TARGET_MIN_CLASS`.

## TOP 5 legacy blockers (refactored)

1. **`validate-empty-state-ctas` softening** — any `cta-label-key=` (incl. `""`) passed; emptyCatalog exempt. **Fixed:** require non-empty label + `cta-to` or `@cta`; destroy `""` softening.
2. **`automation` / `scraper` typed as `object`** — verify/context unwired. **Fixed:** `AutomationApi` / `ScraperApi`; `getVerifyContext` + job-apply resume prefill when enabled.
3. **Search autocomplete typed but unused** — **Fixed:** `useWorkspaceSearch` debounce + OmniSearch suggestion list via `api.search.autocomplete.get`.
4. **`validate-ui-pagination-tables` overflow-only escape** — missed multi-column `table-sm`. **Fixed:** 3+ `<th` requires `ResponsiveDataSurface`.
5. **Primary/touch density gaps** — outline join / `btn-xs` prep links. **Fixed:** touch floors on interview prep + job-apply join.

## Proof commands

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
