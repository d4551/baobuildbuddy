```text
    ____              ____        _ _     _ ____            _     _
   | __ )  __ _  ___ | __ ) _   _(_) | __| | __ ) _   _  __| | __| |_   _
   |  _ \ / _` |/ _ \|  _ \| | | | | |/ _` |  _ \| | | |/ _` |/ _` | | | |
   | |_) | (_| | (_) | |_) | |_| | | | (_| | |_) | |_| | (_| | (_| | |_| |
   |____/ \__,_|\___/|____/ \__,_|_|_|\__,_|____/ \__,_|\__,_|\__,_|\__, |
                                                                      |___/
                     v1.0  ~  Local Operations Manual
```

# BaoBuildBuddy v1.0 Local Setup Guide

```text
                    ___________
                   |           |
                   | NEW GAME  |     ~~~ QUEST LOG ~~~
                   | CONTINUE  |
                   | OPTIONS   |     1) Prepare environment
                   |___________|     2) Configure services
                                     3) Start server + client
         .-----.                     4) Verify contracts
        / /   \ \                    5) Run automation paths
       | | O O | |
        \ \   / /        "It's dangerous to go alone!
         '-----'          Take this setup guide."
```

BaoBuildBuddy is a full-stack, Bun-first monorepo for building game-industry career automation workflows. It aggregates job listings from studios, helps build resumes and cover letters, runs AI-powered mock interviews, automates job applications via browser RPA, and tracks your progress with a gamification system.

- `packages/server` -- Bun + Elysia API, Drizzle ORM, WebSocket endpoints, process orchestration
- `packages/client` -- Nuxt 3 (SSR-first), Tailwind CSS v4, daisyUI v5
- `packages/shared` -- shared types, contracts, constants, schemas, validation utilities
- `packages/scraper` -- Python RPA scripts executed via Bun native subprocess I/O

## 1) Scope of this document

This is the canonical local setup runbook for BaoBuildBuddy v1.0. It covers:

- Local install and startup for all four packages
- Environment configuration via `.env` and source-of-truth config files
- Data flow between UI, API, DB, AI providers, and RPA
- How automation and AI requests are validated, executed, and persisted
- The job provider registry and how studio aggregation works
- Service layer architecture including skill extraction, data export, and CV questionnaires
- Troubleshooting and verification steps

## 2) Architecture overview

```text
          _____
         |     |
         | GLa |    "The cake is a lie."
         |  D  |     But the architecture diagram is real.
         | 0S  |
         |_____|

    Browser ──> Nuxt SSR ──> Elysia API ──> SQLite
       |                        |    |
       |── WebSocket ──> /ws/chat    |── AI providers (5 adapters)
       |── WebSocket ──> /ws/interview   |── RPA subprocess (Bun.spawn)
                                    |
                          Job provider registry
                          (Greenhouse, Lever, company boards)
```

