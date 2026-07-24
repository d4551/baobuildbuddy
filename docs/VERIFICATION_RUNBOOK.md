# Verification Runbook

This is the canonical step-by-step proof flow for BaoBuildBuddy. Run it when you need current evidence that pages, exports, AI, automation, and desktop packaging still work after changes.

Stack truth: [STACK-CONTRACT.md](./STACK-CONTRACT.md).

## What this runbook proves

1. The workspace formats, lints, type-checks, tests, and builds cleanly.
2. The Nuxt SSR app renders every routed page with current screenshots and a per-route report.
3. Multi-viewport Playwright smoke and interactive burndown pass against a live IPv4 client (`127.0.0.1`).
4. Resume, cover-letter, and portfolio exports generate as styled PDF and DOCX files.
5. Runtime automation and desktop verification pass.
6. Tauri 2 release artifacts can be generated on the matching host platform and verified from staged output.

## Before you start

Required tools:

- Bun `1.4.0` (root `packageManager` / `engines`; confirm with `bun run validate:stack-versions`)
- Rust toolchain for desktop builds
- Playwright Chromium via `bun run automation:browsers:install`

Recommended environment:

- `BAO_DISABLE_AUTH=true` for local proof runs
- local AI endpoint configured if you want grounded AI generation in the same pass
- client reachable on **IPv4** `http://127.0.0.1:3001` (`bun run dev` / `dev-stack` default; avoid bare `--host localhost` for Playwright)

Proof-run hygiene:

- keep scratch helpers and one-off proof scripts outside the repo, preferably under `/tmp`
- do not leave repo-local proof helpers, ad hoc audit markdown, or temporary screenshots checked into the worktree at the end of the pass
- UI visual proof is Playwright-only (`proof:browser-smoke` / `proof:browser-burndown`); curl is for API health checks, not page proof

## Step 1: Clear stale local ports

Use the same ports for the whole proof run so screenshots and exports come from one known-good stack.

```bash
lsof -ti tcp:3000 tcp:3001 tcp:3400 tcp:3401 | xargs -r kill
```

If Docker or another process owns `3000`, switch the proof run to `3400/3401`.

## Step 2: Start a clean stack

Default ports (Nuxt binds `127.0.0.1:3001` via `scripts/dev-stack.ts`):

```bash
BAO_DISABLE_AUTH=true bun run dev
```

Alternate proof ports:

```bash
BAO_DISABLE_AUTH=true bun run dev -- --server-port 3400 --client-port 3401
```

Keep that terminal open for the rest of the run. Confirm the UI answers on IPv4 before screenshot passes:

```bash
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3001/
```

If a dev-only Nuxt route hangs or a screenshot pass needs a stable SSR surface, run the proof pass against a built production client instead of the dev server:

```bash
BAO_DISABLE_AUTH=true CLIENT_PORT=3411 PORT=3400 bun run --cwd packages/server dev
PORT=3411 HOST=127.0.0.1 NUXT_PUBLIC_API_BASE=http://127.0.0.1:3400 bun packages/client/.output/server/index.mjs
```

Use `3400/3411` consistently for the rest of the proof when you choose this path.

## Step 3: Run the quality gates

```bash
bun run format:check
bun run lint
bun run test
bun run build:verify
```

These four commands must pass before screenshot or export proof is considered trustworthy.

## Step 4: Verify SSR page contracts

Default ports:

```bash
bun run verify:pages
```

Alternate ports:

```bash
VERIFY_HOST=127.0.0.1 VERIFY_PORT=3401 bun run verify:pages
```

Expected result:

- all localized route renders pass
- each page has non-empty `<title>`, `<h1>`, and `<main>`

## Step 5: Capture fresh screenshots for every routed page

Default ports:

```bash
bun run proof:pages -- --output-dir /tmp/bao-page-proof-$(date +%F)
```

Alternate ports:

```bash
PAGE_PROOF_API_BASE=http://127.0.0.1:3400 \
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3411 \
bun run proof:pages -- --output-dir /tmp/bao-page-proof-$(date +%F)
```

Outputs:

- `report.json` with route, title, h1, alert text, and flagged error keywords
- `report.md` with a readable screenshot checklist
- one PNG per routed page

