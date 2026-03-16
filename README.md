```text ascii-box
    ____              ____        _ _     _ ____            _     _
   | __ )  __ _  ___ | __ ) _   _(_) | __| | __ ) _   _  __| | __| |_   _
   |  _ \ / _` |/ _ \|  _ \| | | | | |/ _` |  _ \| | | |/ _` |/ _` | | | |
   | |_) | (_| | (_) | |_) | |_| | | | (_| | |_) | |_| | (_| | (_| | |_| |
   |____/ \__,_|\___/|____/ \__,_|_|_|\__,_|____/ \__,_|\__,_|\__,_|\__, |
                                                                    |___/
                        Local Operations Manual
```

# BaoBuildBuddy Local Setup Guide

[![Bun](https://img.shields.io/badge/Bun-Manifest-1f2937?logo=bun&logoColor=white)](https://bun.sh/)
[![Nuxt](https://img.shields.io/badge/Nuxt-4.x-00dc82?logo=nuxtdotjs&logoColor=white)](https://nuxt.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/github/license/d4551/baobuildbuddy)](https://github.com/d4551/baobuildbuddy/blob/main/LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/d4551/baobuildbuddy)](https://github.com/d4551/baobuildbuddy/commits/main)

## Start Here First

`README.md` is the full local runbook. If you are new, non-technical, or just want the fastest setup path, start with one of these shorter guides first:

| If you want to... | Start here |
|---|---|
| understand the app in plain English | [Explain Like I'm 5 System Walkthrough](docs/ELI5_SYSTEM_WALKTHROUGH.md) |
| get BaoBuildBuddy running for the first time | [First-Time Setup Guide](docs/STARTER_GUIDE.md) |
| set up local AI with Ollama | [Local AI Setup Guide](docs/LOCAL_AI_SETUP.md) |
| learn the automation flows | [Automation Guide](docs/AUTOMATION.md) |

Tiny version:

- Nuxt is the screen.
- Elysia is the traffic controller.
- SQLite is the notebook.
- Playwright is the robot browser.
- Bun is the runtime, package manager, bundler, and test runner.
- Tauri is the desktop wrapper.

## Local AI Quick Path

If you want BaoBuildBuddy to use AI on your own computer without starting with cloud API keys:

1. Install Ollama from [ollama.com/download](https://ollama.com/download/).
2. Read the official [Ollama Quickstart](https://docs.ollama.com/quickstart) if you want the vendor walkthrough.
3. Download a first model with `ollama pull llama3.2`.
4. Open BaoBuildBuddy and go to **Settings > AI Providers**.
5. Use `http://localhost:11434/v1` as the local endpoint and leave the model blank if you want auto-detect.

For the full beginner walkthrough, use [docs/LOCAL_AI_SETUP.md](docs/LOCAL_AI_SETUP.md).

## Quick links

- [Explain Like I'm 5 System Walkthrough](docs/ELI5_SYSTEM_WALKTHROUGH.md)
- [Local AI Setup Guide](docs/LOCAL_AI_SETUP.md)
- [Non-Technical Install (Pick Your OS)](#non-technical-install-pick-your-os)
- [Getting Started (First-time setup)](docs/STARTER_GUIDE.md)
- [Automation Guide](docs/AUTOMATION.md)
- [Ollama Download](https://ollama.com/download/)
- [Ollama Quickstart](https://docs.ollama.com/quickstart)
- [Desktop (Tauri) Packaging](#89-desktop-tauri-installer-path)

## Release Validation Workflow

Use this sequence for a full local quality gate and host-local desktop verification pass:

```bash
bun run lint
bun run typecheck
bun run test
bun run build
bun run build:desktop
```

To assemble a canonical multi-platform release set after matching-host jobs have produced native artifacts under `.desktop-release-artifacts`, run:

```bash
bun run release:refresh:all-os
```

Per-platform native release staging commands:

```bash
bun run release:desktop:macos -- --output-root .desktop-release-artifacts
bun run release:desktop:windows -- --output-root .desktop-release-artifacts
bun run release:desktop:linux-arm64 -- --output-root .desktop-release-artifacts
```

These commands follow the Tauri 2 matching-host release contract:

- `bun run build:desktop` builds only the current host target.
- `bun run release:desktop:macos` runs the macOS-native split flow: `bun tauri build --no-bundle` then `bun tauri bundle --bundles app,dmg`.
- `bun run release:desktop:windows` runs native Windows `bun tauri build` and stages the NSIS installer plus portable zip.
- `bun run release:desktop:linux-arm64` runs native Linux ARM64 `bun tauri build --bundles deb,rpm` and stages the deb and rpm bundles.
- `bun run release:refresh:all-os` no longer cross-builds from one machine. It assembles previously built matching-host artifacts, regenerates checksums, and verifies staged provenance.

Script/runtime verification commands:

```bash
bun run ci:alignment
bun run validate:no-try-catch
bun run validate:no-unsafe-casts
bun run validate:no-hardcoded-paths
bun run validate:locales
bun run validate:page-seo
bun run validate:i18n-ui
bun run validate:aria
bun run validate:alignment
bun run validate:ui-layout-tokens
bun run validate:ui
bun run audit:official-llms
```

`bun run validate:aria` enforces accessible names for interactive controls and requires modal dialogs to declare `aria-modal="true"` with a programmatic label (`aria-label` or `aria-labelledby`).

SSR route/content verification (requires running app target at `VERIFY_BASE_URL`):

```bash
bun run verify:pages
```

Lint reporting policy:

- Lint diagnostics are not suppressed.
- `bun run lint` uses Biome with `--max-diagnostics=1200` to avoid truncated reporting while preserving all current findings in this codebase.

Expected validation outcomes:

- `bun run lint`: no lint warnings or errors.
- `bun run --filter '@bao/client' lint`: no warnings or errors.
- `bun run typecheck`: no TypeScript diagnostics.
- `bun run test`: all workspace test suites pass.
- `bun run build`: all packages build successfully.
- `CI=true bun run build:desktop`: current-host desktop packaging build succeeds.
- `bun run release:desktop:<target>`: the matching-host native desktop artifacts for that target are produced under `.desktop-release-artifacts/<target>`.
- `bun run release:refresh:all-os`: previously staged matching-host desktop artifacts are assembled under `packages/desktop/releases`, checksummed, and provenance-verified.
- `bun run audit:official-llms`: official Bun/Nuxt/Elysia `llms.txt` sources are reachable and include required guidance markers.
- `bun run ci:alignment`: frozen-lockfile install plus the Bun/daisyUI alignment gate passes.
- `bun run validate:alignment`: combined baseline + stack + UI contracts pass for Bun and daisyUI alignment.
- `bun run verify:pages`: all required SSR routes and content checks pass against the selected preview target.

## Stack and Version Contract

Context7 verification references:

- Nuxt 4 docs (`/websites/nuxt_4_x`) confirm `nuxt` latest tag is v4.
- Drizzle ORM docs (`/drizzle/team/drizzle`) confirm runtime data layer guidance.
- Bun docs (`/oven-sh/bun`) confirm Bun runtime/toolchain guidance.

Track and verify stack versions via the workspace manifest and npm latest checks:

- `bun run ci:alignment` (CI install + alignment gate using `bun ci`)
- `bun run audit:stack-versions` (authoritative runtime check)
- `bun run verify:bun-baseline` (guards against stale Bun baseline references)
- `bun run validate:alignment` (runtime + stack + UI contract gate)
- `bun pm pkg get packageManager` (workspace-required Bun baseline)
- `bun pm pkg get dependencies.nuxt dependencies.tailwindcss` (framework baseline sanity check)

Data layer note:

- The active runtime stack uses `drizzle-orm` (`packages/server`) with `bun:sqlite`. Drizzle is the sole ORM; no Prisma.

To verify stack versions against npm:

```bash
bun run audit:stack-versions
bun run validate:daisyui-contracts
```

daisyUI blueprint contract scope:

- `scripts/validate-daisyui-contracts.ts` audits the app shell drawer/navbar plus the jobs, automation, skills, and score/progress surfaces against daisyUI semantic classes.
- Required blueprint primitives in scope are `card`, `btn`, `drawer`, `navbar`, `table`, `list`, `progress`, and `radial-progress`.
- The validator rejects raw table/progress markup without `table`/`progress`, `btn-*` modifiers without `btn`, and `radial-progress` usage without accessible progressbar attributes.

## Non-Technical Install (Pick Your OS)

Use the packaged desktop installers in `packages/desktop/releases` when you want an install path without setting up local development dependencies.

1. Open `packages/desktop/releases`.
2. Open the folder for your operating system.
3. Run the matching installer file for your architecture (see `packages/desktop/releases/README.md` for the current canonical artifact naming).

> A wild installer appeared. Choose your OS in `packages/desktop/releases`.

| Operating system | Artifact pattern |
|------------------|--------------|
| macOS (Apple Silicon) | `<PRODUCT_NAME>_<VERSION>_aarch64.dmg` |
| Windows (x64) | `<PRODUCT_NAME>_<VERSION>_x64-setup.exe` or `<PRODUCT_NAME>_<VERSION>_x64-portable.zip` |
| Linux (ARM64) | `<PRODUCT_NAME>_<VERSION>_arm64.deb` or `<PRODUCT_NAME>-<VERSION>-1.aarch64.rpm` |

If you are on a different CPU architecture, use the matching artifact for that architecture when available in releases.
Windows desktop releases are 64-bit only. We do not ship 32-bit (`x86` / `i686`) Windows builds.

### Documentation index

- [Explain Like I'm 5 System Walkthrough](docs/ELI5_SYSTEM_WALKTHROUGH.md)
- [Local AI Setup Guide](docs/LOCAL_AI_SETUP.md)
- [First-time Setup Guide](docs/STARTER_GUIDE.md)
- [Automation and RPA Guide](docs/AUTOMATION.md)
- [Server routes and contracts in `packages/server`](packages/server/src/routes)
- [UI and accessibility standards](#ui-implementation-standards)

```text ascii-box
/------------------------------\
|           BAO WORLD          |
|     Press START to begin!     |
|------------------------------|
| 1) Prepare environment       |
| 2) Configure services        |
| 3) Start server and client   |
| 4) Verify contracts          |
| 5) Run your automation       |
\------------------------------/
```

BaoBuildBuddy is a full-stack, Bun-first monorepo for building game-industry career automation workflows. It aggregates job listings from studios, helps build resumes and cover letters, runs AI-powered mock interviews, automates job applications via browser RPA, and tracks your progress with a gamification system.

Treat this file as the campaign handbook for your first setup quest; once you master it, you can unlock the deeper sections.

This readme is your in-game tutorial before the main campaign.

- `packages/server` -- Bun + Elysia API, Drizzle ORM, WebSocket endpoints, process orchestration
- `packages/client` -- Nuxt 4 (SSR-first), Tailwind CSS v4, daisyUI v5
- `packages/shared` -- shared types, contracts, constants, schemas, validation utilities
- `packages/scraper` -- Bun + TypeScript Playwright automation executables run via Bun subprocess I/O
- `packages/desktop` -- Tauri desktop packaging and release staging

Global flow decisions are centralized in `packages/client/constants/flow-engine.ts` (`resolveFlowReadinessState` + `resolveFlowRecommendations`) and consumed via `packages/client/composables/useFlowEngine.ts` so quick actions and next-step routing are derived from one deterministic source.
Layout structure is centralized in `packages/client/constants/ui-layout.ts` and rendered through `PageScaffold`, `PageHeaderBlock`, `SectionGrid`, and `AppModalFrame` to keep widths, spacing, grid breakpoints, and modal sizing tokenized.
AI provider presentation is localized through `aiProviderCatalog.*` keys and rendered with `AIProviderIcon`, so provider labels/descriptions/icons are no longer hardcoded in shared constants.
Interview role selection is adaptive and recommendation-driven: setup/interview flows now prioritize profile role, readiness role rankings, pathway match scores, and live job-title signals, with a single shared fallback only when no personalized signals are available.
Skills readiness payloads now emit typed recommendation IDs (`feedbackId`, `improvementSuggestions`, `nextSteps`) instead of hardcoded prose so UI copy is fully locale-driven.

If you want the simplest path with minimal technical detail, use `docs/STARTER_GUIDE.md`.

## 1) Scope of this document

This is the canonical local setup runbook for BaoBuildBuddy. It covers:

- Local install and startup for all five workspace packages
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
       |── WebSocket ──> /ws/chat        |── AI providers (5 adapters)
       |── WebSocket ──> /ws/interview   |── RPA subprocess (Bun.spawn)
       |── WebSocket ──> /ws/automation  |
                                    |
                          Job provider registry
                          (ATS + gaming boards + company boards)
```

```mermaid
flowchart TD
  Browser["Browser"] --> Client["packages/client (Nuxt SSR)"]
  Client --> Pages["pages + layouts + components"]
  Client --> Composables["typed composables + api-normalizers.ts"]
  Client --> EdenClient["plugins/eden.ts"]
  Client --> FlowEngine["flow-engine.ts + ui-layout.ts"]

  ServerTypes["packages/server/dist-types"]
  Shared["packages/shared contracts"]
  EdenClient -->|typed HTTP calls| ApiPrefix["/api"]
  EdenClient -->|type import| ServerTypes
  ApiPrefix --> App["packages/server/src/app.ts"]
  App --> Middleware["cors + swagger + rate-limit + logger + errorHandler + authGuard"]
  App --> Routes["17 route modules from route-modules.ts"]
  App --> WebSockets["/api/ws/chat + /api/ws/interview + /api/ws/automation"]
  App --> Shared
  App --> ServerTypes

  Routes --> AuthRoutes["auth + user + settings"]
  Routes --> CareerRoutes["jobs + resume + cover-letter + portfolio + interview + studios"]
  Routes --> AutomationRoutes["automation + scraper + automation-screenshots"]
  Routes --> PlatformRoutes["ai + gamification + skill-mapping + search + stats"]

  CareerRoutes --> JobsSvc["jobs service"]
  JobsSvc --> JobAggregator["job-aggregator.ts"]
  JobAggregator --> ProviderRegistry["provider-registry.ts"]
  ProviderRegistry --> ATSProviders["greenhouse.ts + lever.ts + company-board.ts"]
  ProviderRegistry --> GamingProviders["gaming-providers.ts"]
  JobsSvc --> MatchingSvc["matching-service.ts"]
  JobsSvc --> DedupSvc["deduplication.ts"]

  CareerRoutes --> DomainServices["resume + cover-letter + portfolio + interview + studio services"]
  PlatformRoutes --> PlatformServices["ai + gamification + skill-mapping + search + statistics"]
  PlatformServices --> SkillExtractor["skill-extractor.ts"]
  PlatformServices --> AiProviders["local + openai + gemini + claude + huggingface"]
  AiProviders --> ExternalAI["provider APIs / local model endpoint"]

  AutomationRoutes --> AutomationSvc["application-automation-service.ts"]
  AutomationRoutes --> ScraperSvc["scraper-service.ts"]
  AutomationSvc --> Runner["automation/rpa-runner.ts"]
  ScraperSvc --> Runner
  Runner --> ScraperPkg["packages/scraper"]
  ScraperPkg --> Scripts["src/scripts/*.ts"]
  Scripts --> Runtime["Playwright runtime + ATS adapters + provider extractors"]

  JobsSvc --> DB[(SQLite via bun:sqlite + Drizzle)]
  DomainServices --> DB
  PlatformServices --> DB
  AutomationSvc --> AutomationRuns["automation_runs"]
  ScraperSvc --> JobsStudios["jobs + studios ingestion"]
  AutomationRuns --> DB
  JobsStudios --> DB
```

## 3) Implementation principles

Each Elysia route module owns its service directly -- routes call services, services call the database or external providers. Typed contracts in `packages/shared` are the source of truth for request/response shapes across client and server. Bun automation executables run in isolated Bun subprocesses with JSON/NDJSON over stdin/stdout. Runtime values are sourced from environment configuration and persisted settings in the `settings` table.

## 3.1 Internationalization and language support

BaoBuildBuddy ships the following runtime UI locale packs:

- `en-US` — `packages/client/locales/en-US.ts`
- `es-ES` — `packages/client/locales/es-ES.ts`
- `fr-FR` — `packages/client/locales/fr-FR.ts`
- `ja-JP` — `packages/client/locales/ja-JP.ts`

Single source of truth:

- `packages/client/plugins/i18n.ts` registers locale catalogs in `I18N_MESSAGE_CATALOG`.
- `packages/client/nuxt.config.ts` defines default i18n runtime config (`NUXT_PUBLIC_I18N_*`).
- Locale files follow the typed schema in `packages/client/locales/en-US.ts`.

App settings also store a locale preference in `settings.language` using the same supported locales:

- `en-US`
- `es-ES`
- `fr-FR`
- `ja-JP`

Default settings language is `en-US`, aligned with `DEFAULT_APP_LANGUAGE`.

Locale resolution order:

1. Saved cookie locale (from `NUXT_PUBLIC_I18N_LOCALE_COOKIE_KEY`).
2. `accept-language` header variants.
3. Browser locale.
4. Configured fallback locale.

To add a new language:

1. Add a new catalog file under `packages/client/locales`.
2. Register it in `I18N_MESSAGE_CATALOG`.
3. Add the locale to `NUXT_PUBLIC_I18N_SUPPORTED_LOCALES` at runtime (or environment variable).
4. Add matching preference/voice mapping where required.

## 4) Bun automation subsystem

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
       Playwright Chromium is installed.
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
4. `rpa-runner.ts` starts the Bun automation executable with `Bun.spawn`.
5. Request payload is sent as JSON on `stdin`.
6. The Bun/TypeScript script executes Playwright RPA operations (navigation, field population, clicks, screenshot).
7. The script prints structured NDJSON/JSON protocol output for the server to parse.
8. `rpa-runner.ts` parses and persists result, then updates the run status.

### 4.2 Required script contract

Automation scripts must read JSON from `stdin`, produce protocol-compliant JSON/NDJSON on `stdout`, and exit non-zero on hard failure.

**Input payload:**

```json
{
  "jobUrl": "https://example.com/job/application",
  "resume": {
    "personalInfo": {
      "fullName": "Player One",
      "email": "player@example.com",
      "phone": "+1 555 0100",
      "location": "Remote"
    },
    "education": ["..."],
    "experience": ["..."],
    "skills": ["..."]
  },
  "coverLetter": {
    "company": "Acme",
    "position": "Senior Game Designer",
    "content": {}
  },
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
  "screenshots": ["step-01.png", "step-02.png"],
  "steps": [
    { "action": "navigate", "status": "ok" },
    { "action": "fill_full_name", "status": "ok" },
    { "action": "submit", "status": "ok" }
  ]
}
```

Screenshot names in `screenshots` are relative filenames. The client should request image bytes through:

```text
GET /api/automation/screenshots/:runId/:index
```

**Failure response:**

```json
{
  "success": false,
  "error": "No matching submit button",
  "screenshots": [],
  "steps": [{ "action": "click_submit", "status": "error" }]
}
```

### 4.3 Bun automation runtime

The automation/runtime package now lives in `packages/scraper` as a Bun workspace package:

| Script | Purpose |
|--------|---------|
| `src/scripts/job-apply.ts` | Automates job application form submission with Playwright |
| `src/scripts/scraper-hitmarker.ts` | Scrapes jobs from Hitmarker |
| `src/scripts/scraper-grackle.ts` | Scrapes jobs from GrackleHQ |
| `src/scripts/scraper-workwithindies.ts` | Scrapes jobs from Work With Indies |
| `src/scripts/scraper-remotegamejobs.ts` | Scrapes jobs from RemoteGameJobs |
| `src/scripts/scraper-gamesjobsdirect.ts` | Scrapes jobs from GamesJobsDirect |
| `src/scripts/scraper-pocketgamer.ts` | Scrapes jobs from PocketGamer.biz |
| `src/scripts/studio-scraper.ts` | Emits the curated studio directory dataset |

The server resolves stable script IDs (for example `job-apply` and `scraper-hitmarker`) through the shared registry and launches them with `Bun.spawn([process.execPath, scriptPath], ...)`.

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
     |  | Greenhouse| |      registry normalizes provider behavior
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
| `services/jobs/providers/provider-settings.ts` | Settings-backed provider configuration for known company board URLs |
| `providers/gaming-providers.ts` | Game-industry-specific board aggregation |

The default provider set includes Greenhouse, Lever, Hitmarker, GrackleHQ, Work With Indies, RemoteGameJobs, GamesJobsDirect, PocketGamer.biz, plus configured SmartRecruiters/Workday/Ashby company boards.

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

For a beginner-friendly Ollama walkthrough, see [docs/LOCAL_AI_SETUP.md](docs/LOCAL_AI_SETUP.md).
Official Ollama references:

- [Ollama Download](https://ollama.com/download/)
- [Ollama Quickstart](https://docs.ollama.com/quickstart)

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

## 8) First-Time Setup (Beginner Path)

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

This section is the canonical first-run path for new developers. It starts from a fresh clone and ends with a fully running stack with validation checks.

### 8.1 What happens during first setup

1. Required tool checks (`bun`, `git`, optional Chrome/Chromium).
2. Dependency installation across workspace packages.
3. Playwright browser install for the Bun automation runtime.
4. `.env` creation from `.env.example` if missing.
5. SQLite schema generation and push (`db:generate`, `db:push`).
6. Optional verification (`typecheck`, `lint`, `test`).

### 8.2 Prerequisites

| Required           | Purpose                                |
|--------------------|----------------------------------------|
| Bun (>=1.3.10)    | Runtime, package manager, test runner  |
| Git                | Source control                         |
| Rust + Cargo       | Desktop installer builds (Tauri)       |

Optional: `curl`, `jq` for diagnostics. At least one AI provider API key for AI features. Playwright bundles its own Chromium.

Chrome/Chromium executable names checked by setup scripts:
- macOS/Linux: `google-chrome`, `chromium`, `chromium-browser`, `/Applications/Google Chrome.app`
- Windows: `chrome.exe` under `%ProgramFiles%`, `%ProgramFiles(x86)%`, or `%LOCALAPPDATA%`

#### 8.2.1 Installables (OS package commands)

Use one command per tool based on your platform. Bun is pinned in this repo to the 1.3.10 baseline (`bun@1.3.10` in `package.json`):

| Tool | macOS (Homebrew) | Ubuntu / Debian | Windows (winget) |
|------|-------------------|------------------|------------------|
| Bun (from `packageManager`) | `brew install oven-sh/bun/bun` | `curl -fsSL https://bun.sh/install \| bash` | `winget install --id Oven-sh.Bun -e` |
| Git | `brew install git` | `sudo apt-get update && sudo apt-get install -y git` | `winget install --id Git.Git -e` |
| Rust | `brew install rustup-init && rustup-init` | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` | `winget install --id Rustlang.Rustup -e` |

If your Linux distro does not ship `chromium-browser`, install `google-chrome-stable` from Google's official package repository.

Read Bun baseline from the workspace manifest when selecting an installer:

```bash
bun pm pkg get packageManager
# -> "bun@1.3.10"
```

```powershell
bun pm pkg get packageManager
# -> "bun@1.3.10"
```

### 8.3 Prepare your workspace

```bash
git clone https://github.com/d4551/baobuildbuddy.git
cd baobuildbuddy
```

If you already have a checked-out copy, start at `git pull` and continue with section 8.4.

### 8.4 Automated setup (recommended)

One command handles dependency install, Playwright browser install, database setup, and verification:

**macOS / Linux:**
```bash
bash scripts/setup.sh
```

**Windows (PowerShell):**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

Expected flow and outputs:
1. The script prints the OS and architecture.
2. `bun install` completes without errors.
3. `bun run automation:browsers:install` installs Playwright Chromium unless browser installation is skipped.
4. `.env` is created from `.env.example` if missing.
5. Database setup runs successfully.
6. Type/lint/test checks pass (unless checks are skipped).
7. Optional build runs when `--include-build` / `-IncludeBuild` is set.
8. Optional desktop build runs when `--include-desktop-build` / `-IncludeDesktopBuild` is set.

### 8.5 Setup script options

| Flag | Bash | PowerShell | Effect |
|------|------|-----------|--------|
| Skip verification | `--skip-checks` | `-SkipChecks` | Skip typecheck, lint, and test runs |
| Skip browser install | `--skip-browser-install` | `-SkipBrowserInstall` | Skip Playwright Chromium installation |
| Include build | `--include-build` | `-IncludeBuild` | Run `bun run build` after setup checks |
| Include desktop build | `--include-desktop-build` | `-IncludeDesktopBuild` | Run Tauri desktop build after setup checks/build |
| Help | `--help` | `-Help` | Print usage and exit |

### 8.6 Manual setup (for controlled environments)

If you prefer manual control, follow these steps:

```bash
bun install
bun run automation:browsers:install
```

**Environment file:**

```bash
cp .env.example .env
```

Edit `.env` before first run:
1. Keep `NUXT_PUBLIC_API_BASE=/` and `NUXT_PUBLIC_WS_BASE=/` only if you override stack URLs manually; `bun run dev` now resolves both through `scripts/dev-stack.ts`.
2. Set `BAO_DISABLE_AUTH=true` only for local development without API-key flow.
3. Add provider keys only if you are using those providers.
4. Set `LOCAL_MODEL_ENDPOINT` and `LOCAL_MODEL_NAME` only if using local inference.
5. Update `DB_PATH` if you want a custom database location.

Then bootstrap the database:

```bash
bun run db:generate
bun run db:push
```

Optional sanity checks:

```bash
bun run scripts/validate-ascii-geometry.ts README.md docs/STARTER_GUIDE.md
bun run typecheck
bun run lint
bun run test
```

If any checks fail, fix issues before opening the UI.

### 8.7 First launch checklist

```bash
curl -fsS http://localhost:3000/api/health
curl -fsS http://localhost:3000/api/auth/status
curl -fsS http://localhost:3000/api/jobs?limit=1 | head
```

If all three requests respond, the API stack is reachable from defaults.

### 8.8 Source-of-truth config files

| File                                     | Governs                        |
|------------------------------------------|-------------------------------|
| `packages/server/src/config/env.ts`      | Server environment validation  |
| `packages/server/src/config/paths.ts`    | File system paths used by server |
| `packages/client/nuxt.config.ts`         | Client runtime config, proxy, modules |
| `packages/scraper/package.json`          | Bun automation runtime dependencies |
| `.env.example`                           | Template for all env vars      |

### 8.9 Desktop (Tauri) installer path

```text
     ______________________
    /|                     |\     Desktop packaging uses a native shell and
   / |        TAURI        | \    no separate Electron runtime.
  /__|_____________________|\    It launches the existing Bun stack and opens
  |  |                     |  it in a desktop window.
  |__|  .-.\           .-. |  This keeps one codebase for web + desktop.
  |  |  |o|           |o| |
  |  |  '-'           '-' |
  |  |_____________________|
  |___________________________|
```

For this repository, Tauri is the best fit for desktop installers because:

1. You already use Bun tooling and `bun run dev` (which now runs `scripts/dev-stack.ts`) for the entire stack.
2. Tauri bundles a tiny native shell around existing web UI.
3. You avoid the duplicate runtime overhead and heavier package size of Electron.

If Electron is a hard requirement (for example, due an internal Electron-specific plugin), use
`bunx electron-builder` only for a separate packaging target.
This is not the default path because it adds Chromium + Node as a permanent UI runtime dependency.

#### 8.9.1 Prerequisites (desktop)

- Rust + `cargo` (for Tauri binary generation)
- macOS / Linux: `rustup` + system build tools
- Windows: Visual C++ build tools via Visual Studio Build Tools
- Existing Bun workspace prerequisites from section 8.2

Verify Rust toolchain before running desktop builds:

```bash
rustc --version
cargo --version
```

#### 8.9.2 Start desktop wrapper (development mode)

From the repo root:

```bash
bun run dev:desktop
```

This command:

1. Starts `packages/desktop`.
2. Auto-starts `bun run dev` when server/client services are not already running.
3. Opens the app at `http://127.0.0.1:3001` inside a Tauri window.

#### 8.9.3 Build desktop installers

Canonical matching-host release commands:

```bash
bun run release:desktop:macos -- --output-root .desktop-release-artifacts
bun run release:desktop:windows -- --output-root .desktop-release-artifacts
bun run release:desktop:linux-arm64 -- --output-root .desktop-release-artifacts
```

Each command must run on the matching host for its target. The staged native artifacts are written under `.desktop-release-artifacts/<target>`.

Canonical release assembly:

```bash
bun run release:refresh:all-os
```

This command assembles previously produced matching-host artifacts into `packages/desktop/releases/{macos,linux,windows}`, writes `packages/desktop/releases/provenance.json`, regenerates `packages/desktop/releases/sha256.txt`, and runs `bun run verify:desktop-releases`.

Single-target local desktop build (current host target only):

```bash
bun run build:desktop
```

`bun run build:desktop` uses the repo-local `@tauri-apps/cli` package through Bun, so it does not require a separately installed global `cargo tauri` command for normal host builds. It no longer falls back to non-standard cross-target recovery logic. On macOS it follows the Tauri 2 split build flow: `bun tauri build --no-bundle`, then `bun tauri bundle --bundles app,dmg`.

For deterministic macOS DMG packaging in shells with non-UTF8 locale defaults:

```bash
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 bun run build:desktop
```

Native build outputs are generated under `packages/desktop/src-tauri/target/release/bundle`. Canonical assembled release artifacts live under:

- `packages/desktop/releases/macos`
- `packages/desktop/releases/linux`
- `packages/desktop/releases/windows`

Matching-host jobs should then be assembled with `bun run release:refresh:all-os`. Current verified artifacts are cataloged in `packages/desktop/releases/README.md` and checksummed in `packages/desktop/releases/sha256.txt`.

Release checksums are generated in `packages/desktop/releases/sha256.txt`.

Run `bun run verify:desktop-releases` to re-check desktop version alignment, required Tauri icon assets, staged artifact names, platform bundle signatures, DMG integrity, and checksum matches.

Install locally after building:

- macOS: open the generated `.dmg` and drag the `.app` into `Applications`
- Linux: install `.deb` or `.rpm` with your package manager
- Windows: run the generated `-setup.exe` installer, or extract `-portable.zip` and keep the bundled `gen` directory next to the executable

Windows desktop artifacts are `x64` only. 32-bit Windows is not supported by the packaged runtime. The portable archive includes the packaged `gen/runtime` tree plus the bundled WebView2 bootstrapper so first launch can recover a missing WebView2 runtime instead of failing silently.

If desktop build fails with `failed to run 'cargo metadata'`, install Rust using:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Matching-host requirements from Tauri build contracts:
1. **Tauri CLI**: host and release builds use the repo-local `@tauri-apps/cli` package through Bun (`bun tauri build` / `bun tauri bundle`), so a separate global `cargo tauri` install is not required for the normal release workflow.
2. **macOS** (`aarch64-apple-darwin`): run the native split bundle flow on macOS.
3. **Windows** (`x86_64-pc-windows-msvc`): run the native Windows bundle flow on Windows for the NSIS installer and portable archive.
4. **Linux** (`aarch64-unknown-linux-gnu`): run the native Linux ARM64 bundle flow on a Linux ARM64 host or ARM-emulated CI runner for deb and rpm artifacts.

#### 8.9.4 Environment overrides for desktop

- `BAO_STACK_BOOTSTRAP_COMMAND` — command to execute for the background stack (default `bun`)
- `BAO_STACK_HOST` — host checked for readiness (default `127.0.0.1`)
- `PORT` — API port (default `3000`)
- `CLIENT_PORT` — client port expectation for readiness checks (default `3001`)
- `BAO_DISABLE_AUTH` — pass through to stack startup

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
| `NUXT_PUBLIC_WS_BASE` | WebSocket base URL for chat, interview, and automation |
| `NUXT_PUBLIC_API_PROXY` | Dev proxy target for API server (if unset in development, defaults to `http://localhost:${PORT}`) |
| `NUXT_PUBLIC_QUERY_STALE_TIME_MS` | TanStack Query stale time |
| `NUXT_PUBLIC_QUERY_RETRY_COUNT` | TanStack Query retry budget |
| `NUXT_PUBLIC_QUERY_REFETCH_ON_FOCUS` | Refetch on window focus |
| `NUXT_PUBLIC_I18N_DEFAULT_LOCALE` | Initial locale to load (`en-US` default) |
| `NUXT_PUBLIC_I18N_FALLBACK_LOCALE` | Locale fallback when missing translations are requested |
| `NUXT_PUBLIC_I18N_LOCALE_COOKIE_KEY` | Cookie key for persisted user locale |

> **Do NOT set `NUXT_PUBLIC_I18N_SUPPORTED_LOCALES`** in `.env`. Nuxt runtime config env override replaces the parsed array with a raw string, breaking the i18n plugin. The nuxt.config.ts `parseSupportedLocales()` handles the default.

### 9.3 AI provider keys

At least one AI provider key is required for AI-powered features (chat, interview questions, email response, resume review, cover letter generation). HuggingFace free tier requires a token — create one at https://huggingface.co/settings/tokens.

Keys can also be configured via **Settings > AI Providers** in the UI with test and save buttons.

| Key | Purpose |
|-----|---------|
| `LOCAL_MODEL_ENDPOINT` | Local inference server URL |
| `LOCAL_MODEL_NAME` | Local model identifier |
| `OPENAI_API_KEY` | OpenAI cloud provider |
| `GEMINI_API_KEY` | Google Gemini cloud provider |
| `CLAUDE_API_KEY` | Anthropic Claude cloud provider |
| `HUGGINGFACE_TOKEN` | HuggingFace Inference API (free tier requires token) |

### 9.4 RPA / Automation environment (Playwright)

| Key | Purpose | Default |
|-----|---------|---------|
| `AUTOMATION_STDIO_BUFFER_LIMIT` | Max stdout lines from scraper scripts | `200` (increase to `2000` for large outputs) |
| `AUTOMATION_SCRIPT_TIMEOUT_MS` | Max execution time per automation script | `30000` (30 seconds) |

Install bundled Chromium with `bun run automation:browsers:install`. The setup scripts do this automatically unless `--skip-browser-install` / `-SkipBrowserInstall` is used.

### 9.5 Settings Table Runtime Configuration

Runtime provider tuning for job ingestion is persisted in `settings.automationSettings.jobProviders` and read by:
- `packages/server/src/services/jobs/providers/company-board.ts`
- `packages/server/src/services/jobs/providers/gaming-providers.ts`

Required `jobProviders` keys:
- `providerTimeoutMs`
- `companyBoardResultLimit`
- `gamingBoardResultLimit`
- `unknownLocationLabel`
- `unknownCompanyLabel`
- `hitmarkerApiBaseUrl`
- `hitmarkerDefaultQuery`
- `hitmarkerDefaultLocation`
- `greenhouseApiBaseUrl`
- `greenhouseMaxPages`
- `greenhouseBoards[]` (`board`, `company`, `enabled`)
- `leverApiBaseUrl`
- `leverMaxPages`
- `leverCompanies[]` (`slug`, `company`, `enabled`)
- `companyBoardApiTemplates` (`greenhouse`, `lever`, `recruitee`, `workable`, `ashby`, `smartrecruiters`, `teamtailor`, `workday`)
- `companyBoards[]` (`name`, `token`, `type`, `enabled`, `priority`)
- `gamingPortals[]` (`id`, `name`, `source`, `fallbackUrl`, `enabled`)

`automationSettings.jobProviders` is required for provider execution. The server does not inject runtime provider defaults. Populate this object via `PUT /settings` before running ingestion.

## 10) Start procedures

```text
     _____________
    |  ___  ___  |
    | | 1 || 2 | |      PLAYER SELECT
    | |___||___| |
    |  ___  ___  |      1 = Full stack   (bun run dev / scripts/dev-stack.ts)
    | | 3 || 4 | |      2 = Server only  (bun run dev:server)
    | |___||___| |      3 = Client only  (bun run dev:client)
    |_____________|      4 = Split terminals

     "Press START to begin"
```

### 10.1 Full stack (recommended)

```bash
bun run dev
```

Coordinates server + client via `scripts/dev-stack.ts`:
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
| API server | `http://localhost:3000` (or `SERVER_PORT`) | `PORT` / `SERVER_PORT` |
| Client / UI | `http://localhost:3001` (or `CLIENT_PORT`) | client `nuxt dev` default |
| Client API base | `/` | `NUXT_PUBLIC_API_BASE` |
| Client API proxy target | unset | `NUXT_PUBLIC_API_PROXY` |
| Chat WebSocket | `ws://localhost:3000/api/ws/chat` (or `SERVER_PORT`) | derived from `NUXT_PUBLIC_WS_BASE` |
| Interview WebSocket | `ws://localhost:3000/api/ws/interview` (or `SERVER_PORT`) | derived from `NUXT_PUBLIC_WS_BASE` |
| Automation WebSocket | `ws://localhost:3000/api/ws/automation` (or `SERVER_PORT`) | derived from `NUXT_PUBLIC_WS_BASE` |

### 10.4 All available scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Dev (full) | `bun run dev` | Start server + client via `scripts/dev-stack.ts` |
| Dev (stack) | `bun run dev:stack` | Alias to `scripts/dev-stack.ts` |
| Dev server | `bun run dev:server` | Start API server only |
| Dev client | `bun run dev:client` | Start Nuxt client only |
| Dev desktop | `bun run dev:desktop` | Start Tauri desktop wrapper (auto-starts server + client) |
| Build | `bun run build` | Build server and client packages |
| Build (macOS) | `bun run build:macos` | macOS entrypoint for CI/local build |
| Build (Linux) | `bun run build:linux` | Linux entrypoint for CI/local build |
| Build (Windows) | `bun run build:windows` | Windows entrypoint for CI/local build |
| Build desktop | `bun run build:desktop` | Build Tauri installer artifacts for the current host only |
| Build desktop (debug) | `bun run build:desktop:debug` | Build Tauri debug installer artifacts |
| Release desktop (macOS) | `bun run release:desktop:macos` | Produce native macOS release artifacts under `.desktop-release-artifacts/macos` |
| Release desktop (Windows) | `bun run release:desktop:windows` | Produce native Windows release artifacts under `.desktop-release-artifacts/windows` |
| Release desktop (Linux ARM64) | `bun run release:desktop:linux-arm64` | Produce native Linux ARM64 release artifacts under `.desktop-release-artifacts/linux` |
| Refresh desktop releases (all OS) | `bun run release:refresh:all-os` | Assemble matching-host artifacts into `packages/desktop/releases`, regenerate checksums, and verify provenance |
| Refresh desktop releases (all OS, fast) | `bun run release:refresh:all-os:fast` | Alias of the canonical release assembly command |
| Verify SSR pages | `bun run verify:pages` | Validate localized routes return SSR HTML with `<title>`, `<h1>`, and `<main>` |
| Server API type contract | `bun run --filter '@bao/server' build:types` | Generate `packages/server/dist-types` declarations used by client typecheck |
| Format | `bun run format` | Apply Biome formatter |
| Format check | `bun run format:check` | Verify formatter output |
| UI ARIA contract checks | `bun run validate:aria` | Enforce interactive labeling and dialog semantics (`aria-modal`, modal labeling) |
| UI layout token guardrail | `bun run validate:ui-layout-tokens` | Block hardcoded core-page width/grid literals and modal size literals outside shared primitives |
| UI accessibility + token checks | `bun run validate:ui` | Enforce WCAG contrast pairs and block hardcoded UI colors in client source |
| Core page SEO metadata checks | `bun run validate:page-seo` | Require SSR `useServerSeoMeta` with `title` + `description` on core pages and reject static metadata literals |
| UI i18n coverage checks | `bun run validate:i18n-ui` | Reject static template copy/attributes and missing `t('...')` keys |
| Official framework docs check | `bun run audit:official-llms` | Validate official Bun/Nuxt/Elysia `llms.txt` sources are reachable and contain required guidance markers |
| No try/catch validation | `bun run validate:no-try-catch` | Enforce repository-wide no-`try/catch` policy in source files |
| Typecheck | `bun run typecheck` | TypeScript type checking across all packages |
| Test | `bun run test` | Run test suites for server and client |
| Lint | `bun run lint` | `validate:no-try-catch` + SEO/i18n/ARIA/layout/UI guardrails + typed lint + Biome + client ESLint |
| Lint fix | `bun run lint:fix` | Guardrails + typed lint fix + Biome/client ESLint autofix while preserving detection policy |
| DB generate | `bun run db:generate` | Generate Drizzle migration files |
| DB push | `bun run db:push` | Push schema changes to SQLite |
| DB studio | `bun run db:studio` | Open Drizzle Studio GUI for database inspection |
| ASCII validation | `bun run scripts/validate-ascii-geometry.ts README.md` | Verify ASCII-art geometry constraints |

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
bun run format:check
bun run validate:no-try-catch
bun run validate:page-seo
bun run validate:i18n-ui
bun run validate:aria
bun run validate:ui-layout-tokens
bun run validate:ui
bun run verify:pages
bun run typecheck
bun run lint
bun run test
```

Client-side runtime tests for composables use `*.nuxt.spec.ts` and initialize Nuxt with a package-root `rootDir` so alias resolution stays deterministic in workspace runs. Keep those tests explicit about external dependencies (`useApi`) and avoid relying on unresolved auto-import side effects.
`bun run typecheck` generates server API declarations (`packages/server/dist-types`) before running package typechecks, so Nuxt client typechecking consumes contract types instead of server implementation internals.
`bun run lint` includes `validate:no-try-catch`, `validate:page-seo`, and `validate:i18n-ui`, which fail when `try/catch` blocks, static core-page metadata, or static non-localized UI copy appear in source. Error handling should follow Elysia/Eden typed response contracts and shared settled-result helpers.
If `3001` is occupied locally, run page verification against an alternate UI port via `VERIFY_HOST` and `VERIFY_PORT`:

```bash
PORT=4105 bun run --filter '@bao/client' preview
VERIFY_HOST=127.0.0.1 VERIFY_PORT=4105 bun run verify:pages
```
Server-side tests run with deterministic in-process AI behavior (`BAO_TEST_MODE=1`), so test execution does not depend on external AI providers or network availability.
Rate-limited route groups use header-aware client-key generation (`x-forwarded-for` / `cf-connecting-ip` / `x-real-ip` fallback), which keeps behavior deterministic in local tests and proxy deployments.
For a non-technical runbook with copy/paste steps only, use `docs/STARTER_GUIDE.md`.

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
curl -fsS "${API_BASE}/api/stats/dashboard" | head
```

### 11.5 Route health matrix

| Endpoint | Purpose | Expected response |
|----------|---------|-------------------|
| `/api/health` | Readiness probe | JSON with `status` and `database` fields |
| `/api/auth/status` | Auth state | Whether auth system is initialized |
| `/api/studios` | Studio data | Studio list structure |
| `/api/jobs` | Job search | Paginated job list |
| `/api/resumes` | Resume CRUD | Resume list or creation response |
| `/api/cover-letters` | Cover letter CRUD | Cover letter list or creation response |
| `/api/portfolio` | Portfolio CRUD | Portfolio project list |
| `/api/interview/sessions` | Interview sessions | Interview history |
| `/api/skills/mappings` | Skill mapping CRUD | List, create, update, and delete mapped skills (`DELETE` returns `{ message, id }`) |
| `/api/skills/pathways` | Career pathways | Ranked pathways by match score |
| `/api/skills/readiness` | Career readiness | Readiness score and category breakdown |
| `/api/skills/ai-analyze` | Skill analysis | Suggested mappings and recommendations |
| `/api/automation/job-apply` | Start job application automation | `RpaRunExecutionEnvelope` (status `running`) |
| `/api/automation/job-apply/schedule` | Schedule job application automation | `RpaRunExecutionEnvelope` (status `pending`, `input.schedule.runAt`) |
| `/api/automation/email-response` | Generate AI email response | `{ runId, status: "success", reply, provider, model }` |
| `/api/automation/email-response/schedule` | Schedule AI email response automation | `RpaRunExecutionEnvelope` (status `pending`, `input.schedule.runAt`) |
| `/api/automation/scrape` | Run scraper automation now | `RpaRunExecutionEnvelope` (status `success` or `error`, `input.target`, `output.scraped`) |
| `/api/automation/scrape/schedule` | Schedule scraper automation | `RpaRunExecutionEnvelope` (status `pending`, `input.target`, `input.schedule.runAt`) |
| `/api/automation/capabilities` | Audit implemented RPA capabilities | Capability summary with configuration/readiness rows |
| `/api/gamification/progress` | XP and level progression | Gamification progress payload |
| `/api/automation/runs` | Automation audit | Persisted run records |
| `/api/automation/runs/:id` | Run detail | Single run snapshot |
| `/api/automation/screenshots/:runId/:index` | Run screenshot bytes | PNG/JPEG/WebP image stream |
| `/api/stats/dashboard` | Usage statistics dashboard | Aggregate stat payload |
| `/api/stats/weekly` | Weekly activity stats | Weekly metrics payload |
| `/api/stats/career` | Career progress stats | Career progression payload |
| `/api/ws/chat` | AI chat | WebSocket upgrade handshake |
| `/api/ws/interview` | Mock interview | WebSocket upgrade handshake |
| `/api/ws/automation` | Automation run progress events | WebSocket subscribe/unsubscribe event stream |

Automation route errors use the typed envelope:

```json
{
  "error": {
    "code": "OUTPUT_VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

### 11.6 UI wiring and accessibility verification

```bash
bun run validate:page-seo
bun run validate:i18n-ui
bun run validate:aria
bun run validate:ui-layout-tokens
bun run validate:ui
bun run --filter '@bao/client' lint
```

The UI verification pipeline enforces:

- WCAG AA color contrast for configured daisyUI theme pairs (`*-content` on semantic backgrounds)
- no hardcoded UI colors in client source (hex/rgb/hsl/oklch literals, Tailwind palette classes, arbitrary color literals)
- no static user-facing template copy or static ARIA/placeholder/title attributes in Vue templates
- core pages define SSR `useServerSeoMeta` with localized `title` and `description`
- all statically referenced `t('...')` keys resolve in the base `en-US` locale schema
- form controls are programmatically labeled (`label` + `for`, nesting, or ARIA label)
- clickable UI surfaces are keyboard-operable and focusable
- anchor and icon-only controls expose accessible names
- modal surfaces are rendered through `AppModalFrame` with required `aria-modal` and `aria-labelledby`
- core pages use tokenized layout primitives (`PageScaffold`/`SectionGrid`) rather than ad hoc width/grid literals
- locale menu semantics use dropdown/menu patterns (`role="menu"` + `menuitemradio`) instead of listbox patterns
- unsupported ARIA usage is rejected

```mermaid
flowchart LR
  Templates["Vue templates + shared UI primitives"] --> Alignment["bun run validate:alignment"]
  Alignment --> UIValidate["validate:page-seo + validate:i18n-ui + validate:aria + validate:ui"]
  UIValidate --> UIState{"Layout, daisyUI, and accessibility checks pass?"}
  UIState -->|No| UIFixes["Fix theme token pairs or remove hardcoded colors"]
  UIFixes --> Alignment
  UIState -->|Yes| A11yLint["Client ESLint + vuejs-accessibility"]
  A11yLint --> LintState{"A11y errors = 0?"}
  LintState -->|No| Fixes["Fix labels, keyboard handlers, control semantics"]
  Fixes --> A11yLint
  LintState -->|Yes| BrowserQA["Manual browser QA: tab order, Enter/Space, CTA wiring"]
  BrowserQA --> Ready["Release-ready UI"]
```

Manual browser checklist for final sign-off:

1. Verify primary CTAs on each page trigger expected state transitions and API calls.
2. Verify keyboard-only navigation (`Tab`, `Shift+Tab`, `Enter`, `Space`) works on cards, menus, and dialogs.
3. Verify icon-only controls have accessible names and visible focus states.
4. Verify form submission and validation states are reachable without pointer input.

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
    |   |   |   +-- routes/         API route modules with route-level tests
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
    |   |   |   |   +-- automation-screenshots.routes.ts
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
    |   |   |   |   +-- schema/     Drizzle table modules + schema-modules.ts
    |   |   |   |   |   +-- user.ts, auth.ts, resumes.ts, cover-letters.ts
    |   |   |   |   |   +-- portfolios.ts, interviews.ts, studios.ts, jobs.ts
    |   |   |   |   |   +-- skill-mappings.ts, gamification.ts, settings.ts
    |   |   |   |   |   +-- automation-runs.ts, chat-history.ts
    |   |   |   |   +-- migrations/
    |   |   |   |   +-- seed/       Initial gaming data and studio records
    |   |   |   |   +-- client.ts, init.ts
    |   |   |   +-- middleware/     auth.ts, error-handler.ts, logger.ts
    |   |   |   +-- ws/             chat.ws.ts, interview.ws.ts, automation.ws.ts
    |   |   |   +-- config/         env.ts (validation), paths.ts
    |   +-- client/                 Nuxt 4 SSR application
    |   |   +-- pages/              SSR routes for setup, jobs, studios, interview, AI, automation, docs
    |   |   +-- components/         Shared UI and feature Vue components
    |   |   |   +-- ai/             AIChatBubble, AIStreamingResponse, BaoFairy
    |   |   |   +-- resume/         ResumePreview, ExperienceList, PersonalInfoForm,
    |   |   |   |                   SkillsEditor, EducationList
    |   |   |   +-- jobs/           JobCard, JobMatchScore, JobSearchBar, JobFilters
    |   |   |   +-- interview/      InterviewChat, ScoreCard, StudioSelector
    |   |   |   +-- gamification/   DailyChallenge, XPBar, AchievementBadge
    |   |   |   +-- portfolio/      PortfolioGrid, ProjectCard
    |   |   |   +-- layout/         AppNavbar, AppSidebar, AppDock
    |   |   |   +-- ui/             ConfirmDialog, LoadingSkeleton
    |   |   +-- composables/        Typed data, websocket, speech, and view-state composables
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
    |   |   |   +-- types/          Shared domain types
    |   |   |   |   +-- user, ai, resume, interview, jobs, cover-letter
    |   |   |   |   +-- portfolio, studio, gamification, skill-mapping
    |   |   |   |   +-- settings, search
    |   |   |   +-- schemas/        Shared validation and protocol schemas
    |   |   |   |   +-- user.schema, resume.schema, job.schema
    |   |   |   |   +-- interview.schema, settings.schema
    |   |   |   |   +-- portfolio.schema, skill-mapping.schema
    |   |   |   +-- constants/      Runtime, API, automation, AI, and UI contract constants
    |   |   |   +-- utils/          Shared parsing, validation, and formatting helpers
    |   |   |   +-- public-api.ts   Package export surface
    |   +-- scraper/                Bun automation runtime
    |       +-- src/scripts/        Bun/TS automation entrypoints
    |       +-- src/providers/      Playwright scraper extractors
    |       +-- src/job-apply/      ATS adapter runtime
    |       +-- src/runtime/        IO/protocol/browser helpers
    |       +-- package.json
    +-- scripts/
    |   +-- setup.sh                    Automated setup for macOS / Linux
    |   +-- setup.ps1                   Automated setup for Windows (PowerShell)
    |   +-- validate-ascii-geometry.ts  ASCII art geometry checker
    |   +-- validate-no-try-catch.ts    Repository no-try/catch policy validator
    |   +-- validate-ui-accessibility.ts WCAG + hardcoded-color drift validator
    +-- docs/
    |   +-- STARTER_GUIDE.md            Non-technical getting-started guide
    |   +-- AUTOMATION.md               Automation contracts and runtime behavior
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
      | |  CORE ROUTES   |   |      Navigate the SSR app across
      | |  + FEATURES    |   |      the main product surfaces.
      | |_______________|   |
      |_____________________|
```

| Feature area | Pages | Key composables |
|-------------|-------|-----------------|
| **Home, Setup & Docs** | `index.vue`, `setup.vue`, `settings.vue`, `docs/api.vue` | `useAuth`, `useSettings`, `useTheme` |
| **Resume** | `resume/index`, `resume/build`, `resume/preview` | `useResume` |
| **Cover Letter** | `cover-letter/index`, `cover-letter/[id]` | `useCoverLetter` |
| **Portfolio** | `portfolio/index`, `portfolio/preview` | `usePortfolio` |
| **Interview** | `interview/index`, `interview/session`, `interview/history` | `useInterview`, `useWebSocket` |
| **AI Chat** | `ai/dashboard`, `ai/chat` | `useAI`, `useChatVoice`, `useSpeech`, `useTTS`, `useSTT` |
| **Studios** | `studios/index`, `studios/[id]`, `studios/analytics` | `useStudio` |
| **Jobs** | `jobs/index`, `jobs/[id]` | `useJobs`, `useSearch` |
| **Automation** | `automation/index`, `automation/job-apply`, `automation/email`, `automation/scraper`, `automation/runs`, `automation/runs/[id]` | `useAutomation` |
| **Skills & XP** | `skills/index`, `skills/pathways`, `gamification.vue` | `useSkillMapping`, `useGamification` |

### UI implementation standards

- SSR-first data loading by default; composables for client-side interactivity.
- `useFetch` for route/page-level data, `$fetch` for user-triggered actions.
- Async state (`idle`, `pending`, `success`, `error`) mapped to daisyUI components (`loading`, `alert`, `stat`, `card`, `table`).
- The Elysia Eden client (`plugins/eden.ts`) provides end-to-end type safety between Nuxt and the API.
- Dynamic API endpoints use Eden function-param invocation (for example `api.resumes({ id }).get()`), not string-index access.
- API payloads are normalized in `packages/client/composables/api-normalizers.ts` before binding to shared domain state.
- Error handling follows Elysia centralized `onError` middleware and Eden `{ data, error }` branching; source-level `try/catch` is blocked by `validate:no-try-catch`.
- TanStack Vue Query (`plugins/vue-query.ts`) manages cache, stale time, and retry for all API calls.

### daisyUI component references

- https://daisyui.com/components/button/
- https://daisyui.com/components/card/
- https://daisyui.com/components/stats/
- https://daisyui.com/components/table/
- https://daisyui.com/components/alert/
- https://daisyui.com/components/loading/

### Elysia / Eden references

- https://elysiajs.com/essential/life-cycle#on-error
- https://elysiajs.com/eden/treaty/response

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
| Proxy configured? | Set `NUXT_PUBLIC_API_PROXY` explicitly, or ensure server is reachable at `http://localhost:${PORT}` (dev default proxy target) |
| CORS issue? | Ensure `CORS_ORIGINS` includes client origin |
| Server running? | `curl http://localhost:3000/api/health` |

### 15.3 WebSocket handshake fails

| Check | Command / action |
|-------|-----------------|
| WS base correct? | Verify `NUXT_PUBLIC_WS_BASE` |
| Routes registered? | Server logs should show `/api/ws/chat`, `/api/ws/interview`, and `/api/ws/automation` |
| Firewall blocking? | Test with `wscat -c ws://localhost:3000/api/ws/chat` |

### 15.4 RPA automation fails

| Check | Command / action |
|-------|-----------------|
| Playwright browser installed? | `bun run automation:browsers:install` |
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
| Network access? | Verify outbound HTTP access to provider targets (Greenhouse, Lever, Hitmarker, company boards, gaming boards) |
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
- [ ] `bun run automation:browsers:install` completed successfully
- [ ] `.env` populated from `.env.example` with environment-specific values
- [ ] `bun run typecheck` passes
- [ ] `bun run validate:no-try-catch` passes
- [ ] `bun run validate:page-seo` passes
- [ ] `bun run validate:i18n-ui` passes
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
- [ ] `/api/ws/automation` WebSocket handshake succeeds
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
  |                  BaoBuildBuddy is ready.                 |
  |                                                            |
  |               "Thank you Mario!                            |
  |                But our princess is in                       |
  |                another castle."                            |
  |                                                            |
  |               Just kidding. You're done.                   |
  |                                                            |
  +============================================================+
```