```mermaid
flowchart TD
  Browser["Browser / Nuxt SSR"] -->|render + initial payload| Client["packages/client"]
  Client -->|useFetch / $fetch| API_PREFIX["/api prefix (Nuxt config runtimeBase)"]
  API_PREFIX --> Server["packages/server (Elysia)"]

  Browser -->|WebSocket| ChatWS["/api/ws/chat"]
  Browser -->|WebSocket| InterviewWS["/api/ws/interview"]
  Server -->|auth + error envelope| AuthMiddleware["auth middleware"]
  Server -->|contracts| Shared["packages/shared"]

  Server -->|register routes| RouteGroup["route modules under packages/server/src/routes/index.ts"]
  RouteGroup --> AuthRoutes["authRoutes"]
  RouteGroup --> UserRoutes["userRoutes"]
  RouteGroup --> SettingsRoutes["settingsRoutes"]
  RouteGroup --> JobsRoutes["jobsRoutes"]
  RouteGroup --> ResumeRoutes["resumeRoutes"]
  RouteGroup --> CoverLetterRoutes["coverLetterRoutes"]
  RouteGroup --> PortfolioRoutes["portfolioRoutes"]
  RouteGroup --> InterviewRoutes["interviewRoutes"]
  RouteGroup --> StudioRoutes["studioRoutes"]
  RouteGroup --> ScraperRoutes["scraperRoutes"]
  RouteGroup --> AiRoutes["aiRoutes"]
  RouteGroup --> GamificationRoutes["gamificationRoutes"]
  RouteGroup --> SkillMappingRoutes["skillMappingRoutes"]
  RouteGroup --> SearchRoutes["searchRoutes"]
  RouteGroup --> StatsRoutes["statsRoutes"]
  RouteGroup --> AutomationRoutes["automationRoutes"]

  AuthRoutes --> AuthSvc["Auth service + authGuard policy"]
  JobsRoutes --> JobsSvc["jobs service"]
  JobsSvc --> JobAggregator["job-aggregator.ts"]
  JobAggregator --> ProviderRegistry["provider-registry.ts"]
  ProviderRegistry --> Greenhouse["greenhouse.ts"]
  ProviderRegistry --> Lever["lever.ts"]
  ProviderRegistry --> CompanyBoards["company-board.ts"]
  ProviderRegistry --> GamingProviders["gaming-providers.ts"]
  JobsSvc --> MatchingSvc["matching-service.ts"]
  JobsSvc --> DedupSvc["deduplication.ts"]

  ResumeRoutes --> ResumeSvc["resume service"]
  CoverLetterRoutes --> CoverLetterSvc["cover-letter service"]
  PortfolioRoutes --> PortfolioSvc["portfolio service"]
  InterviewRoutes --> InterviewSvc["interview service"]
  StudioRoutes --> StudioSvc["studio service"]
  ScraperRoutes --> ScraperSvc["scraper service"]
  AiRoutes --> AiSvc["AI service + context manager"]
  GamificationRoutes --> GamificationSvc["gamification service"]
  SkillMappingRoutes --> SkillMappingSvc["skill mapping service"]
  SkillMappingSvc --> SkillExtractor["skill-extractor.ts"]
  SearchRoutes --> SearchSvc["search service"]
  StatsRoutes --> StatsSvc["statistics service"]
  SettingsRoutes --> SettingsSvc["settings service"]
  AutomationRoutes --> AutoSvc["application-automation-service.ts"]
  AutoSvc --> RpaRunner["rpa-runner.ts (Bun.spawn)"]

  RpaRunner -->|JSON via stdin/stdout| Scraper["packages/scraper/*.py"]
  Scraper -->|result JSON| RpaRunner
  RpaRunner --> AutomationSchema["automation_runs persistence"]
  AutomationSchema --> DB[(SQLite via bun:sqlite)]

  JobsSvc --> DB
  ResumeSvc --> DB
  CoverLetterSvc --> DB
  PortfolioSvc --> DB
  InterviewSvc --> DB
  StudioSvc --> DB
  ScraperSvc --> DB
  SearchSvc --> DB
  StatsSvc --> DB

  AiSvc --> AIBackends["provider-interface.ts"]
  AIBackends --> LocalProvider["local-provider.ts"]
  AIBackends --> OpenAIProvider["openai-provider.ts"]
  AIBackends --> GeminiProvider["gemini-provider.ts"]
  AIBackends --> ClaudeProvider["claude-provider.ts"]
  AIBackends --> HuggingFaceProvider["huggingface-provider.ts"]
  LocalProvider --> LocalModel["LOCAL_MODEL_ENDPOINT"]
  OpenAIProvider --> OpenAIAPI["OpenAI API"]
  GeminiProvider --> GeminiAPI["Gemini API"]
  ClaudeProvider --> ClaudeAPI["Anthropic API"]
  HuggingFaceProvider --> HFAPI["HuggingFace Inference API"]
```

## 3) Implementation principles

Each Elysia route module owns its service directly -- routes call services, services call the database or external providers. Typed contracts in `packages/shared` are the source of truth for request/response shapes across client and server. Python automation runs in a Bun subprocess with JSON over stdin/stdout. All runtime values (ports, keys, endpoints) come from environment configuration.

## 4) Python RPA subsystem

```text
         ___
        |   |      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        | ! |      CAUTION: Entering RPA territory
        |___|
        /   \      Automation runs are persisted to
       / BAO \     automation_runs in SQLite for full
      /_______\    audit trail and replay capability.
                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
       "Do a barrel roll!" -- but only after
       verifying your Python venv is active.
```

Automation execution is invoked from `automationRoutes` and routed through `application-automation-service.ts` --> `rpa-runner.ts`.

### 4.1 Execution model

1. API route receives typed payload for a job apply request.
2. `application-automation-service.ts` resolves required domain entities from DB (resume and optional cover letter).
3. Service writes an `automation_runs` record with:
   - unique run ID
   - type (`job_apply`)
   - status (`pending` / `running` / `success` / `error`)
   - input/output snapshots and metadata
4. `rpa-runner.ts` starts Python with `Bun.spawn`.
5. Request payload is sent as JSON on `stdin`.
6. Python script executes RPA operations (navigation, field population, clicks, screenshot).
7. Script prints structured JSON result to `stdout`.
8. `rpa-runner.ts` parses and persists result, then updates the run status.

### 4.2 Required script contract

Python script must read JSON from `stdin`, produce JSON on `stdout`, and exit non-zero on hard failure.

**Input payload:**

```json
{
  "jobUrl": "https://example.com/job/application",
  "resume": {
    "fullName": "Player One",
    "email": "player@example.com",
    "phone": "+1 555 0100",
    "location": "Remote",
    "linkedin": "https://linkedin.com/in/player",
    "github": "https://github.com/player",
    "portfolio": "https://portfolio.example.com",
    "education": ["..."],
    "experience": ["..."]
  },
  "coverLetter": "This is a targeted application message.",
  "customAnswers": {
    "q_salary": "120000",
    "q_relocation": "No"
  }
}
```

**Success response:**

