# Verification Runbook

This is the canonical step-by-step proof flow for BaoBuildBuddy. Run it when you need current evidence that pages, exports, AI, automation, and desktop packaging still work after changes.

Stack truth: [STACK-CONTRACT.md](./STACK-CONTRACT.md).

## What this runbook proves

1. The workspace formats, lints, type-checks, tests, and builds cleanly.
2. The Nuxt SSR app renders every routed page with current screenshots and a per-route report.
3. Resume, cover-letter, and portfolio exports generate as styled PDF and DOCX files.
4. Runtime automation and desktop verification pass.
5. Tauri 2 release artifacts can be generated on the matching host platform and verified from staged output.

## Before you start

Required tools:

- Bun `1.3.11`
- Rust toolchain for desktop builds
- Playwright Chromium via `bun run automation:browsers:install`

Recommended environment:

- `BAO_DISABLE_AUTH=true` for local proof runs
- local AI endpoint configured if you want grounded AI generation in the same pass

## Step 1: Clear stale local ports

Use the same ports for the whole proof run so screenshots and exports come from one known-good stack.

```bash
lsof -ti tcp:3000 tcp:3001 tcp:3400 tcp:3401 | xargs -r kill
```

If Docker or another process owns `3000`, switch the proof run to `3400/3401`.

## Step 2: Start a clean stack

Default ports:

```bash
BAO_DISABLE_AUTH=true bun run dev
```

Alternate proof ports:

```bash
BAO_DISABLE_AUTH=true bun run dev -- --server-port 3400 --client-port 3401
```

Keep that terminal open for the rest of the run.

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
PAGE_PROOF_CLIENT_BASE=http://localhost:3401 \
bun run proof:pages -- --output-dir /tmp/bao-page-proof-$(date +%F)
```

Outputs:

- `report.json` with route, title, h1, alert text, and flagged error keywords
- `report.md` with a readable screenshot checklist
- one PNG per routed page

Review rule:

- inspect every row in `report.md`
- inspect every screenshot whose row includes alerts or flagged keywords
- do not treat screenshots as proof if they show the setup gate instead of the intended page

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

Store the downloaded files there and render PDF page one to PNG for visual review.

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
- exported PDF and DOCX files
- PDF first-page screenshots
- desktop artifact verification output

## Step 10: Fail conditions

The run is not complete if any of these are true:

- any quality gate fails
- `verify:pages` fails
- `verify:desktop-runtime` fails
- the screenshot report includes alerts or error keywords that are not reviewed and explained
- a screenshot proves the wrong page
- export previews and downloaded files do not match
- a desktop artifact is claimed from the wrong host platform
