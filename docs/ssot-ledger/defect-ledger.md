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

## Avoidance

| Pattern | Root cause | Automated gate |
|---------|------------|----------------|
| Screenshot dir ≠ DB_PATH | `defaultDatabasePath` ignored config | screenshot route tests under `DB_PATH` |
| API docs unauthenticated | allowlisted raw `$fetch` | `validate:no-client-fetch-drift` (no docs allowlist) |
| RPA spawn polluted browsers path | dropped `buildAutomationProcessEnv` | shared unit tests + job-apply integration (host, not sandbox) |
| Desktop scraper dir ignored | stubbed null overrides | `paths.test.ts` configured override + Bun.env adapter |