```json
{
  "success": true,
  "error": null,
  "screenshots": ["/tmp/job-apply-step-01.png", "/tmp/job-apply-step-02.png"],
  "steps": [
    { "action": "navigate", "status": "ok" },
    { "action": "fill_full_name", "status": "ok" },
    { "action": "submit", "status": "ok" }
  ]
}
```

**Failure response:**

```json
{
  "success": false,
  "error": "No matching submit button",
  "screenshots": [],
  "steps": [{ "action": "click_submit", "status": "failed" }]
}
```

### 4.3 Python API used by scripts

The Python entry points use these RPA primitives:

- `r.init(turbo_mode=True)`
- `r.url(jobUrl)`
- `r.type(selector, text)`
- `r.click(selector)`
- `r.snap("page", outputPath)`
- `r.close()`

Three scripts exist in `packages/scraper/`:

| Script | Purpose |
|--------|---------|
| `apply_job_rpa.py` | Automates job application form submission |
| `job_scraper_gamedev.py` | Scrapes game industry job listings |
| `studio_scraper.py` | Scrapes studio directory data |

### 4.4 Bun subprocess contract

`rpa-runner.ts` calls `Bun.spawn` with:

- `stdin: "pipe"`
- `stdout: "pipe"`
- `stderr: "pipe"`

It passes payload to stdin, reads both stdout/stderr, and fails with structured context on non-zero exit.

## 5) Job provider registry

```text
       .-----------.
      /  JOBS BOARD  \      "War. War never changes."
     |  +-----------+ |      But job boards do. The provider
     |  | Greenhouse| |      registry abstracts the differences
     |  | Lever     | |      so the aggregator doesn't have to
     |  | Company   | |      care which ATS you're scraping.
     |  +-----------+ |
      \             /
       '-----------'
```

The job aggregation system lives under `packages/server/src/services/jobs/` and consists of:

| File | Responsibility |
|------|---------------|
| `job-aggregator.ts` | Orchestrates fetching across all registered providers |
| `matching-service.ts` | Scores job listings against user profile and skills |
| `deduplication.ts` | Deduplicates listings that appear on multiple boards |
| `providers/provider-interface.ts` | Common interface all providers implement |
| `providers/provider-registry.ts` | Registry for adding/removing providers at runtime |
| `providers/greenhouse.ts` | Greenhouse ATS integration |
| `providers/lever.ts` | Lever ATS integration |
| `providers/company-board.ts` | Direct company career page scraping |
| `providers/company-boards-config.ts` | Configuration for known company board URLs |
| `providers/gaming-providers.ts` | Game-industry-specific board aggregation |

The aggregator calls each registered provider, deduplicates results, runs matching against the user's resume/skills profile, and persists to the `jobs` schema in SQLite.

## 6) AI integration and provider chain

```text
                    .-------------.
                   /    CHOOSE     \
                  /    YOUR CLASS   \
                 /                   \
                |  [1] Local Mage     |
                |  [2] OpenAI Knight  |
                |  [3] Gemini Ranger  |      "Would you kindly"
                |  [4] Claude Healer  |       configure at least
                |  [5] HF Summoner   |       one provider?
                 \                   /
                  \_________________/
```

The AI subsystem lives under `packages/server/src/services/ai/` with these files:

| File | Responsibility |
|------|---------------|
| `ai-service.ts` | Main service, routes requests to the active provider |
| `provider-interface.ts` | Common interface all providers implement |
| `local-provider.ts` | Connects to a local inference server (Ollama, LM Studio, etc.) |
| `openai-provider.ts` | OpenAI API adapter |
| `gemini-provider.ts` | Google Gemini API adapter |
| `claude-provider.ts` | Anthropic Claude API adapter |
| `huggingface-provider.ts` | HuggingFace Inference API adapter |
| `context-manager.ts` | Manages conversation history and context windows |
| `prompts.ts` | Prompt templates for resume review, interview prep, cover letters |

### 6.1 Environment keys

- `LOCAL_MODEL_ENDPOINT` -- local inference server URL
- `LOCAL_MODEL_NAME` -- model identifier for local provider
- `OPENAI_API_KEY` -- optional cloud OpenAI
- `GEMINI_API_KEY` -- optional cloud Gemini
- `CLAUDE_API_KEY` -- optional cloud Anthropic
- `HUGGINGFACE_TOKEN` -- optional cloud HuggingFace

### 6.2 Provider selection

1. Local provider is used when `LOCAL_MODEL_ENDPOINT` and `LOCAL_MODEL_NAME` are set.
2. Cloud adapters are selected based on which API keys are configured.
3. The AI context manager handles conversation state and prompt construction.

All AI calls are server-owned. The client communicates through API routes and WebSocket endpoints, never directly to AI providers.

## 7) Additional server services

```text
     ____________________________
    |     SERVICE INVENTORY      |
    |____________________________|
    |                            |
    | "I used to be an          |
    |  adventurer like you,     |
    |  then I took a service    |
    |  layer to the knee."      |
    |____________________________|
```

Beyond the route-specific services, the server includes:

