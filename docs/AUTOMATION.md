# Automation & RPA

BaoBuildBuddy uses RPA-Python for browser automation workflows through direct subprocess JSON I/O.

## Why this approach

- Direct automation bridge with no API abstraction layer.
- Deterministic input/output contract: JSON over stdin/stdout.
- No HTTP automation proxy or long-running adapter process.

## Implementation

- Scraper scripts live in `packages/scraper/`:
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

### RPA output contract

```json
{
  "success": true,
  "error": null,
  "screenshots": [
    "step-01.png",
    "step-02.png"
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
- `POST /api/automation/job-apply` response contract:
  - `200`: `{"runId": string, "status": "running"}`
  - `400`: route-level validation rejection for malformed request envelopes (legacy path compatibility)
  - `404`: missing dependency (`resume` / `cover-letter`)
  - `409`: concurrency limit hit
  - `422`: schema/validation failure
  - `500`: unexpected execution failure
  - Error responses are deterministic JSON envelopes in the form `{"error": string}` on handled routes.
- `GET /api/automation/runs` — list recent runs with optional `type` and `status`.
- `GET /api/automation/runs/:id` — fetch run detail payload.
- `GET /api/automation/screenshots/:runId/:index` — read stored screenshot bytes.
- `WS /api/ws/automation` — subscribe/unsubscribe to live run progress events (`type: "subscribe" | "unsubscribe", runId`).

### Deterministic run status semantics

- `running`: actively executing.
- `success`: workflow completed successfully.
- `error`: workflow failed.
- `pending`: transient bootstrap state only.

## Operation

1. Route inserts a row in `automation_runs` and returns `{ runId, status: "running" }`.
2. Background job executes `apply_job_rpa.py` with typed JSON input.
3. Output is written back into the same run row (`success`, `error`, `screenshots`, `output`).
4. Screenshots are normalized to safe filename tokens and stored under the managed run directory.
5. Settings-driven automation options (`headless`, `defaultTimeout`, `autoSaveScreenshots`, `defaultBrowser`) are validated, sanitized, and passed to the runner. Job-ingestion provider runtime controls are sourced from `settings.automationSettings.jobProviders`.
6. Completed runs trigger a retention pass (`screenshotRetention`, capped 1–30 days) that deletes stale screenshot directories from disk.
7. Temporary RPA working directories are removed after each script execution.
8. UI pages under `/automation` track history, subscribe to `/api/ws/automation` for run updates, and request screenshot bytes from `GET /api/automation/screenshots/:runId/:index`.

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

## Environment

- Python dependency: `rpa` (TagUI backend)
- Install in the Python environment used by Bun:

```bash
pip install rpa
```

Automation requires `python3` on Unix and `python` on Windows.
