# Zero-debt grind — 2026-07-25

## Caught / fixed this turn

1. **Dock orphan (automation mobile)** — Jobs dock owns `/automation*` via `dockMatchPrefixes`. Smoke was red (5 dock orphans); now **69/0**. Visual: Jobs active on automation + job-apply.
2. **OpenAPI codemod stubs** — copy-paste wrong verbs (`POST generate` = Delete…), `$toApiChildPath` junk, duplicate blurbs → burndown `duplicate-chrome-copy` on `/docs/api`. All **105** `openapiDetail` strings unique; career-automation suffix banned.
3. **Validator harden** — `validate-openapi-descriptions` fails on duplicate descriptions, codemod junk, and stub suffix.
4. **Soft test early-return** — dock-active spec no longer `return`s after `toBeTruthy()`.

## Proof (browser, not curl)

- `proof:browser-smoke` → 69 captures, 0 failures (`/workspace/artifacts/baseline/browser-smoke/report.json`)
- `proof:browser-burndown` → 57 page×viewport, 0 errors, 0 findings
- Screenshots: `/opt/cursor/artifacts/zero-debt-grind/screenshots/`

## Loop answers

1. Fixed fully/honestly this turn? **Yes** for dock orphan + OpenAPI duplicate/stub debt + validator ratchet. WS routes still lack OpenAPI descriptions (empty) — not rendered as docs `<p>` duplicates; tracked as schema surface gap if UI lists them later.
2. Lint softenings present? **No** — biome/eslint no-softenings stay wired at 0.
