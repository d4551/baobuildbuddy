# First-Time Setup Guide

```text ascii-box
+--------------------------+
|      CAREER QUEST MODE   |
|       PRESS START        |
+--------------------------+
```

This guide walks you through getting BaoBuildBuddy running locally for the first time. Think of it as the tutorial level -- follow each checkpoint in order.

## Pick your path

| I want to...                                   | Go here                                                  |
|------------------------------------------------|----------------------------------------------------------|
| Understand the app in simple terms             | [ELI5 System Walkthrough](./ELI5_SYSTEM_WALKTHROUGH.md)  |
| Set up local AI with Ollama                    | [Local AI Setup Guide](./LOCAL_AI_SETUP.md)               |
| Run the full proof pass after setup            | [Verification Runbook](./VERIFICATION_RUNBOOK.md)         |
| Do the full first-time local setup             | Keep reading below                                        |
| Read the full technical reference              | [README.md](../README.md)                                 |

---

## What you're setting up

BaoBuildBuddy is a monorepo with two runtime services:

1. **API server** in `packages/server` (Bun + Elysia, port 3000)
2. **Frontend app** in `packages/client` (Nuxt SSR, port 3001)

One command starts both:

```bash
bun run dev
```

This runs `scripts/dev-stack.ts` to orchestrate startup. It's the recommended path. The client host defaults to **`127.0.0.1`** (IPv4) so browser automation tools that dial IPv4 can reach the UI.

---

## Step 1: Install required tools

### Required

| Tool                     | macOS (Homebrew)                               | Ubuntu / Debian                                      | Windows (winget)                    |
|--------------------------|------------------------------------------------|------------------------------------------------------|-------------------------------------|
| Bun (`bun@1.4.0`)       | `brew install oven-sh/bun/bun`                 | `curl -fsSL https://bun.sh/install \| bash`          | `winget install --id Oven-sh.Bun -e`|
| Git                      | `brew install git`                             | `sudo apt-get update && sudo apt-get install -y git`  | `winget install --id Git.Git -e`    |
| Rust (for desktop builds)| `brew install rustup-init && rustup-init`      | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` | `winget install --id Rustlang.Rustup -e` |

Playwright bundles its own Chromium -- no separate Chrome install needed.

### Optional but recommended

- `curl` and `jq` for diagnostics
- At least one AI provider API key (HuggingFace, OpenAI, Gemini, or Claude)
- Ollama for local AI: [Download](https://ollama.com/download/) | [Quickstart](https://docs.ollama.com/quickstart)

HuggingFace free tier now requires an API token. Create one at https://huggingface.co/settings/tokens.

### Verify everything is on PATH

```bash
bun --version
git --version
rustc --version   # only needed for desktop builds
```

Check the Bun version matches the workspace manifest:

```bash
bun pm pkg get packageManager
# -> "bun@1.4.0"
```

---

## Step 2: Get the code

```bash
git clone https://github.com/d4551/baobuildbuddy.git
cd baobuildbuddy
```

Already have it? Just pull the latest:

```bash
git pull --ff-only
```

---

## Step 3: Run setup

### Option A: Automated setup (recommended)

**macOS / Linux:**
```bash
bash scripts/setup.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

The setup script handles:
1. Checking required tools
2. Validating Bun version against the workspace manifest
3. Installing workspace dependencies
4. Installing Playwright Chromium (unless skipped)
5. Creating `.env` from `.env.example`
6. Generating and pushing DB schema
7. Running `typecheck`, `lint`, and `test` (unless skipped)

**Setup flags:**

| Flag                          | Bash                       | PowerShell             | Effect                              |
|-------------------------------|----------------------------|------------------------|-------------------------------------|
| Skip checks                  | `--skip-checks`            | `-SkipChecks`          | Skip validation after setup         |
| Skip browser install          | `--skip-browser-install`   | `-SkipBrowserInstall`  | Skip Playwright Chromium            |
| Include build                 | `--include-build`          | `-IncludeBuild`        | Run `bun run build` after setup     |
| Include desktop build         | `--include-desktop-build`  | `-IncludeDesktopBuild` | Run Tauri desktop build             |
| Help                          | `--help`                   | `-Help`                | Print usage                         |

After a successful run, you should see:

```text
✅ Bun workspace install complete
✅ Playwright Chromium installed for automation scripts
✅ SQLite schema generated and ready for local runs
✅ Initial validation checks pass
```

### Option B: Manual setup

```bash
bun install
bun run automation:browsers:install
cp .env.example .env          # Windows: copy .env.example .env
bun run db:generate
bun run db:push
```

---

## Step 4: Configure your environment

Edit `.env` with these minimum values:

```text
PORT=3000
DB_PATH=~/.bao/bao.db
NUXT_PUBLIC_API_BASE=/
NUXT_PUBLIC_WS_BASE=/
NUXT_PUBLIC_I18N_DEFAULT_LOCALE=en-US
NUXT_PUBLIC_I18N_FALLBACK_LOCALE=en-US
NUXT_PUBLIC_I18N_LOCALE_COOKIE_KEY=bao-locale
```

> **Important:** Do NOT set `NUXT_PUBLIC_I18N_SUPPORTED_LOCALES` in `.env`. Nuxt replaces the parsed array with a raw string, breaking the i18n plugin. The default is handled in `nuxt.config.ts`.

