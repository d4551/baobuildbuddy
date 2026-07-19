# Improvement ledger

| Artifact | Baseline | New | Delta | SSOT bar | Gate |
|----------|----------|-----|-------|----------|------|
| API docs fetch | unauthenticated `$fetch` | Bearer via `requestApi` | auth parity | STACK-CONTRACT API client SSOT | `validate:no-client-fetch-drift` |
| Screenshot dir | always `~/.bao/...` | follows `DB_PATH` | test isolation | path SSOT with DB | screenshot route tests |
| Auth rotate/revoke | forked Bearer parse + hardcoded path | `authenticateApiKey` + `API_ENDPOINTS` | one auth brain | endpoint SSOT | lint + auth routes |
| RPA spawn env | inherit polluted `PLAYWRIGHT_*` | `buildAutomationProcessEnv` + host-platform override | sandbox-safe child env | Playwright path SSOT `@bao/shared` | `playwright-browsers-path.test.ts` (10) + job-apply host |
| Scraper dir override | stubbed nulls | Bun.env → `resolveScraperDirectory` | desktop wiring | paths SSOT (not `env.ts`) | `paths.test.ts` |
| Automation host proof | 178/2 red under agent sandbox | 180/0 green @all-perms | +2 journeys | real Chromium launch | `test-pass4-allperms.txt` / `automation-tests-allperms.txt` |
| Scraper browsers-path read | `process.env` in `browser.ts` | `buildAutomationProcessEnv()` via config SSOT | 0 direct-env viol | env adapter SSOT | `validate:no-direct-env-access` |
| Launch-failure details decode | `String(JsonValue)` in tests | `parseAutomationBrowserLaunchFailureDetails` Result | typed boundary | error-envelope SSOT | `automation-browser-launch-failure.test.ts` |
| ErrorEnvelope.details | `JsonValue` causeMessage | `ErrorEnvelopeDetails` string fields | eslint no-base-to-string 0 | typed diagnostic fields | `eslint-rpa-after-types.txt` |
| Provider secret at-rest | plaintext if no encrypt key | fail-closed throw / no plaintext write | secrets never plain | crypto SSOT | `crypto.test.ts` + settings PUT |
| API key verify | `===` on hashes | `timingSafeEqual` | constant-time | auth SSOT | `crypto.test.ts` / auth tests |
| Local AI endpoint | any URL server-fetch | loopback allowlist only | SSRF deny non-loopback | `validateLocalAiEndpoint` | `local-ai-endpoint.test.ts` + normalize |
| Avoidance: long camelCase describe titles | biome noSecrets false-positive | short human titles | lint green | biome security | `biome-after-describe.txt` |
