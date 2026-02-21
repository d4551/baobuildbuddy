# BaoBuildBuddy First-Time Setup Guide

```text
 .--------------------------.
 |      CAREER QUEST MODE    |
 |         PRESS START       |
 '--------------------------'
```

If you need deeper architecture and runbook details, see the full runbook: [README.md](../README.md).

Use this guide if this is your first time running BaoBuildBuddy locally.
Think of it as the tutorial level: follow each checkpoint in order before unlocking the rest of the project.

## 1) Understand what is being started

BaoBuildBuddy is a monorepo with two runtime services:

1. API server in `packages/server`
2. Nuxt SSR app in `packages/client`

The standard one-command workflow starts both at once with:

```bash
bun run dev
```

This is the recommended path for first-time setup.

## 2) Install required tools

Install these before running setup:

```text
Required:
- bun 1.3.x
- Git
- Python 3.10+
- Chrome or Chromium

Optional but recommended:
- curl
- jq
```

Verify each tool is on `PATH`:

```bash
bun --version
git --version
python3 --version
google-chrome --version
```

On Windows use `python --version` and check Chrome with:

```powershell
(Get-Command python).Source
(Get-Item "$env:ProgramFiles\Google\Chrome\Application\chrome.exe").FullName
```

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
2. Installs workspace dependencies.
3. Creates `.venv` and installs Python scraper dependencies.
4. Creates `.env` from `.env.example`.
5. Generates and pushes DB schema.
6. Runs `typecheck`, `lint`, and `test` unless skipped.

### 4.3 Script flags

| Command | Meaning |
|---------|---------|
| `--skip-checks` (Bash) / `-SkipChecks` (PowerShell) | Skip validation checks after setup |
| `--skip-python` (Bash) / `-SkipPython` (PowerShell) | Skip Python venv and pip install |
| `--help` (Bash) / `-Help` (PowerShell) | Show script usage |

### 4.4 If setup stops with a warning or error

1. Read the first `[FAIL]` block in the script output.
2. Re-run the same setup command.
3. Run the failing command directly for details.

Common fixes:

- Update bun to the latest 1.3.x.
- Install Python 3.10+ and ensure it is in `PATH`.
- Install Chrome from the official package for your OS.

## 5) Manual setup path (full control)

Use this when you need to inspect each command.

```bash
bun install
```

```bash
python3 -m venv .venv
source .venv/bin/activate # Windows: .venv\Scripts\Activate.ps1
python -m pip install -r packages/scraper/requirements.txt
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
NUXT_PUBLIC_I18N_SUPPORTED_LOCALES=en-US,es-ES,fr-FR,ja-JP
NUXT_PUBLIC_I18N_LOCALE_COOKIE_KEY=bao-locale
```

Then add these when you are ready:

- `BAO_DISABLE_AUTH=true` for local dev if you want to skip API key gating.
- `LOCAL_MODEL_ENDPOINT` and `LOCAL_MODEL_NAME` for local model.
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `CLAUDE_API_KEY`, `HUGGINGFACE_TOKEN` as needed.

## 7) Start the stack

### 7.1 Recommended local mode (single command)

```bash
bun run dev
```

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

If this is your very first time and you want full confidence:

```bash
bun run format:check
bun run validate:no-try-catch
bun run validate:ui
bun run typecheck
bun run lint
bun run test
```

This validates repository health and the public/client contract generation path.

## 11) Troubleshooting quick path

- Server starts but UI cannot connect:
  - Check `.env` has `NUXT_PUBLIC_API_BASE=/` for `bun run dev`.
  - Recheck `NUXT_PUBLIC_WS_BASE`.
- Port conflict:
  - Change `PORT` in `.env`.
- Python missing:
  - Re-run setup with `--skip-python` only if you want to defer automation.
- `curl` health checks fail:
  - Confirm server terminal shows `Listening on ...` and no startup errors.
- RPA automation unavailable:
  - Ensure Chrome is installed and Python virtual env dependencies are installed.

## 12) Optional Desktop installer path (Tauri)

If you need a desktop shell instead of a browser tab, use Tauri.

### 12.1 Add desktop prerequisites

- Rust toolchain (`rustup`) and `cargo` must be available.
- macOS/Linux: system C/C++ build tools for Rust crates.
- Windows: Visual C++ Build Tools installed with your `MSVC` workload.

### 12.2 Start the desktop wrapper

From repo root:

```bash
bun run dev:desktop
```

This does three things:

1. Runs the full stack bootstrap logic in `packages/desktop/src-tauri/src/main.rs`.
2. Checks whether `PORT=3000` and `CLIENT_PORT=3001` are already responding.
3. Starts `bun run dev` if required and opens the app window at `http://127.0.0.1:3001`.

### 12.3 Build desktop installer

```bash
bun run build:desktop
```

Output goes to:

- `packages/desktop/src-tauri/target/release/bundle`

### 12.4 Tauri-specific environment knobs

- `BAO_STACK_HOST` (default `127.0.0.1`) to change health-check host.
- `BAO_STACK_BOOTSTRAP_COMMAND` (default `bun`) to replace the stack command.
- `CLIENT_PORT` (default `3001`) for readiness checks.
- `BAO_DISABLE_AUTH` passed through to the same process launch.
- `PORT` (default `3000`) used by the Bun backend start command.

## 13) Next step

Use `README.md` section 9 onward for deep architecture, schema, API routes, and endpoint-level troubleshooting.