When you're ready, add:

- `BAO_DISABLE_AUTH=true` to skip auth gating in local dev
- or `BAO_AUTH_SETUP_TOKEN=your-operator-token` if you want auth enabled during first-run setup
- `LOCAL_MODEL_ENDPOINT=http://localhost:11434/v1` for local AI (leave `LOCAL_MODEL_NAME` blank for auto-detect)
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `HUGGINGFACE_TOKEN` as needed
- `AUTOMATION_STDIO_BUFFER_LIMIT=2000` for large scraper outputs

AI provider keys can also be set in the UI via **Settings > AI Providers**.

---

## Step 5: Start the stack

### Recommended (single command)

```bash
bun run dev
```

### Split terminals

Terminal 1:
```bash
bun run dev:server
```

Terminal 2:
```bash
bun run dev:client
```

---

## Step 6: Verify it's working

From a terminal:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/api/auth/status
curl -fsS "http://127.0.0.1:3000/api/jobs?limit=1"
```

Then open `http://127.0.0.1:3001` in your browser and confirm:

1. Home page (dashboard) loads without errors.
2. Settings page is reachable; section rail scrolls on narrow viewports.
3. An API-backed feature returns data (jobs or resumes).
4. Dashboard quick actions reflect your pipeline status.
5. Browser dev tools show no hard errors.

Optional Playwright UI proof (stack must still be running; IPv4 client base):

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
```

---

## Step 7: First-user configuration in the UI

1. Open **Settings**.
2. Configure AI: local model endpoint (see [Local AI Setup](./LOCAL_AI_SETUP.md)) or a provider API key.
3. Save settings.
4. Open **Resume** and create your first resume.
5. Open **Jobs** and run a search to confirm the ingestion pipeline.
6. Open **AI Chat** and send a test message.
7. Open **Automation > Job Apply** and test a non-sensitive sample flow.

---

## Step 8: Run validation (optional but recommended)

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

For the full validation sequence, see [README.md > Validation & Quality Gates](../README.md#validation--quality-gates).

For the complete post-setup proof flow, including page screenshots, export checks, runtime verification, and desktop artifact verification, use [VERIFICATION_RUNBOOK.md](./VERIFICATION_RUNBOOK.md).

If port `3001` is already in use, run page verification against an alternate port:

```bash
PORT=4105 bun run --cwd packages/client preview
VERIFY_HOST=127.0.0.1 VERIFY_PORT=4105 bun run verify:pages
```

---

## Desktop app (optional)

If you want a desktop window instead of a browser tab, see [README.md > Desktop Packaging](../README.md#desktop-packaging-tauri).

Quick start:

```bash
bun run dev:desktop
```

Build an installer:

```bash
bun run build:desktop
```

Requires Rust toolchain (`rustc` + `cargo`).

---

## Troubleshooting

| Problem                              | Fix                                                              |
|--------------------------------------|------------------------------------------------------------------|
| Server starts but UI can't connect   | Check `NUXT_PUBLIC_API_BASE` / `NUXT_PUBLIC_WS_BASE`            |
| Playwright can't reach `:3001`       | Prefer `bun run dev` (IPv4 `127.0.0.1`); avoid bare `--host localhost` |
| Port conflict                        | Change `PORT` in `.env`                                          |
| Playwright browser missing           | Run `bun run automation:browsers:install`                        |
| `curl` health checks fail            | Confirm server shows `Listening on ...` and no startup errors    |
| RPA automation unavailable           | Install Playwright Chromium and retry                            |
| Locales missing or duplicated        | Verify `.env` locale keys match `packages/client/locales`        |

For more, see [README.md > Troubleshooting](../README.md#troubleshooting).

---

## What's next

| Topic                                | Guide                                                    |
|--------------------------------------|----------------------------------------------------------|
| Understand the system architecture   | [ELI5 System Walkthrough](./ELI5_SYSTEM_WALKTHROUGH.md)  |
| Binding stack / UI SSOT              | [STACK-CONTRACT.md](./STACK-CONTRACT.md)                 |
| Set up local AI with Ollama          | [Local AI Setup Guide](./LOCAL_AI_SETUP.md)               |
| Learn the automation flows           | [Automation Guide](./AUTOMATION.md)                       |
| Proof / screenshots                  | [Verification Runbook](./VERIFICATION_RUNBOOK.md)         |
| Deep architecture reference          | [README.md](../README.md)                                 |

---

## UI runtime contracts (reference)

- Core pages use tokenized layout primitives (`PageScaffold`, `PageHeaderBlock`, `SectionGrid`) from `packages/client/constants/ui-layout.ts`.
- Modal flows use `AppModalFrame` with `aria-modal` + `aria-labelledby`.
- Cross-page CTAs come from `packages/client/constants/flow-engine.ts` via `useFlowEngine.ts`.
- Automation pages follow the same tokenized layout and are enforced by `validate:ui-layout-tokens`.
- AI provider display is locale-driven (`aiProviderCatalog.*`) with `AIProviderIcon`.
- Interview role recommendations are derived from profile, readiness rankings, pathway scores, and live job signals.
- Skills readiness copy is locale-driven from typed server IDs (`feedbackId`, `improvementSuggestions`, `nextSteps`).
