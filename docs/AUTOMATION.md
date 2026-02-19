# Automation & RPA

BaoBuildBuddy uses RPA-Python for browser automation workflows through direct subprocess JSON I/O.

## Why this approach

- Direct automation bridge with no API abstraction layer.
- Deterministic input/output contract: JSON over stdin/stdout.
- No HTTP automation proxy or long-running adapter process.

## Implementation

- Scraper scripts live in `packages/scraper/`:
  - `job_scraper_gamedev.py`
  - `studio_scraper.py`
  - `apply_job_rpa.py`
- Automation runner on the server lives in `packages/server/src/services/automation/rpa-runner.ts` and launches Python with `Bun.spawn`.
- Job application orchestration is implemented in `packages/server/src/services/automation/application-automation-service.ts`.

### RPA input contract (`apply_job_rpa.py`)

```json
{
  "jobUrl": "https://...",
  "resume": {
    "fullName": "...",
    "email": "...",
    "...": "..."
  },
  "coverLetter": {
    "company": "Acme",
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
  "screenshots": ["/tmp/.../step1.png"],
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
- `GET /api/automation/runs` — list recent runs with optional `type` and `status`.
- `GET /api/automation/runs/:id` — fetch run detail payload.

## Operation

1. Route inserts a row in `automation_runs` and returns `{ runId, status: "running" }`.
2. Background job executes `apply_job_rpa.py` with typed JSON input.
3. Output is written back into the same run row (`success`, `error`, `screenshots`, `output`).
4. UI pages under `/automation` track and present history plus screenshots.

## Environment

- Python dependency: `rpa` (TagUI backend)
- Install in the Python environment used by Bun:

```bash
pip install rpa
```

Automation requires `python3` on Unix and `python` on Windows.