| Service | File | Purpose |
|---------|------|---------|
| CV Questionnaire | `cv-questionnaire-service.ts` | Guided questionnaire flow for building resume data |
| Data Service | `data-service.ts` | Shared data access patterns across services |
| Export Service | `export-service.ts` | Export resumes, portfolios, and cover letters to PDF/JSON |
| Skill Extractor | `skill-extractor.ts` | Extracts and normalizes skills from job listings and resumes |
| Skill Mapping | `skill-mapping-service.ts` | Maps user skills to job requirements for match scoring |

## 8) Install and local setup

```text
              ,    ,
             /(    )\        LEVEL 1: PREREQUISITES
            /  ||||  \
           /   ||||   \      You need these items in your
          /    ||||    \     inventory before proceeding.
         / ,   ||||   , \
        /  |   ||||   |  \   Missing items = Game Over.
       /___|___||||___|___\
```

### 8.1 Prerequisites

| Required              | Version      | Purpose                        |
|-----------------------|-------------|-------------------------------|
| Bun                   | 1.3.x       | Runtime, package manager, test runner |
| Git                   | any recent  | Source control                 |
| Python                | 3.10+       | RPA script execution           |
| Chrome or Chromium    | any recent  | Browser automation target      |

Optional: `curl` and `jq` for command-line diagnostics.

### 8.2 Automated setup (recommended)

One command handles prerequisites check, dependency install, Python venv, database setup, and verification:

**macOS / Linux:**
```bash
git clone https://github.com/d4551/baobuildbuddy.git
cd baobuildbuddy
bash scripts/setup.sh
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/d4551/baobuildbuddy.git
cd baobuildbuddy
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

**Setup script flags:**

| Flag | Bash | PowerShell | Effect |
|------|------|-----------|--------|
| Skip verification | `--skip-checks` | `-SkipChecks` | Skip typecheck, lint, and test runs |
| Skip Python | `--skip-python` | `-SkipPython` | Skip venv creation (Bun-only install) |
| Help | `--help` | `-Help` | Print usage and exit |

The setup scripts will:
1. Detect OS and architecture, verify all prerequisites (Bun, Git, Python 3.10+, Chrome)
2. Run `bun install`
3. Create Python venv, install RPA dependencies, verify `rpa` module import
4. Copy `.env.example` to `.env` if it doesn't exist
5. Run `db:generate` and `db:push`
6. Run typecheck, lint, and tests
7. Print summary with error/warning counts

### 8.3 Manual setup (step-by-step)

If you prefer manual control, follow these steps:

```bash
cd /path/to/workspace
git clone https://github.com/d4551/baobuildbuddy.git
cd baobuildbuddy
bun install
```

**Python environment:**

```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r packages/scraper/requirements.txt
```

**Environment file:**

```bash
cp .env.example .env
```

Edit `.env` with your environment-specific values. Defaults are already defined in source config files -- you only need to set what differs from defaults.

### 8.5 Source-of-truth config files

| File                                     | Governs                        |
|------------------------------------------|-------------------------------|
| `packages/server/src/config/env.ts`      | Server environment validation  |
| `packages/server/src/config/paths.ts`    | File system paths used by server |
| `packages/client/nuxt.config.ts`         | Client runtime config, proxy, modules |
| `packages/scraper/requirements.txt`      | Python RPA dependencies        |
| `.env.example`                           | Template for all env vars      |

## 9) Configuration reference

```text
      .---------.
     | .-------. |      ~~~ OPTIONS MENU ~~~
     | |  .env | |
     | |       | |      Every configurable value lives
     | '-------' |      in .env or a source-of-truth
     '----( )----'      config file. Nothing is hardcoded.
          | |
          | |           "Hey! Listen!" -- set your
          '-'            LOCAL_MODEL_ENDPOINT first.
```

### 9.1 Server (`.env`)

| Key | Purpose | Details |
|-----|---------|---------|
| `PORT` | API bind port | Validated in range `1..65535` |
| `HOST` | API bind host | Passed to Elysia listener |
| `DB_PATH` | SQLite database file location | Parent directory must be writable |
| `LOG_LEVEL` | Logging verbosity | `info`, `debug`, `warn`, `error` |
| `CORS_ORIGINS` | Comma-separated allowed origins | Defaults include localhost variants |
| `BAO_DISABLE_AUTH` | Disable auth for local dev | Set `true` or `1` to skip auth checks |

### 9.2 Client (`.env`)

| Key | Purpose |
|-----|---------|
| `NUXT_PUBLIC_API_BASE` | API base URL for `useFetch` / `$fetch` calls |
| `NUXT_PUBLIC_WS_BASE` | WebSocket base URL for chat and interview |
| `NUXT_PUBLIC_API_PROXY` | Dev proxy target for API server |
| `NUXT_PUBLIC_QUERY_STALE_TIME_MS` | TanStack Query stale time |
| `NUXT_PUBLIC_QUERY_RETRY_COUNT` | TanStack Query retry budget |
| `NUXT_PUBLIC_QUERY_REFETCH_ON_FOCUS` | Refetch on window focus |

### 9.3 AI provider keys

| Key | Purpose |
|-----|---------|
| `LOCAL_MODEL_ENDPOINT` | Local inference server URL |
| `LOCAL_MODEL_NAME` | Local model identifier |
| `OPENAI_API_KEY` | OpenAI cloud provider |
| `GEMINI_API_KEY` | Google Gemini cloud provider |
| `CLAUDE_API_KEY` | Anthropic Claude cloud provider |
| `HUGGINGFACE_TOKEN` | HuggingFace Inference API |

## 10) Start procedures

```text
     _____________
    |  ___  ___  |
    | | 1 || 2 | |      PLAYER SELECT
    | |___||___| |
    |  ___  ___  |      1 = Full stack   (bun run dev)
    | | 3 || 4 | |      2 = Server only  (bun run dev:server)
    | |___||___| |      3 = Client only  (bun run dev:client)
    |_____________|      4 = Split terminals

     "Press START to begin"