Review rule:

- inspect every row in `report.md`
- reject the run if `report.json` contains any `flaggedKeywords`
- inspect every screenshot whose row includes alerts and confirm the alert is expected product content rather than a load/runtime failure
- do not treat screenshots as proof if they show the setup gate instead of the intended page
- ask the same five questions for every screenshot:
  1. does the route render the intended page, not a fallback or setup gate?
  2. is the layout using the shared shell, page scaffold, and grid tokens rather than an ad-hoc width or spacing pattern?
  3. are there any overlaps, clipped badges, floating actions on top of content, or broken card heights?
  4. do async states look intentional: loading, empty, error, or success rather than a half-rendered surface?
  5. does the page still look like the same product family as the rest of the app?
- if any screenshot fails those questions, fix the page and rerun the proof set before treating the run as complete

## Step 5b: Multi-viewport browser smoke + interactive burndown

With the same stack still running, prove responsive UI (viewport order **mobile → tablet → desktop**):

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
```

Expected result:

- `proof:browser-smoke` — 0 capture failures across the static route × viewport matrix
- `proof:browser-burndown` — 0 findings; `fiveq-ledger.json` complete for every page × viewport
- human review still uses [PAGE_VERIFICATION_GUIDE.md](./PAGE_VERIFICATION_GUIDE.md) for product-intent checks

Alternate ports: point `PAGE_PROOF_CLIENT_BASE` (and API base if needed) at the same host/port pair used in Step 2.

Fast zero-flag check:

```bash
node -e "const data=require('/tmp/bao-page-proof-'\"$(date +%F)\"'/report.json'); const flagged=data.filter((page)=>page.flaggedKeywords.length||page.alerts.some((alert)=>/failed|error/i.test(alert))); console.log(JSON.stringify(flagged, null, 2)); process.exit(flagged.length === 0 ? 0 : 1)"
```

## Step 6: Verify export generation and styling

Use the live UI or the relevant API routes to generate:

- resume PDF + DOCX
- cover-letter PDF + DOCX
- portfolio PDF + DOCX

Minimum checks for each artifact:

1. the route preview page renders without alerts
2. the PDF first page is styled and readable
3. the DOCX payload contains the same grounded content as the UI
4. theme colors and spacing are consistent across all three export families

Recommended artifact capture pattern:

```bash
mkdir -p /tmp/bao-export-proof
```

Reference API calls:

```bash
# Resume
curl -sS -X POST -H 'content-type: application/json' -d '{"format":"pdf"}' \
  http://127.0.0.1:3400/api/resumes/<resume-id>/export -o /tmp/bao-export-proof/resume.pdf
curl -sS -X POST -H 'content-type: application/json' -d '{"format":"docx"}' \
  http://127.0.0.1:3400/api/resumes/<resume-id>/export -o /tmp/bao-export-proof/resume.docx

# Cover letter
curl -sS -X POST -H 'content-type: application/json' -d '{"format":"pdf"}' \
  http://127.0.0.1:3400/api/cover-letters/<cover-letter-id>/export -o /tmp/bao-export-proof/cover-letter.pdf
curl -sS -X POST -H 'content-type: application/json' -d '{"format":"docx"}' \
  http://127.0.0.1:3400/api/cover-letters/<cover-letter-id>/export -o /tmp/bao-export-proof/cover-letter.docx

# Portfolio
curl -sS -X POST -H 'content-type: application/json' -d '{"format":"pdf"}' \
  http://127.0.0.1:3400/api/portfolio/export -o /tmp/bao-export-proof/portfolio.pdf
curl -sS -X POST -H 'content-type: application/json' -d '{"format":"docx"}' \
  http://127.0.0.1:3400/api/portfolio/export -o /tmp/bao-export-proof/portfolio.docx
```

Render the artifacts with the platform-native tools that match the actual document engines:

```bash
mkdir -p /tmp/bao-export-proof/previews /tmp/bao-export-proof/quicklook

# PDF first-page previews
pdftoppm -png -f 1 -singlefile /tmp/bao-export-proof/resume.pdf /tmp/bao-export-proof/previews/resume-pdf
pdftoppm -png -f 1 -singlefile /tmp/bao-export-proof/cover-letter.pdf /tmp/bao-export-proof/previews/cover-letter-pdf
pdftoppm -png -f 1 -singlefile /tmp/bao-export-proof/portfolio.pdf /tmp/bao-export-proof/previews/portfolio-pdf

