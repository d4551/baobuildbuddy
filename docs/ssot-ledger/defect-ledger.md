# Defect ledger (SSOT)

Contract: `docs/STACK-CONTRACT.md` wins over parent `.bao` AGENTS (zero `*.bao` archives).

| ID | Class | Artifact | Status | Evidence |
|----|-------|----------|--------|----------|
| D1 | BROKEN | eslint unsafe-assignment `automation-integration-helpers.ts` | FIXED | `toJsonRecord` via `safeParseJson`; lint green |
| D2 | DRIFTED | `AUTOMATION_SCREENSHOT_DIR` ignored `DB_PATH` | FIXED | `paths.ts` uses `config.dbPath`; screenshot tests green |
| D3 | BROKEN JOURNEY | API docs `$fetch` without Bearer | FIXED | `requestApi` / `requestResolvedApiRaw` |
| D4 | SOFTENED | fetch-drift allowlist for api-docs | FIXED | allowlist removed; validator green |
| D5 | DUPLICATED | auth rotate/revoke manual Bearer | FIXED | `authenticateApiKey` + `API_ENDPOINTS.authRotate/Revoke` |
| D6 | BROKEN (agent-sandbox only) | Playwright Chromium SEGV under Cursor sandbox | MITIGATED/HOST-OK | `chromium-launch-allperms.txt` EXIT:0; `automation-tests-allperms.txt` 2/2 pass; sandbox SEGV remains host-agent limit |
| D7 | GAPPED | `BAO_SCRAPER_DIR` / script-runner stubbed | FIXED | `paths.ts` Bun.env adapter → `resolveScraperDirectory` + script-runner; `env.ts` untouched |
| D8 | SUBPAR | spawn env inherit / `os.cpus` host tag | FIXED | `buildAutomationProcessEnv` + `resolvePlaywrightHostPlatformOverride` on spawn + scraper sanitize |
| D9 | VIOLATING | `packages/scraper/src/runtime/browser.ts` direct `process.env` | FIXED | consumers use `buildAutomationProcessEnv()`; `validate:no-direct-env-access` EXIT:0 (`env-gate-final.txt`) |
| D10 | BROKEN | `rpa-runner.test.ts` `@typescript-eslint/no-base-to-string` L245-247 | FIXED | `ErrorEnvelopeDetails` narrows `causeMessage?: string` @ SSOT; eslint EXIT:0 (`eslint-rpa-after-types.txt`); test file unedited (host HB019/BT019) |
| D11 | SECURITY/FORKED | plaintext provider secrets when `!isEncryptionAvailable()` | FIXED | `buildApiKeysUpdate` + import sanitize fail-closed; decrypt returns null for `enc:` without key; `timingSafeEqual` verify; server test exports `BAO_ENCRYPTION_KEY` (`settings-crypto-after-key.txt`) |
| D12 | SECURITY/GAPPED | `localModelEndpoint` SSRF (any URL fetch) | FIXED | `validateLocalAiEndpoint` loopback-only @ shared; normalize nulls non-loopback; settings test-provider rejects (`local-ai-endpoint.test.ts`) |
| D13 | FLAKE/BROKEN | automation.integration fixture submission wait | OPEN | intermittent `submission count >= N` timeout (`test-rescan6.txt`, `automation-integration-retry3.txt`); not sandbox SEGV |

## Avoidance

| Pattern | Root cause | Automated gate |
|---------|------------|----------------|
| Screenshot dir ≠ DB_PATH | `defaultDatabasePath` ignored config | screenshot route tests under `DB_PATH` |
| API docs unauthenticated | allowlisted raw `$fetch` | `validate:no-client-fetch-drift` (no docs allowlist) |
| RPA spawn polluted browsers path | dropped `buildAutomationProcessEnv` | shared unit tests + job-apply integration (host, not sandbox) |
| Desktop scraper dir ignored | stubbed null overrides | `paths.test.ts` configured override + Bun.env adapter |
| Scraper browser.ts env read | non-config file read `process.env` | `validate:no-direct-env-access` |
| Protocol unit test misclassified as browser E2E | host BT019 on `rpa-runner.test.ts` | human allowlist / rewrite path (open) |