```

### 10.1 Full stack (recommended)

```bash
bun run dev
```

Runs both services in parallel:
- `bun run dev:server` (packages/server on `PORT`, default 3000)
- `bun run dev:client` (packages/client, default 3001)

### 10.2 Split terminal startup

Terminal 1:
```bash
bun run dev:server
```

Terminal 2:
```bash
bun run dev:client
```

### 10.3 Expected endpoints

| Endpoint | Default | Config key |
|----------|---------|-----------|
| API server | `http://localhost:3000` | `NUXT_PUBLIC_API_BASE` |
| Client / UI | `http://localhost:3001` | `NUXT_PUBLIC_WS_BASE` |
| Chat WebSocket | `ws://localhost:3000/api/ws/chat` | derived from API base |
| Interview WebSocket | `ws://localhost:3000/api/ws/interview` | derived from API base |

### 10.4 All available scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Dev (full) | `bun run dev` | Start server + client in parallel |
| Dev server | `bun run dev:server` | Start API server only |
| Dev client | `bun run dev:client` | Start Nuxt client only |
| Build | `bun run build` | Build shared, server, and client |
| Typecheck | `bun run typecheck` | TypeScript type checking across all packages |
| Test | `bun run test` | Run test suites for server and client |
| Lint | `bun run lint` | Biome linter check |
| Lint fix | `bun run lint:fix` | Auto-fix lint issues |
| DB generate | `bun run db:generate` | Generate Drizzle migration files |
| DB push | `bun run db:push` | Push schema changes to SQLite |
| DB studio | `bun run db:studio` | Open Drizzle Studio GUI for database inspection |

## 11) End-to-end verification

```text
         ______
        |      |      ~~~ SAVE POINT ~~~
        | SAVE |
        |______|      Before you open the UI, run these
         /    \       verification checks. Every check that
        /  ()  \      passes is XP earned. Every check
       /________\     skipped is a Boo that haunts you later.
```

### 11.1 Build and lint checks

```bash
bun run typecheck
bun run lint
bun run test
```

### 11.2 Database setup

```bash
bun run db:generate
bun run db:push
```

The seed directory (`packages/server/src/db/seed/`) contains initial data for gaming studios and industry data to bootstrap the database.

### 11.3 ASCII geometry validation

```bash
bun run scripts/validate-ascii-geometry.ts README.md
```

### 11.4 Live service checks

```bash
API_BASE="${NUXT_PUBLIC_API_BASE:-http://localhost:3000}"
curl -fsS "${API_BASE}/api/health"
curl -fsS "${API_BASE}/api/auth/status"
curl -fsS "${API_BASE}/api/jobs" | head
curl -fsS "${API_BASE}/api/automation/runs" | head
curl -fsS "${API_BASE}/api/stats" | head
```

### 11.5 Route health matrix

| Endpoint | Purpose | Expected response |
|----------|---------|-------------------|
| `/api/health` | Readiness probe | JSON with `status` and `database` fields |
| `/api/auth/status` | Auth state | Whether auth system is initialized |
| `/api/studio` | Studio data | Studio list structure |
| `/api/jobs` | Job search | Paginated job list |
| `/api/resume` | Resume CRUD | Resume list or creation response |
| `/api/cover-letter` | Cover letter CRUD | Cover letter list or creation response |
| `/api/portfolio` | Portfolio CRUD | Portfolio project list |
| `/api/interview` | Interview sessions | Interview history |
| `/api/gamification` | XP and achievements | Gamification state payload |
| `/api/skill-mapping` | Skill analysis | Skill mapping and gap analysis |
| `/api/automation/runs` | Automation audit | Persisted run records |
| `/api/stats` | Usage statistics | Aggregate stat payload |
| `/api/ws/chat` | AI chat | WebSocket upgrade handshake |
| `/api/ws/interview` | Mock interview | WebSocket upgrade handshake |

## 12) Project structure

```text
     "The right man in the wrong place
      can make all the difference in the world."
      -- But the right file in the wrong directory? Not so much.
```

