# Automation & RPA

BaoBuildBuddy uses RPA-Python for browser automation workflows through direct subprocess JSON I/O.

## Automation Verification Workflow

Run this sequence after automation/service changes:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Automation-specific checks:

```bash
bun run validate:no-try-catch
bun run validate:no-unsafe-casts
bun run validate:no-hardcoded-paths
bun run validate:locales
bun run validate:page-seo
bun run validate:i18n-ui
bun run validate:aria
bun run validate:ui-layout-tokens
bun run validate:ui
bun run audit:official-llms
```

`bun run validate:aria` enforces both control labels and modal dialog semantics (`aria-modal="true"` plus modal labeling).

Optional SSR route/content verification while app is running:

```bash
bun run verify:pages
```

Lint diagnostics are intentionally unmasked; warning/error detection behavior is preserved.

Expected validation outcomes:

- `bun run lint`: no lint warnings or errors.
- `bun run --filter '@bao/client' lint`: no warnings or errors.
- `bun run typecheck`: no TypeScript diagnostics.
- `bun run test`: all workspace test suites pass.
- `bun run build`: all packages build successfully.
- `CI=true bun run build:desktop`: desktop packaging build succeeds.
- `bun run release:refresh:all-os`: all desktop target artifacts are rebuilt and checksummed.
- `bun run release:refresh:all-os:fast`: desktop artifacts and `sha256.txt` are rebuilt without rerunning quality gates.
- `bun run audit:official-llms`: official Bun/Nuxt/Elysia `llms.txt` sources are reachable and include required guidance markers.
- `bun run verify:pages`: all required SSR routes and content checks pass against the selected preview target.

If a desktop run ends with `failed to run bundle_dmg.sh` after a successful first DMG pass, rerun the fallback refresh path:

```bash
bash scripts/refresh-desktop-releases.sh --skip-quality-gates --skip-linux --skip-windows
```

Automation UI contract:

- `/automation` page-level layout is tokenized through shared primitives and validated by `validate:ui-layout-tokens`.
- `/automation/job-apply`, `/automation/email`, `/automation/runs`, `/automation/runs/:id`, and `/automation/scraper` use the same scaffold/header/grid primitives; page-local width/grid literals are disallowed.
- Recommendation ordering/primary emphasis on the automation hub is derived from the global flow engine (`resolveFlowRecommendations`) rather than static card order.
- Dialogs in automation pages use the shared modal frame contract with deterministic ARIA semantics.

`bun run release:refresh:all-os` is designed for macOS hosts with Docker available and outbound network access for cross-target dependency bootstrap.
The script includes containerized Windows setup fallback and Linux AppImage fallback paths to keep release artifact generation deterministic.

Use `bun run release:refresh:all-os:fast` when you need only a deterministic rebuild after quality gates have already passed. This maps directly to `bash scripts/refresh-desktop-releases.sh --skip-quality-gates`.

If local port `3001` is already occupied, run page verification against an isolated preview port:

```bash
PORT=4105 bun run --filter '@bao/client' preview
VERIFY_HOST=127.0.0.1 VERIFY_PORT=4105 bun run verify:pages
```

## Why this approach

- Direct automation bridge with no API abstraction layer.
- Deterministic input/output contract: JSON over stdin/stdout.
- No HTTP automation proxy or long-running adapter process.

## Implementation

- Scraper scripts live in `packages/scraper/`:
  - `_protocol.py`
  - `apply_job_rpa.py`
  - `job_scraper_gamedev.py`
  - `job_scraper_grackle.py`
  - `job_scraper_workwithindies.py`
  - `job_scraper_remotegamejobs.py`
  - `job_scraper_gamesjobsdirect.py`
  - `job_scraper_pocketgamer.py`
  - `studio_scraper.py`
