# Defect ledger (SSOT)

Contract: `docs/STACK-CONTRACT.md` wins over parent `.bao` AGENTS (zero `*.bao` archives).

| ID | Class | Artifact | Status | Evidence |
|----|-------|----------|--------|----------|
| D1 | BROKEN | eslint unsafe-assignment `automation-integration-helpers.ts` | FIXED | `toJsonRecord` via `safeParseJson`; lint green |
| D2 | DRIFTED | `AUTOMATION_SCREENSHOT_DIR` ignored `DB_PATH` | FIXED | `paths.ts` uses `config.dbPath`; screenshot tests green |
| D3 | BROKEN JOURNEY | API docs `$fetch` without Bearer | FIXED | `requestApi` / `requestResolvedApiRaw` |
| D4 | SOFTENED | fetch-drift allowlist for api-docs | FIXED | allowlist removed; validator green |
| D5 | DUPLICATED | auth rotate/revoke manual Bearer | FIXED | `authenticateApiKey` + `API_ENDPOINTS.authRotate/Revoke` |
| D6 | BROKEN (agent-sandbox only) | Playwright Chromium SEGV under Cursor sandbox | MITIGATED/HOST-OK | host all-perms green; sandbox SEGV remains host-agent limit |
| D7 | GAPPED | `BAO_SCRAPER_DIR` / script-runner stubbed | FIXED | `paths.ts` Bun.env adapter → `resolveScraperDirectory` |
| D8 | SUBPAR | spawn env inherit / `os.cpus` host tag | FIXED | `buildAutomationProcessEnv` + host-platform override |
| D9 | VIOLATING | scraper `browser.ts` direct `process.env` | FIXED | `validate:no-direct-env-access` EXIT:0 |
| D10 | BROKEN | `rpa-runner.test.ts` no-base-to-string | FIXED | `ErrorEnvelopeDetails` narrows causeMessage |
| D11 | SECURITY/FORKED | plaintext provider secrets when `!isEncryptionAvailable()` | FIXED | fail-closed encrypt + `timingSafeEqual` |
| D12 | SECURITY/GAPPED | `localModelEndpoint` SSRF | FIXED | loopback-only `validateLocalAiEndpoint` |
| D13 | FLAKE/BROKEN | automation.integration private-host env gap | FIXED | `test-setup.ts` preloads `BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS` + encryption; 3/3 stress green (`automation-stress-fixed-*.txt`) |
| D14 | VIOLATING | `packages/client/dist` abs macOS symlink tracked | FIXED | `git rm` + `validate:no-abs-path-symlinks` |
| D15 | LYING/WRONG-PATHS | raw-design-token shadow test used primitive owner path | FIXED | retargeted to `CONSUMER_PATH` |
| D16 | BROKEN/GAPPED | client vitest crash without `.nuxt` | FIXED | `test` → `prepare:workspace-types && vitest` |
| D17 | DUPLICATED | Nuxt auto-import collisions (schedule + readApiData) | FIXED | `schedule-timestamp.ts` + `requireApiResponseData` / `readApiDataOrEmpty` |
| D18 | VACUOUS | `audit:stack-versions` npm-latest vs locked Elysia 2 | FIXED | `validate:stack-versions` asserts installed pins |
| D19 | SUBPAR | 183 `vue/html-indent` warnings | FIXED | eslint --fix → 0 html-indent warnings |

## Avoidance

| Pattern | Root cause | Automated gate |
|---------|------------|----------------|
| Host abs symlink in tree | committed `dist` → `/Users/...` | `validate:no-abs-path-symlinks` |
| Shadow test green on exempt primitive | test path ∈ `CONTROL_PRIMITIVE_OWNERS` | consumer-path unit test |
| Client vitest order-dependent | test skipped Nuxt prepare | package `test` bootstrap |
| Dup Nuxt auto-imports | twin exports across composables | prepare warning silence + schedule/api SSOT |
| Stack audit lied Elysia 1.4.29 | `npm view` latest ≠ override | `validate:stack-versions` |
| Integration 401/disallowed host on bare `bun test` | env only in package.json bash wrapper | `src/test-setup.ts` preload |