```text
    baobuildbuddy/
    +-- packages/
    |   +-- server/                 Bun + Elysia API server
    |   |   +-- src/
    |   |   |   +-- routes/         16 route modules + test files
    |   |   |   |   +-- auth.routes.ts
    |   |   |   |   +-- user.routes.ts
    |   |   |   |   +-- settings.routes.ts
    |   |   |   |   +-- jobs.routes.ts
    |   |   |   |   +-- resume.routes.ts
    |   |   |   |   +-- cover-letter.routes.ts
    |   |   |   |   +-- portfolio.routes.ts
    |   |   |   |   +-- interview.routes.ts
    |   |   |   |   +-- studio.routes.ts
    |   |   |   |   +-- scraper.routes.ts
    |   |   |   |   +-- ai.routes.ts
    |   |   |   |   +-- gamification.routes.ts
    |   |   |   |   +-- skill-mapping.routes.ts
    |   |   |   |   +-- search.routes.ts
    |   |   |   |   +-- stats.routes.ts
    |   |   |   |   +-- automation.routes.ts
    |   |   |   +-- services/       Business logic layer
    |   |   |   |   +-- ai/         5 provider adapters + context manager + prompts
    |   |   |   |   +-- automation/ application-automation-service.ts, rpa-runner.ts
    |   |   |   |   +-- jobs/       Aggregator, matching, dedup, provider registry
    |   |   |   |   |   +-- providers/  greenhouse, lever, company-board, gaming-providers
    |   |   |   |   +-- resume-service.ts
    |   |   |   |   +-- cover-letter-service.ts
    |   |   |   |   +-- portfolio-service.ts
    |   |   |   |   +-- interview-service.ts
    |   |   |   |   +-- gamification-service.ts
    |   |   |   |   +-- scraper-service.ts
    |   |   |   |   +-- search-service.ts
    |   |   |   |   +-- statistics-service.ts
    |   |   |   |   +-- export-service.ts
    |   |   |   |   +-- data-service.ts
    |   |   |   |   +-- cv-questionnaire-service.ts
    |   |   |   |   +-- skill-extractor.ts
    |   |   |   |   +-- skill-mapping-service.ts
    |   |   |   +-- db/
    |   |   |   |   +-- schema/     13 Drizzle schema files
    |   |   |   |   |   +-- user.ts, auth.ts, resumes.ts, cover-letters.ts
    |   |   |   |   |   +-- portfolios.ts, interviews.ts, studios.ts, jobs.ts
    |   |   |   |   |   +-- skill-mappings.ts, gamification.ts, settings.ts
    |   |   |   |   |   +-- automation-runs.ts, chat-history.ts
    |   |   |   |   +-- migrations/
    |   |   |   |   +-- seed/       Initial gaming data and studio records
    |   |   |   |   +-- client.ts, init.ts
    |   |   |   +-- middleware/     auth.ts, error-handler.ts, logger.ts
    |   |   |   +-- ws/             chat.ws.ts, interview.ws.ts
    |   |   |   +-- config/         env.ts (validation), paths.ts
    |   +-- client/                 Nuxt 3 SSR application
    |   |   +-- pages/              28 page components across 10 feature areas
    |   |   +-- components/         25 Vue components
    |   |   |   +-- ai/             AIChatBubble, AIStreamingResponse, BaoFairy
    |   |   |   +-- resume/         ResumePreview, ExperienceList, PersonalInfoForm,
    |   |   |   |                   SkillsEditor, EducationList
    |   |   |   +-- jobs/           JobCard, JobMatchScore, JobSearchBar, JobFilters
    |   |   |   +-- interview/      InterviewChat, ScoreCard, StudioSelector
    |   |   |   +-- gamification/   DailyChallenge, XPBar, AchievementBadge
    |   |   |   +-- portfolio/      PortfolioGrid, ProjectCard
    |   |   |   +-- layout/         AppNavbar, AppSidebar, AppDock
    |   |   |   +-- ui/             ConfirmDialog, LoadingSkeleton
    |   |   +-- composables/        22 composables
    |   |   |   +-- useApi, useAuth, useUser, useSettings, useSettingsQuery
    |   |   |   +-- useTheme, useWebSocket, useSpeech, useTTS, useSTT
    |   |   |   +-- useJobs, useSearch, useResume, useCoverLetter
    |   |   |   +-- usePortfolio, useStudio, useInterview, useAI
    |   |   |   +-- useAutomation, useGamification, useSkillMapping, useStatistics
    |   |   +-- plugins/            vue-query.ts, toast.client.ts, eden.ts
    |   |   +-- middleware/         auth.ts (client-side auth guard)
    |   |   +-- layouts/            default.vue, onboarding.vue
    |   |   +-- utils/              errors.ts
    |   |   +-- types/              nuxt.d.ts, speech.d.ts
    |   |   +-- assets/css/         main.css
    |   +-- shared/                 Cross-package contracts
    |   |   +-- src/
    |   |   |   +-- types/          12 type definition files
    |   |   |   |   +-- user, ai, resume, interview, jobs, cover-letter
    |   |   |   |   +-- portfolio, studio, gamification, skill-mapping
    |   |   |   |   +-- settings, search
    |   |   |   +-- schemas/        5 validation schemas
    |   |   |   |   +-- user.schema, resume.schema, job.schema
    |   |   |   |   +-- interview.schema, settings.schema
    |   |   |   +-- constants/      7 constant files
    |   |   |   |   +-- ai, branding, gaming-roles, gaming-technologies
    |   |   |   |   +-- salary-ranges, state-keys, xp-levels
    |   |   |   +-- utils/          4 utility modules
    |   |   |       +-- validation, date-helpers, salary-parser, resume-transform
    |   +-- scraper/                Python RPA scripts
    |       +-- apply_job_rpa.py
    |       +-- job_scraper_gamedev.py
    |       +-- studio_scraper.py
    |       +-- requirements.txt
    +-- scripts/
    |   +-- setup.sh                    Automated setup for macOS / Linux
    |   +-- setup.ps1                   Automated setup for Windows (PowerShell)
    |   +-- validate-ascii-geometry.ts  ASCII art geometry checker
    +-- .env.example
    +-- package.json
    +-- drizzle.config.ts
    +-- biome.json
```