- Automation runner on the server lives in `packages/server/src/services/automation/rpa-runner.ts` and launches Python with `Bun.spawn`.
- Job application orchestration is implemented in `packages/server/src/services/automation/application-automation-service.ts`.
- Job board scraper execution is implemented in `packages/server/src/services/scraper-service.ts` and sends typed stdin payload to scripts (`{ sourceUrl?: string }`), so runtime source endpoints are settings-driven instead of script hardcoded.

```mermaid
flowchart LR
  UI["Nuxt /automation pages"] --> JobAPI["POST /api/automation/job-apply"]
  UI --> ScheduleAPI["POST /api/automation/job-apply/schedule"]
  UI --> EmailAPI["POST /api/automation/email-response"]
  UI --> StatsAPI["GET /api/stats/dashboard"]
  JobAPI --> Service["application-automation-service.ts"]
  ScheduleAPI --> Service
  EmailAPI --> Service
  StatsAPI --> DashboardPipeline["Dashboard work-pipeline status"]
  StatsAPI --> AutomationPipeline["Automation Hub work-pipeline status"]
  Service --> PersistStart["automation_runs: pending/running"]
  Service --> Runner["rpa-runner.ts (Bun.spawn)"]
  Runner --> Script["packages/scraper/apply_job_rpa.py"]
  Script --> Runner
  Service --> EmailGen["AIService.generate(emailResponsePrompt)"]
  EmailGen --> PersistDone["automation_runs: success/error + output"]
  Runner --> PersistDone
  PersistDone --> WS["WS /api/ws/automation progress events"]
  PersistDone --> Screens["GET /api/automation/screenshots/:runId/:index"]
```

### RPA input contract (`apply_job_rpa.py`)

```json
{
  "jobUrl": "https://...",
  "resume": {
    "personalInfo": {
      "fullName": "...",
      "email": "...",
      "phone": "..."
    },
    "experience": [],
    "education": [],
    "skills": []
  },
  "coverLetter": {
    "company": "Acme",
    "position": "Senior Game Systems Engineer",
    "content": {}
  },
  "customAnswers": {
    "field_id": "value"
  }
}
```

### Job board scraper input contract

```json
{
  "sourceUrl": "https://example.com/jobs"
}
```

`sourceUrl` is optional for scraper scripts and is resolved from `settings.automationSettings.jobProviders.gamingPortals[].fallbackUrl` by the provider layer.

### RPA output contract

```json
{
  "success": true,
  "error": null,
  "screenshots": [
    "step-01.png",
    "step-02.png"
  ],
  "artifacts": [
    {
      "id": "shot_1",
      "kind": "screenshot",
      "path": "step-01.png"
    }
  ],
  "steps": [
    {
      "action": "navigate",
      "status": "ok",
      "message": "Loaded page"
    }
  ]
}
```

## API routes

- `POST /api/automation/job-apply` — starts a job-application automation run.
- `POST /api/automation/job-apply/schedule` — schedules a future job-application automation run.
- `POST /api/automation/email-response` — generates an AI-assisted email response and persists it as a run.
- `POST /api/automation/job-apply` response contract:
  - `200`: `RpaRunExecutionEnvelope` with status `running`
  - `POST /api/automation/job-apply/schedule` `200`: `RpaRunExecutionEnvelope` with status `pending` (`input.schedule.runAt`)
  - `POST /api/automation/email-response` `200`: `{"runId": string, "status": "success", "reply": string, "provider": string, "model": string}`
  - `400`: route-level validation rejection for malformed request envelopes
  - `404`: missing dependency (`resume` / `cover-letter`)
  - `409`: concurrency limit hit
  - `422`: schema/validation failure
  - `500`: unexpected execution failure
  - Error responses are deterministic JSON envelopes in the form `{"error":{"code","message","details?"}}`.
  - Error handling follows Elysia centralized `onError` semantics; client callers branch on Eden `{ data, error }` instead of `try/catch`.
- `GET /api/automation/runs` — list recent runs with optional `type` and `status`.
- `GET /api/automation/runs/:id` — fetch run detail payload.
- `GET /api/automation/screenshots/:runId/:index` — read stored screenshot bytes.
- `WS /api/ws/automation` — subscribe/unsubscribe to live run events (`type: "subscribe" | "unsubscribe", runId`) with typed `RpaRunEvent` payloads.

