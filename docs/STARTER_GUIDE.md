# BaoBuildBuddy First-Time Setup Guide

```text ascii-box
+--------------------------+
|      CAREER QUEST MODE   |
|       PRESS START        |
+--------------------------+
```

If you need deeper architecture and runbook details, see the full runbook: [README.md](../README.md).

Use this guide if this is your first time running BaoBuildBuddy locally.
Think of it as the tutorial level: follow each checkpoint in order before unlocking the rest of the project.

## Release Validation and Rebuild

For the full production validation sequence, script verification commands, and expected outcomes, see [README.md § Release Validation Workflow](../README.md#release-validation-workflow).

UI runtime contracts:

- Core pages use tokenized layout primitives (`PageScaffold`, `PageHeaderBlock`, `SectionGrid`) backed by `packages/client/constants/ui-layout.ts`.
- Modal flows use `AppModalFrame` with required dialog semantics (`aria-modal` + `aria-labelledby`).
- Cross-page CTA and next-step decisions come from one source: `packages/client/constants/flow-engine.ts` and `packages/client/composables/useFlowEngine.ts`.
- Automation pages (`/automation`, `/automation/job-apply`, `/automation/email`, `/automation/runs`, `/automation/runs/:id`, `/automation/scraper`) follow the same tokenized layout contract and are enforced by `validate:ui-layout-tokens`.
- AI provider display copy/icons are locale-driven (`aiProviderCatalog.*`) with a shared icon component (`AIProviderIcon`) to avoid hardcoded provider UI metadata.
- Interview role recommendations are derived from profile role, readiness role rankings, pathway match scoring, and live job titles; static role slug lists are removed.
- Skills-readiness UI copy is locale-driven from typed server IDs (`feedbackId`, `improvementSuggestions`, `nextSteps`) instead of service hardcoded prose.

## 1) Understand what is being started

BaoBuildBuddy is a monorepo with two runtime services:

1. API server in `packages/server`
2. Nuxt SSR app in `packages/client`

The standard one-command workflow starts both at once with:

```bash
bun run dev
```
`bun run dev` executes `scripts/dev-stack.ts` to orchestrate server/client startup.

This is the recommended path for first-time setup.

## 2) Install required tools

Install these before running setup:

Required:

- Bun runtime pinned to `bun@1.3.10` via `packageManager` in root `package.json`
- Git
- Rust + Cargo (for desktop builds)

Optional but recommended:

- curl
- jq
- At least one AI provider API key (HuggingFace token, OpenAI, Gemini, or Claude)

### 2.1 Installables (quick install commands)

| Tool | macOS (Homebrew) | Ubuntu / Debian | Windows (winget) |
|------|-------------------|------------------|------------------|
| Bun (from `packageManager` = `bun@1.3.10`) | `brew install oven-sh/bun/bun` | `curl -fsSL https://bun.sh/install \| bash` | `winget install --id Oven-sh.Bun -e` |
| Git | `brew install git` | `sudo apt-get update && sudo apt-get install -y git` | `winget install --id Git.Git -e` |
| Rust | `brew install rustup-init && rustup-init` | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` | `winget install --id Rustlang.Rustup -e` |

Playwright bundles its own Chromium — no separate Chrome or PHP install needed.

HuggingFace free tier now requires an API token. Create one at https://huggingface.co/settings/tokens and set `HUGGINGFACE_TOKEN` in `.env` or via the Settings UI.

Read Bun baseline from the workspace manifest when selecting an installer:

```bash
bun pm pkg get packageManager
# -> "bun@1.3.10"
```

```powershell
bun pm pkg get packageManager
# -> "bun@1.3.10"
```

Verify each tool is on `PATH`:

```bash
bun --version
git --version
rustc --version
```

On Windows you can verify Rust with:

```powershell
rustc --version
cargo --version
```

Expected pre-flight state before running setup:

- ✅ Bun runtime matches manifest baseline (`packageManager` in root `package.json`)
- ✅ Git available
- ✅ Rust toolchain available when desktop builds are needed
- ✅ Playwright Chromium is installed by `bun run automation:browsers:install`

## 2.6 Version drift check (recommended before first build)

Run the repository stack audit command to confirm local package registry alignment:

```bash
bun run audit:stack-versions
```

Run these alignment gates and keep local setup aligned to their outputs:

- `bun run ci:alignment` (for CI or any frozen-lockfile validation run)
- `bun run audit:stack-versions`
- `bun run verify:bun-baseline`
- `bun run validate:alignment`
- `bun pm pkg get packageManager`
- `bun pm pkg get dependencies.nuxt dependencies.elysia dependencies.daisyui dependencies.tailwindcss`

Expected pass patterns:

```text
bun run audit:stack-versions
# prints package names and latest npm versions

bun run ci:alignment
# runs bun ci, then validate:alignment

bun run verify:bun-baseline
# prints "✅ Bun baseline and 1.3.9 guard checks passed"

bun run validate:alignment
# prints "daisyUI component contract validation passed." and layout-token validation pass output

bun pm pkg get packageManager
# -> "bun@1.3.10"
```

daisyUI contract coverage in this gate:

- Shell layout: `packages/client/layouts/default.vue` and `packages/client/components/layout/AppNavbar.vue` must preserve drawer/navbar blueprint semantics.
- Core surfaces: jobs, automation, and skills flows are checked for `card`, `btn`, `table`, `list`, `progress`, and `radial-progress` usage.
- Accessibility rule: radial progress indicators must expose `role="progressbar"` and `aria-valuenow`.

## 3) Get the code

```bash
git clone https://github.com/d4551/baobuildbuddy.git
cd baobuildbuddy
```

If you already have the repository:

```bash
git pull --ff-only
```

## 4) First-run bootstrap (recommended)

### 4.1 One command for macOS / Linux

```bash
bash scripts/setup.sh
```

### 4.2 One command for Windows (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

The setup script:

1. Checks required tools.
2. Validates Bun major/minor against `packageManager` in root `package.json`.
2. Installs workspace dependencies.
3. Installs Playwright Chromium for the Bun automation runtime unless skipped.
4. Creates `.env` from `.env.example`.
5. Generates and pushes DB schema.
6. Runs `typecheck`, `lint`, and `test` unless skipped.
7. Optionally runs `bun run build` when `--include-build` / `-IncludeBuild` is provided.
8. Optionally runs `bun run build:desktop` when `--include-desktop-build` / `-IncludeDesktopBuild` is provided.

After a successful run, you should be able to confirm:

```text
✅ Bun workspace install complete
✅ Playwright Chromium installed for automation scripts
✅ SQLite schema generated and ready for local runs
✅ Initial validation checks pass
```

### 4.3 Script flags

| Command | Meaning |
|---------|---------|
| `--skip-checks` (Bash) / `-SkipChecks` (PowerShell) | Skip validation checks after setup |
| `--skip-browser-install` (Bash) / `-SkipBrowserInstall` (PowerShell) | Skip Playwright Chromium installation |
| `--include-build` (Bash) / `-IncludeBuild` (PowerShell) | Run `bun run build` after setup checks |
| `--include-desktop-build` (Bash) / `-IncludeDesktopBuild` (PowerShell) | Run `bun run build:desktop` (setup script applies UTF-8 locale env for macOS DMG bundling) |
| `--help` (Bash) / `-Help` (PowerShell) | Show script usage |

### 4.4 If setup stops with a warning or error

1. Read the first `[FAIL]` block in the script output.
2. Re-run the same setup command.
3. Run the failing command directly for details.

Common fixes:

- Update Bun to satisfy manifest baseline (`packageManager` in root `package.json`) and rerun setup.
- Run `bun run automation:browsers:install` if Playwright Chromium is missing.
- Install Chrome from the official package for your OS.

### 4.5 Keep bootstrap deterministic

To prevent environment drift:

1. Start from `./.env.example` each time.
2. Keep local overrides in your shell or editor profiles, not source files.
3. Re-run bootstrap checks after changing system tool versions.

## 5) Manual setup path (full control)

Use this when you need to inspect each command.

```bash
bun install
bun run automation:browsers:install
```

Create the environment file and install the database schema:

```bash
cp .env.example .env # Windows: copy .env.example .env
bun run db:generate
bun run db:push
```

## 6) Configure your first environment values

`PORT`, `DB_PATH`, provider keys, and locale settings are read from `.env`.

Start with the minimum:

```text
PORT=3000
DB_PATH=~/.bao/bao.db
NUXT_PUBLIC_API_BASE=/
NUXT_PUBLIC_WS_BASE=/
NUXT_PUBLIC_I18N_DEFAULT_LOCALE=en-US
NUXT_PUBLIC_I18N_FALLBACK_LOCALE=en-US
NUXT_PUBLIC_I18N_LOCALE_COOKIE_KEY=bao-locale
```

> **Important:** Do NOT set `NUXT_PUBLIC_I18N_SUPPORTED_LOCALES` in `.env`. Nuxt runtime config env override replaces the parsed array with a raw string, breaking the i18n plugin. The default is handled in `nuxt.config.ts`.

Locale resolution order is deterministic: locale cookie -> `Accept-Language` header (q-weighted) -> browser locale -> configured default locale.

Then add these when you are ready:

- `BAO_DISABLE_AUTH=true` for local dev if you want to skip API key gating.
- `LOCAL_MODEL_ENDPOINT` and `LOCAL_MODEL_NAME` for local model.
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `HUGGINGFACE_TOKEN` as needed.

For RPA/automation support, add:

```text
AUTOMATION_STDIO_BUFFER_LIMIT=2000
```

AI provider keys can also be set via the **Settings > AI Providers** section in the UI, where each provider has a configuration panel with test and save buttons.

Treat `.env.example` as the canonical base.

## 7) Start the stack

### 7.1 Recommended local mode (single command)

```bash
bun run dev
```
bun run dev executes `scripts/dev-stack.ts` to orchestrate server/client startup.

### 7.2 Split terminal mode

Terminal 1:

```bash
bun run dev:server
```

Terminal 2:

```bash
bun run dev:client
```

## 8) Verify first run from terminal

```bash
curl -fsS http://localhost:3000/api/health
curl -fsS http://localhost:3000/api/auth/status
curl -fsS http://localhost:3000/api/jobs?limit=1
```

Then open `http://localhost:3001` in your browser and confirm:

1. Home loads without runtime errors.
2. Settings page is reachable.
3. A basic API-backed feature returns data (jobs or resumes).
4. Dashboard quick actions reflect your current pipeline status (incomplete steps are prioritized automatically).
4. Browser dev tools show no hard errors on initial page load.

## 9) Complete first-user configuration in UI

1. Open **Settings**.
2. Configure your preferred AI mode:
   - local model endpoint (recommended first) or
   - provider API key.
3. Save settings.
4. Open **Resume** and create your first resume record.
5. Open **Jobs** and run a search to confirm ingestion path.
6. Open **AI Chat** and send one message.
7. Open **Automation → Job Apply** and test a non-sensitive sample flow.

## 10) Validate contract and docs

For the full validation sequence and script verification commands, see [README.md § Release Validation Workflow](../README.md#release-validation-workflow).

For `verify:pages`, target your BaoBuildBuddy preview instance explicitly if port `3001` is already used by another app:

```bash
PORT=4105 bun run --filter '@bao/client' preview
VERIFY_HOST=127.0.0.1 VERIFY_PORT=4105 bun run verify:pages
```

## 11) Troubleshooting quick path

- Server starts but UI cannot connect:
  - Check `NUXT_PUBLIC_API_BASE`/`NUXT_PUBLIC_WS_BASE` for your profile.
  - `bun run dev` writes these automatically when launching `scripts/dev-stack.ts`.
  - If `NUXT_PUBLIC_API_PROXY` is unset, Nuxt dev now proxies `/api` to `http://localhost:${PORT}` by default.
  - Recheck `NUXT_PUBLIC_WS_BASE`.
- Port conflict:
  - Change `PORT` in `.env`.
- Playwright browser missing:
  - Run `bun run automation:browsers:install` or rerun setup without `--skip-browser-install`.
- `curl` health checks fail:
  - Confirm server terminal shows `Listening on ...` and no startup errors.
- RPA automation unavailable:
  - Ensure Playwright Chromium is installed and rerun `bun run automation:browsers:install`.
- Locales missing or duplicated:
  - Verify `.env` locales match keys under `packages/client/locales`.

## 12) Optional Desktop installer path (Tauri)

If you need a desktop shell instead of a browser tab, use Tauri.

### 12.1 Add desktop prerequisites

- Rust toolchain (`rustup`) and `cargo` must be available.
- macOS/Linux: system C/C++ build tools for Rust crates.
- Windows: Visual C++ Build Tools installed with your `MSVC` workload.

Verify toolchain in your shell before packaging:

```bash
rustc --version
cargo --version
```

### 12.2 Start the desktop wrapper

From repo root:

```bash
bun run dev:desktop
```

This does three things:

1. Runs the full stack bootstrap logic in `packages/desktop/src-tauri/src/main.rs`.
2. Checks whether `PORT=3000` and `CLIENT_PORT=3001` (or configured overrides) are already responding.
3. Starts `bun run dev`/`scripts/dev-stack.ts` if required and opens the app window at `http://localhost:3001` by default.

Why Tauri is preferred for this repo:

1. Bun-native startup can stay the same for web and desktop.
2. Native runtime is thin; less install size than Electron.
3. No extra JavaScript runtime layer in the desktop wrapper.

If your org requires Electron-specific tooling, Electron remains viable but is intentionally non-default:

- Electron gives you Node process access inside the desktop shell, at the cost of a larger bundle and extra runtime maintenance.
- Tauri is the faster path for this repo because it reuses the same Bun runtime setup already defined by the web stack.

### 12.3 Build desktop installer

Canonical all-target desktop release refresh:

```bash
bun run release:refresh:all-os
```

This command refreshes macOS/Linux/Windows desktop artifacts and rewrites `packages/desktop/releases/sha256.txt`.

Repeatable cross-target rebuild:

```bash
bun run release:refresh:all-os:fast
```

Use this command for local rebuild cycles once the quality gates have already passed.

Single-target desktop build for the current host:

```bash
bun run build:desktop
```

For deterministic macOS DMG packaging in terminals using non-UTF8 locale defaults:

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bun run build:desktop
```

If the direct build exits with `failed to run bundle_dmg.sh` but reports a completed first bundling pass, run the release refresher fallback path so DMG creation is retried headless:

```bash
bash scripts/refresh-desktop-releases.sh --skip-quality-gates --skip-linux --skip-windows
```

That command runs macOS packaging only and applies the `bundle_dmg.sh --skip-jenkins` fallback before staging.

Raw output is generated under:

- `packages/desktop/src-tauri/target/release/bundle`

Canonical release artifacts are organized under:

- `packages/desktop/releases/macos`
- `packages/desktop/releases/linux`
- `packages/desktop/releases/windows`

Current installables are documented in `packages/desktop/releases/README.md`; `packages/desktop/releases/sha256.txt` contains matching checksums.

If `bun run build:desktop` fails with `failed to run 'cargo metadata'`, install Rust and reopen your shell:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Cross-target requirements from Tauri:
1. **Windows** (`x86_64-pc-windows-msvc`): `cargo-xwin`, Docker for NSIS setup fallback.
2. **Linux** (`aarch64-unknown-linux-gnu`): Docker with Ubuntu 24.04 for containerized bundling.

### 12.4 Tauri-specific environment knobs

- `BAO_STACK_HOST` (default `127.0.0.1`) to change health-check host.
- `BAO_STACK_BOOTSTRAP_COMMAND` (default `bun`) to replace the stack command.
- `CLIENT_PORT` (default `3001`) for readiness checks.
- `BAO_DISABLE_AUTH` passed through to the same process launch.
- `PORT` (default `3000`) used by the Bun backend start command.
- `HOST` inherited from `BAO_STACK_HOST` and used for local readiness probes.

## 13) Next step

Use `README.md` section 9 onward for deep architecture, schema, API routes, and endpoint-level troubleshooting.