## 13) Client pages and features

```text
       _____________________
      |  _______________    |
      | |               |   |     "All your base
      | |  WORLD MAP    |   |      are belong to us."
      | |               |   |
      | |  10 regions   |   |      Navigate 28 pages across
      | |  28 zones     |   |      10 feature areas.
      | |_______________|   |
      |_____________________|
```

| Feature area | Pages | Key composables |
|-------------|-------|-----------------|
| **Home & Setup** | `index.vue`, `setup.vue`, `settings.vue` | `useAuth`, `useSettings`, `useTheme` |
| **Resume** | `resume/index`, `resume/build`, `resume/preview` | `useResume` |
| **Cover Letter** | `cover-letter/index`, `cover-letter/[id]` | `useCoverLetter` |
| **Portfolio** | `portfolio/index`, `portfolio/preview` | `usePortfolio` |
| **Interview** | `interview/index`, `interview/session`, `interview/history` | `useInterview`, `useWebSocket` |
| **AI Chat** | `ai/dashboard`, `ai/chat` | `useAI`, `useSpeech`, `useTTS`, `useSTT` |
| **Studios** | `studios/index`, `studios/[id]`, `studios/analytics` | `useStudio` |
| **Jobs** | `jobs/index`, `jobs/[id]` | `useJobs`, `useSearch` |
| **Automation** | `automation/index`, `automation/job-apply`, `automation/scraper`, `automation/runs`, `automation/runs/[id]` | `useAutomation` |
| **Skills & XP** | `skills/index`, `skills/pathways`, `gamification.vue` | `useSkillMapping`, `useGamification` |

### UI implementation standards

- SSR-first data loading by default; composables for client-side interactivity.
- `useFetch` for route/page-level data, `$fetch` for user-triggered actions.
- Async state (`idle`, `pending`, `success`, `error`) mapped to daisyUI components (`loading`, `alert`, `stat`, `card`, `table`).
- The Elysia Eden client (`plugins/eden.ts`) provides end-to-end type safety between Nuxt and the API.
- TanStack Vue Query (`plugins/vue-query.ts`) manages cache, stale time, and retry for all API calls.

### daisyUI component references

- https://daisyui.com/components/button/
- https://daisyui.com/components/card/
- https://daisyui.com/components/stats/
- https://daisyui.com/components/table/
- https://daisyui.com/components/alert/
- https://daisyui.com/components/loading/

## 14) Database schema

```text
      .-----------.
     /             \       "A man chooses. A slave obeys."
    |   13 TABLES   |       But a schema migrates.
    |   IN SQLite   |
     \             /       All tables are defined in
      '-----------'        packages/server/src/db/schema/
```

| Schema file | Tables | Purpose |
|------------|--------|---------|
| `user.ts` | users | User accounts and profiles |
| `auth.ts` | auth tokens | Authentication sessions and tokens |
| `resumes.ts` | resumes | Resume data with structured sections |
| `cover-letters.ts` | cover_letters | Generated and custom cover letters |
| `portfolios.ts` | portfolios, portfolio_projects | Portfolio collections and individual projects |
| `interviews.ts` | interviews, interview_messages | Mock interview sessions and transcript history |
| `studios.ts` | studios | Game studio directory |
| `jobs.ts` | jobs | Aggregated job listings from all providers |
| `skill-mappings.ts` | skill_mappings | User skill profiles and gap analysis |
| `gamification.ts` | achievements, xp_events | XP tracking, achievements, daily challenges |
| `settings.ts` | settings | User preferences and app configuration |
| `automation-runs.ts` | automation_runs | RPA execution audit trail with input/output snapshots |
| `chat-history.ts` | chat_messages | AI conversation history |

Migrations are in `packages/server/src/db/migrations/`. Seed data (`packages/server/src/db/seed/`) provides initial gaming studio records and industry reference data.

## 15) Troubleshooting

```text
        .--------.
       / YOU DIED \       Don't panic. Check the matrix below.
      |  ________  |      Every problem has a save file.
      | |CONTINUE| |
      | |________| |      "Had to be me. Someone else might
       \__________/        have gotten it wrong." -- debug carefully.
```