### Deterministic run status semantics

- `pending`: queued for scheduled execution.
- `running`: actively executing.
- `success`: workflow completed successfully.
- `error`: workflow failed.

## Operation

1. Routes insert a row in `automation_runs` and return a typed run envelope (`RpaRunExecutionEnvelope`).
2. Immediate job-apply runs execute `apply_job_rpa.py` with typed JSON input; scheduled runs queue in-memory and recover on process boot.
3. Email-response runs call `AIService.generate(emailResponsePrompt(...))` and persist deterministic output (`reply`, `provider`, `model`).
4. Output is written back into the same run row (`success`, `error`, `screenshots`, `output`).
5. Screenshots are normalized to safe filename tokens and stored under the managed run directory.
6. Settings-driven automation options (`headless`, `defaultTimeout`, `autoSaveScreenshots`, `defaultBrowser`) are validated, sanitized, and passed to the runner. Job-ingestion provider runtime controls are sourced from `settings.automationSettings.jobProviders`.
7. Completed runs trigger a retention pass (`screenshotRetention`, capped 1–30 days) that deletes stale screenshot directories from disk.
8. Temporary RPA working directories are removed after each script execution.
9. UI pages under `/automation` track history via `useAutomationRunStream`, subscribe to `/api/ws/automation` for run updates, and request screenshot bytes from `GET /api/automation/screenshots/:runId/:index`.

### Job provider runtime contract

`settings.automationSettings.jobProviders` is the single runtime source for ingestion providers (Greenhouse, Lever, company ATS boards, Hitmarker, and scraper portals). The payload must include:

- timeout/limits: `providerTimeoutMs`, `companyBoardResultLimit`, `gamingBoardResultLimit`
- fallback labels: `unknownLocationLabel`, `unknownCompanyLabel`
- Hitmarker config: `hitmarkerApiBaseUrl`, `hitmarkerDefaultQuery`, `hitmarkerDefaultLocation`
- Greenhouse config: `greenhouseApiBaseUrl`, `greenhouseMaxPages`, `greenhouseBoards[]`
- Lever config: `leverApiBaseUrl`, `leverMaxPages`, `leverCompanies[]`
- Generic ATS templates: `companyBoardApiTemplates`
- Company board sources: `companyBoards[]`
- Scraper portals: `gamingPortals[]`

Use `PUT /api/settings` with `automationSettings.jobProviders` to change any runtime source without code changes or redeploys. The service does not auto-fill provider runtime defaults; a complete valid `jobProviders` object must be present before ingestion runs.
`automationSettings` patch payloads are merged with persisted settings and revalidated against the full schema before commit, so invalid or incomplete updates are rejected with a deterministic `422` response.

## UI dashboard accessibility and wiring checks

Automation pages under `/automation` must pass the same UI wiring/accessibility gate as the rest of the client:

```bash
bun run validate:no-try-catch
bun run validate:page-seo
bun run validate:i18n-ui
bun run validate:aria
bun run validate:ui-layout-tokens
bun run validate:ui
bun run --filter '@bao/client' lint
```

Required behavior:

1. Interactive elements triggered by click must be keyboard-operable (`Enter`/`Space`) and focusable.
2. Form controls must have programmatic labels (`label` association or ARIA label).
3. Icon-only controls and anchor-only icon links must expose accessible names.
4. Run actions (`start`, `retry`, history navigation, screenshot browsing) must remain reachable without pointer input.

```mermaid
flowchart LR
  UI["Automation Vue pages"] --> ValidateUI["bun run validate:page-seo + validate:i18n-ui + validate:aria + validate:ui-layout-tokens + validate:ui"]
  ValidateUI --> ColorState{"WCAG contrast + token checks pass?"}
  ColorState -->|No| ColorFix["Fix semantic classes or theme tokens"]
  ColorFix --> ValidateUI
  ColorState -->|Yes| A11yLint["Client lint (vuejs-accessibility)"]
  A11yLint --> A11yState{"A11y errors = 0?"}
  A11yState -->|No| A11yFix["Fix labels, keyboard behavior, control semantics"]
  A11yFix --> A11yLint
  A11yState -->|Yes| QA["Keyboard + flow QA"]
```

