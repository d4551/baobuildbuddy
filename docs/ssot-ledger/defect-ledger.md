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

| D20 | BROKEN JOURNEY | Nuxt `--host localhost` IPv6-only; Playwright/`127.0.0.1` unreachable | FIXED | `dev-stack` defaults `LOOPBACK_HOST_IPV4`; smoke `CLIENT_BASE` IPv4; tests updated |
| D21 | DUPLICATED | Settings page subtitle repeated via `fallback-description-key` | FIXED | removed fallback; section `descriptionKey` for profile/preferences (i18n×4) |
| D22 | DUPLICATED | AI chat context chips stacked (panel+sidebar) below xl; header+aside at xl | FIXED | aside `hidden xl:flex`; header chips `xl:hidden` |
| D23 | SUBPAR | Mobile dock/tab targets &lt;44px; jobs placeholder truncates @320 | FIXED | `TOUCH_TARGET_MIN_CLASS` / `SHELL_DOCK_ITEM_CLASS`; short placeholder + full aria |
| D24 | BROKEN UX | Mobile navbar section label truncates to "A…"/"In…" @320 | FIXED | hide label below `sm`; logo+aria brand; page h1 owns section; `MAX_W_40_CLASS` for sm+ |
| D25 | DUPLICATED | Scraper providers description in navigator + CapabilityGrid | FIXED | grid intro removed; navigator SSOT; burndown chrome-copy gate |
| D26 | GAPPED | Interactive burndown desktop-only / 3-click / no 5Q | FIXED | canonical `browser-interaction-burndown.ts` mobile→tablet→desktop + 5Q ledger |
| D27 | BROKEN UX | Section rail tab labels clip mid-word @320 (Prefe/Re…) | FIXED | remove overflow-x-clip; shrink-0 rail; icon-only labels below sm; aria-label retained |
| D28 | DUPLICATED | Settings panel h2 repeats WorkspaceSectionNavigator title | FIXED | panel headers meta-only / removed under navigator |
| D29 | SUBPAR | Chat-page Scope/Surface/Route chips + long composer hint @320 | FIXED | chips only on floating-widget; short composerHint en/es |
| D30 | BROKEN | /studios/analytics hydration mismatch (orphan ref vs useAsyncData) | FIXED | analytics payload via useAsyncData data; SSR=client |
| D31 | BROKEN | FloatingChatToggleButton SVG_STROKE_WIDTH_DEFAULT unbound | FIXED | import from layout SSOT |
| D32 | SUBPAR | Sidebar/navbar targets 42px < WCAG 2.5.5 44px | FIXED | SHELL_SIDEBAR_ITEM_CLASS + TOUCH_TARGET_MIN_CLASS on menu |
| D33 | SUBPAR | Empty contact flex on portfolio preview | FIXED | v-if email\|website |
