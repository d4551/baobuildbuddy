# Top 10 enterprise UX / fabric gaps (2026-07-22)

Contract: `docs/STACK-CONTRACT.md` — TS/CSS token SSOT (not `.bao` archives).

## UX journey gaps

1. BROKEN — job-apply bootstrap uses `readApiDataOrEmpty` → API failure looks like empty resumes
2. UNWIRED — speech UI provider/model not passed to STT request body
3. BROKEN — RPA `follow_apply_link` always steps `ok` after silent skip/nav fail
4. GAPPED — gamification server fire-and-forget vs client session toasts (split feedback)
5. SOFTENED — `validate:i18n-parity` imports merged locales (English fallback counts as translated)

## Legacy blockers

6. VIOLATING/security — desktop packaged runtime forces `BAO_DISABLE_AUTH=true` + weak CSP
7. DUPLICATED — per-composable `readApiData` forks vs `requireApiResponseData` SSOT
8. SOFTENED — `validate:route-nav-coverage` accepts parent-prefix as full child discoverability
9. SOFTENED — `validate:no-monoliths` skips desktop Rust + locale catalogs
10. SUBPAR — settings AI provider test/save silent no-op / missing durable UI state

## Avoidance ledger (start here next)

- `packages/desktop/src-tauri` (Rust monolith, auth/CSP)
- `packages/scraper/src/job-apply` (optimistic step status)
- Locale override catalogs (fr/ja coverage)
- Composable API unwrap forks
- Soft validators (i18n-parity, route-nav, monoliths)