## Verification commands

Run these before merging automation changes:

```bash
bun run format:check
bun run validate:no-try-catch
bun run validate:page-seo
bun run validate:i18n-ui
bun run validate:aria
bun run validate:ui-layout-tokens
bun run typecheck
bun run lint
bun run test
```

`bun run typecheck` generates `packages/server/dist-types` first so client-side Nuxt typechecking validates against the typed API contract surface.
`bun run lint` includes `validate:no-try-catch`, `validate:page-seo`, and `validate:i18n-ui`, which enforce the no-`try/catch` rule, localized core-page metadata, and i18n-safe UI copy standards in source files.

### Integration coverage

Automation functionality is integrated across:

1. API routes: `/api/automation/*`
2. Service orchestration: `application-automation-service.ts`
3. Python runner: `rpa-runner.ts` via `Bun.spawn`
4. Dashboard stats contract: `/api/stats/dashboard` feeding shared `WorkPipeline` state on `/` and `/automation`
5. UI pages: `/automation`, `/automation/job-apply`, `/automation/email`, `/automation/runs`, `/automation/runs/:id`
6. Real-time progress: `WS /api/ws/automation`
7. Pipeline gamification awards: `usePipelineGamification` for jobs search, scraper runs, and resume customization milestones

Route-level regression coverage exists in `packages/server/src/routes/automation.test.ts`.

## Environment

### Required dependencies

| Dependency | Purpose | Install |
|-----------|---------|---------|
| Python 3.10+ | RPA script runtime | System package manager |
| `playwright` (pip) | Headless browser automation | `pip install playwright && playwright install chromium` |
| Rust + Cargo | Desktop installer builds (Tauri) | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |

Playwright bundles its own Chromium — no separate Chrome/PHP install needed.

### Environment variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PYTHON_BINARY` | Path to Python binary (use venv path) | `python3` (Unix) / `python` (Windows) |
| `AUTOMATION_STDIO_BUFFER_LIMIT` | Max stdout/stderr lines from scraper scripts | `200` (increase to `2000` for large outputs) |
| `AUTOMATION_SCRIPT_TIMEOUT_MS` | Max execution time per script | `30000` |

### Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r packages/scraper/requirements.txt
playwright install chromium
```

Set `PYTHON_BINARY` in `.env` to the venv Python:

```bash
PYTHON_BINARY=/path/to/project/.venv/bin/python3
AUTOMATION_STDIO_BUFFER_LIMIT=2000
```

### Scraper status (Feb 2026)

| Script | Source | Status | Notes |
|--------|--------|--------|-------|
| `studio_scraper.py` | Curated data | Working (62 studios) | Pure Python, no browser |
| `job_scraper_grackle.py` | GrackleHQ | Working (30+ jobs) | Playwright `div.joblisting` selectors |
| `job_scraper_workwithindies.py` | WorkWithIndies | Working (60+ jobs) | Playwright `a.job-card` + regex |
| `job_scraper_remotegamejobs.py` | RemoteGameJobs | Working (41+ jobs) | Playwright `.job-box` containers |
| `job_scraper_gamedev.py` | GameDev.net | Defunct (404) | Site jobs board offline; graceful empty return |
| `job_scraper_gamesjobsdirect.py` | GamesJobsDirect | Working | Playwright `a[href*='/job/']` links |
| `job_scraper_pocketgamer.py` | PocketGamer | Working | Playwright `article` containers |
| `apply_job_rpa.py` | Job application | Working | Full Playwright browser automation |

All scrapers use Playwright's native DOM query API (`query_selector_all`, `inner_text`, `evaluate`) for reliable headless operation.