### 15.1 API does not start

| Check | Command / action |
|-------|-----------------|
| Dependencies installed? | `bun install` |
| Port already in use? | `lsof -i :3000` or change `PORT` in `.env` |
| DB path writable? | Verify parent directory of `DB_PATH` exists and is writable |
| Detailed logs | Set `LOG_LEVEL=debug` in `.env` and restart |

### 15.2 Client cannot reach API

| Check | Command / action |
|-------|-----------------|
| API base configured? | Verify `NUXT_PUBLIC_API_BASE` in `.env` |
| Proxy configured? | Verify `NUXT_PUBLIC_API_PROXY` points to running server |
| CORS issue? | Ensure `CORS_ORIGINS` includes client origin |
| Server running? | `curl http://localhost:3000/api/health` |

### 15.3 WebSocket handshake fails

| Check | Command / action |
|-------|-----------------|
| WS base correct? | Verify `NUXT_PUBLIC_WS_BASE` |
| Routes registered? | Server logs should show `/api/ws/chat` and `/api/ws/interview` |
| Firewall blocking? | Test with `wscat -c ws://localhost:3000/api/ws/chat` |

### 15.4 RPA automation fails

| Check | Command / action |
|-------|-----------------|
| Python venv active? | `source .venv/bin/activate && python -c "import rpa"` |
| Chrome available? | `which google-chrome` or `which chromium` |
| Script output? | Check server logs for stdout/stderr from subprocess |
| Run record? | Query `/api/automation/runs` for the run ID, check `error` and `screenshots` |

### 15.5 AI providers not responding

| Check | Command / action |
|-------|-----------------|
| Keys configured? | Verify API keys are set in `.env` |
| Local model running? | `curl ${LOCAL_MODEL_ENDPOINT}/api/tags` or equivalent health check |
| Provider logs? | Set `LOG_LEVEL=debug` and check AI service output |
| Context overflow? | `context-manager.ts` may be truncating -- check conversation length |

### 15.6 Job aggregation returns empty results

| Check | Command / action |
|-------|-----------------|
| Providers registered? | Check server logs for provider registration on startup |
| Network access? | Verify outbound HTTP to Greenhouse/Lever APIs |
| DB seeded? | Run seed if studios table is empty |
| Dedup too aggressive? | Check `deduplication.ts` thresholds |

## 16) ASCII art and geometry validation

All ASCII art blocks in this document use consistent formatting. After editing any ASCII block, validate:

```bash
bun run scripts/validate-ascii-geometry.ts README.md
```

## 17) Final checklist

```text
    ========================================
    |  FINAL BOSS: DEPLOYMENT READINESS    |
    |                                      |
    |     ,%%%,                            |
    |    ,%%%` %==--     HP: [==========]  |
    |   ,%%`( '|                           |
    |  ,%%@ /\_/          Clear all checks |
    |  ,%.-"""--,         to defeat this   |
    |  %%/      |         boss and go live.|
    |  %'  \   /                           |
    |   |  /   |          "Finish Him!"    |
    |   |  |   |                           |
    ========================================
```

- [ ] `bun install` completed successfully
- [ ] Python venv created and `rpa` installed from `packages/scraper/requirements.txt`
- [ ] `.env` populated from `.env.example` with environment-specific values
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run test` passes
- [ ] `bun run db:generate` + `bun run db:push` complete
- [ ] `bun run dev` starts both server and client
- [ ] `/api/health` returns healthy status
- [ ] `/api/auth/status` responds
- [ ] `/api/jobs` returns job list
- [ ] `/api/automation/runs` returns run records
- [ ] `/api/ws/chat` WebSocket handshake succeeds
- [ ] `/api/ws/interview` WebSocket handshake succeeds
- [ ] AI provider responds (local or cloud)
- [ ] `bun run scripts/validate-ascii-geometry.ts README.md` passes

```text
  +============================================================+
  |                                                            |
  |    __  __ ___ ____ ____ ___ ___  _   _                     |
  |   |  \/  |_ _/ ___/ ___|_ _/ _ \| \ | |                   |
  |   | |\/| || |\___ \___ \| | | | |  \| |                   |
  |   | |  | || | ___) |__) | | |_| | |\  |                   |
  |   |_|  |_|___|____/____/___\___/|_| \_|                   |
  |                                                            |
  |     ____ ___  __  __ ____  _     _____ _____ _____         |
  |    / ___/ _ \|  \/  |  _ \| |   | ____|_   _| ____|       |
  |   | |  | | | | |\/| | |_) | |   |  _|   | | |  _|         |
  |   | |__| |_| | |  | |  __/| |___| |___  | | | |___        |
  |    \____\___/|_|  |_|_|   |_____|_____| |_| |_____|       |
  |                                                            |
  |               BaoBuildBuddy v1.0 is ready.                 |
  |                                                            |
  |               "Thank you Mario!                            |
  |                But our princess is in                       |
  |                another castle."                            |
  |                                                            |
  |               Just kidding. You're done.                   |
  |                                                            |
  +============================================================+
```
