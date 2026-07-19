# Improvement ledger

| Artifact | Baseline | New | Delta | SSOT bar | Gate |
|----------|----------|-----|-------|----------|------|
| API docs fetch | unauthenticated `$fetch` | Bearer via `requestApi` | auth parity | STACK-CONTRACT API client SSOT | `validate:no-client-fetch-drift` |
| Screenshot dir | always `~/.bao/...` | follows `DB_PATH` | test isolation | path SSOT with DB | screenshot route tests |
| Auth rotate/revoke | forked Bearer parse + hardcoded path | `authenticateApiKey` + `API_ENDPOINTS` | one auth brain | endpoint SSOT | lint + auth routes |
| RPA spawn env | inherit polluted `PLAYWRIGHT_*` | `buildAutomationProcessEnv` + host-platform override | sandbox-safe child env | Playwright path SSOT `@bao/shared` | `playwright-browsers-path.test.ts` (10) + job-apply host |
| Scraper dir override | stubbed nulls | Bun.env → `resolveScraperDirectory` | desktop wiring | paths SSOT (not `env.ts`) | `paths.test.ts` |
| Automation host proof | 178/2 red under agent sandbox | 180/0 green @all-perms | +2 journeys | real Chromium launch | `test-pass4-allperms.txt` / `automation-tests-allperms.txt` |