# Actual macOS Word renderer previews (preferred over HTML conversion)
qlmanage -t -s 1000 -o /tmp/bao-export-proof/quicklook \
  /tmp/bao-export-proof/resume.docx \
  /tmp/bao-export-proof/cover-letter.docx \
  /tmp/bao-export-proof/portfolio.docx
```

Review rule:

- use the PDF PNGs to inspect spacing, hierarchy, and page density
- use the Quick Look DOCX thumbnails to inspect the real Word-rendered layout
- do not use HTML conversion as the final DOCX proof if Quick Look is available
- the three export families should be visibly distinct:
  - resume: compact and scan-first
  - cover letter: formal one-page correspondence
  - portfolio: showcase / case-study presentation

## Step 7: Verify automation and packaged runtime behavior

```bash
bun run verify:desktop-runtime
```

This validates:

- packaged frontend boot
- manual automation run
- scheduled automation run
- websocket event stream
- scheduled automation recovery after restart

When validating scraper quality, also inspect the latest successful scrape run in the UI and confirm:

- `scraped > 0`
- `upserted > 0`
- `enrichedRecords > 0`
- `warnings` is empty unless a provider is intentionally degraded

## Step 8: Generate Tauri 2 release artifacts

BaoBuildBuddy uses matching-host native release builds. Cross-host generation is intentionally blocked by `scripts/build-desktop-release.ts`.

Run the command that matches the current host:

```bash
# macOS host
bun run release:desktop:macos -- --output-root /tmp/bao-desktop-proof

# Windows host
bun run release:desktop:windows -- --output-root /tmp/bao-desktop-proof

# Linux x64 host
bun run release:desktop:linux-x64 -- --output-root /tmp/bao-desktop-proof

# Linux ARM64 host
bun run release:desktop:linux-arm64 -- --output-root /tmp/bao-desktop-proof
```

Then verify the staged output:

```bash
bun run verify:desktop-releases -- --release-root /tmp/bao-desktop-proof --targets macos
```

Swap `macos` for the host target you actually generated.

For the currently staged repo-local artifact set:

```bash
bun run verify:desktop-releases -- --targets macos,windows,linux-arm64
```

That command validates the staged Tauri 2 artifacts, signatures, payload manifests, provenance, and checksums for the targets already present under `packages/desktop/releases/`.

Important boundary:

- a single host can verify the staged multi-platform artifact set
- a single host cannot freshly regenerate every native installer
- only claim fresh Windows/Linux/macOS regeneration after running the matching host build or CI job for that target

Important:

- macOS can only generate macOS artifacts
- Windows can only generate Windows artifacts
- Linux x64 can only generate Linux x64 artifacts
- Linux ARM64 can only generate Linux ARM64 artifacts

For the full four-target release matrix, use matching CI runners or matching local hosts, then assemble with:

```bash
bun run release:refresh:all-os
```

## Step 9: What to archive with the run

Keep these together for each proof pass:

- quality gate command output
- `/tmp/bao-page-proof-YYYY-MM-DD/report.json`
- `/tmp/bao-page-proof-YYYY-MM-DD/report.md`
- per-page screenshots
- browser smoke / burndown report JSON (`burndown-report.json`, `fiveq-ledger.json` when using `proof:browser-burndown`)
- exported PDF and DOCX files
- PDF first-page screenshots
- Quick Look DOCX thumbnails
- desktop artifact verification output

## Step 10: Fail conditions

The run is not complete if any of these are true:

- any quality gate fails
- `verify:pages` fails
- `proof:browser-smoke` reports capture failures
- `proof:browser-burndown` reports findings or an incomplete 5Q ledger
- `verify:desktop-runtime` fails
- the screenshot report includes alerts or error keywords that are not reviewed and explained
- a screenshot proves the wrong page
- export previews and downloaded files do not match
- a desktop artifact is claimed from the wrong host platform
- the client was only reachable on IPv6/`localhost` while proof tools dialed `127.0.0.1`
