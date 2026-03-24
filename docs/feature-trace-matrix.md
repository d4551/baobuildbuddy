# Feature Trace Matrix (Route → Service/DB → UI → Tests)

Canonical stack definitions (Drizzle, Nuxt, Eden—not Prisma/htmx): [`STACK-CONTRACT.md`](./STACK-CONTRACT.md).

This matrix is the current traceability artifact for the last full audit pass.

## Layouts and shared UI

| Kind | Location | Role |
|------|----------|------|
| Authenticated shell | `packages/client/layouts/default.vue` | daisyUI `drawer`, navbar, main landmark, sidebar host, toasts |
| Auth / onboarding shell | `packages/client/layouts/auth-shell.vue` | Centered `card` on `bg-base-200` (`AUTH_SHELL_OUTER_CLASS` + shared `card` markup; main rail uses `SHELL_MAIN_INNER_CLASS` in `default.vue`) |
| Page width / spacing | `packages/client/components/ui/PageScaffold.vue` + `packages/client/constants/ui-layout.ts` | Canonical `UiWidthToken` / `UiSpacingToken` (validators forbid ad-hoc widths on core pages) |
| Section grids | `packages/client/components/ui/SectionGrid.vue` | `UiGridToken` including `bento` (gap-6 dashboard grids) |
| Headers / empty / loading | `PageHeaderBlock`, `EmptyState`, `LoadingSkeleton`, `AppPagination`, `ConfirmDialog`, `ToastContainer` | DRY patterns for list and form pages |
| App version (shell) | `APP_SEMVER` in `@bao/shared` (`packages/shared/src/constants/app-version.ts`) | Sidebar footer via `layout.shell.*` i18n keys |

## Client pages (feature entry)

| Area | Pages |
|------|--------|
| Dashboard | `packages/client/pages/index.vue` |
| Setup | `packages/client/pages/setup.vue` |
| Jobs | `packages/client/pages/jobs/index.vue`, `packages/client/pages/jobs/[id].vue` |
| Resume | `packages/client/pages/resume/index.vue`, `build.vue`, `preview.vue` |
| Cover letter | `packages/client/pages/cover-letter/index.vue`, `[id].vue` |
| Portfolio | `packages/client/pages/portfolio/index.vue`, `preview.vue` |
| Studios | `packages/client/pages/studios/index.vue`, `[id].vue`, `analytics.vue` |
| Interview | `packages/client/pages/interview/index.vue`, `session.vue`, `history.vue` |
| Skills | `packages/client/pages/skills/index.vue`, `pathways.vue` |
| Automation | `packages/client/pages/automation/index.vue`, `email.vue`, `job-apply.vue`, `scraper.vue`, `runs.vue`, `runs/[id].vue` |
| AI | `packages/client/pages/ai/chat.vue`, `ai/dashboard.vue` |
| Settings | `packages/client/pages/settings.vue` |
| Gamification | `packages/client/pages/gamification.vue` |
| Docs | `packages/client/pages/docs/api.vue` |

## Stack note

The client is **Nuxt 4 + Vue + Eden Treaty**; the API is **Elysia + Drizzle + SQLite (`bun:sqlite`)**. There is **no htmx** and **no Prisma** in this repository—async UI states use Vue (`useAsyncData`, composables) rather than `hx-*` swaps.

## Runtime imports (`node:` vs Bun)

The server and tests use `node:fs`, `node:path`, and related modules where Bun provides a compatible implementation. There is **no requirement** to remove these for correctness; prefer **Bun-native** APIs only when they simplify code **and** tests still pass (see `scripts/validate-no-try-catch.ts` and existing service patterns).

| Route Group | Data Service Layer | DB/Schema Touchpoints | UI Entry Points | Test Coverage |
|---|---|---|---|---|
| `/api/auth` (`auth.routes.ts`) | direct SQLite auth repository usage | `auth` | Settings/setup flows (`packages/client/pages/settings.vue`, `packages/client/pages/setup.vue`) | `packages/server/src/routes/core-routes.test.ts` |
| `/api/search` (`search.routes.ts`) | `searchService` | aggregated from jobs/studios/skills/resumes tables | search UX is embedded in multiple pages (jobs/jobs/[id]/studios/interview/ai entry surfaces) | `packages/server/src/routes/core-routes.test.ts` |
| `/api/user` (`user.routes.ts`) | direct profile repository usage | `userProfile` | profile controls on `packages/client/pages/settings.vue` and user-related setup forms | `packages/server/src/routes/core-routes.test.ts` |
| `/api/jobs` (`jobs.routes.ts`) | `JobAggregator`, `AIService`, `gamificationService` | `jobs`, `savedJobs`, `applications`, `settings` | `packages/client/pages/jobs/index.vue`, `packages/client/pages/jobs/[id].vue` | `packages/server/src/routes/jobs.test.ts` |
| `/api/studios` (`studio.routes.ts`) | direct repository access + optional `AIService` integrations | `studios`, `savedJobs` | `packages/client/pages/studios/index.vue`, `packages/client/pages/studios/[id].vue` | `packages/server/src/routes/studio.test.ts` |
| `/api/resumes` (`resume.routes.ts`) | `resumeService`, `cvQuestionnaireService`, `AIService`, `exportService`, `gamificationService` | `resumes`, `settings`, AI chat/prompt inputs | `packages/client/pages/resume/index.vue`, `packages/client/pages/resume/build.vue`, `packages/client/pages/resume/preview.vue` | `packages/server/src/routes/resume.test.ts` |
| `/api/portfolio` (`portfolio.routes.ts`) | `portfolioService`, `exportService`, `gamificationService` | `portfolios`, `portfolio_projects` | `packages/client/pages/portfolio/index.vue`, `packages/client/pages/portfolio/preview.vue` | `packages/server/src/routes/portfolio.test.ts` |
| `/api/cover-letters` (`cover-letter.routes.ts`) | direct repository ops, `AIService`, `exportService` | `coverLetters`, `resumes`, `settings`, `userProfile` | `packages/client/pages/cover-letter/index.vue`, `packages/client/pages/cover-letter/[id].vue` | `packages/server/src/routes/cover-letter.test.ts` |
| `/api/interview` (`interview.routes.ts`) | `interviewService` | `interview_sessions` | `packages/client/pages/interview/index.vue`, `packages/client/pages/interview/session.vue`, `packages/client/pages/interview/history.vue` | `packages/server/src/interview.test.ts` (server package root, not under `routes/`) |
| `/api/automation` (`automation.routes.ts`) | `applicationAutomationService`, `emailDeliveryService`, logger helpers, rate limiting + screenshot mapping | `automationRuns` | `packages/client/pages/automation/index.vue`, `packages/client/pages/automation/job-apply.vue`, `packages/client/pages/automation/email.vue`, `packages/client/pages/automation/scraper.vue`, `packages/client/pages/automation/runs.vue`, `packages/client/pages/automation/runs/[id].vue` | `packages/server/src/routes/automation.test.ts` |
| `/api/automation/screenshots` (`automation-screenshots.routes.ts`) | filesystem + run table lookup | `automationRuns` and screenshot artifacts in `AUTOMATION_SCREENSHOT_DIR` | embedded image routes consumed by automation run detail pages | `packages/server/src/routes/automation-screenshots.test.ts` |
| `/api/scraper` (`scraper.routes.ts`) | `scraperService` | `jobs`, `studios` via scraper upserts | `packages/client/pages/automation/scraper.vue` | `packages/server/src/routes/scraper.test.ts` |
| `/api/ai` (`ai.routes.ts`) | `AIService`, `contextManager`, `applicationAutomationService` | `chatHistory`, `jobs`, `resumes`, `settings`, `userProfile` | `packages/client/pages/ai/chat.vue`, `packages/client/pages/ai/dashboard.vue` | `packages/server/src/routes/ai.test.ts` |
| `/api/skills` (`skill-mapping.routes.ts`) | `skillMappingService`, `AIService` | `skillMappings`, `settings` | `packages/client/pages/skills/index.vue`, `packages/client/pages/skills/pathways.vue` | `packages/server/src/routes/skill-mapping.test.ts` |
| `/api/gamification` (`gamification.routes.ts`) | `gamificationService` | gamification tables/state | `packages/client/pages/gamification.vue` | `packages/server/src/routes/core-routes.test.ts` |
| `/api/settings` (`settings.routes.ts`) | settings + JSON export service hooks | `settings` | `packages/client/pages/settings.vue` | `packages/server/src/routes/settings.test.ts` |
| `/api/stats` (`stats.routes.ts`) | `statisticsService` | aggregated reads across jobs, resumes, interviews, gamification | profile and dashboard surfaces that show aggregate progress | `packages/server/src/routes/core-routes.test.ts` |
| `/api/search` + `/api/automation` + `/api/ai` composition points | cross-domain orchestration from shared route handlers | multiple tables used by composed services | validated by route-level translation in `packages/client/` surfaces above | core-route + dedicated route tests |

## AI routing notes

- `settings.aiRouting` is now the canonical server-side routing contract for AI provider/model selection.
- High-value purpose mappings currently exercised in code paths: `chat`, `interviewQuestions`, `interviewFeedback`, `resume`, `coverLetter`, `emailResponse`, `jobMatch`, and `automationFieldMapping`.
- Local provider readiness is surfaced through `providerDiagnostics` on the settings payload and `/api/ai/models` provider health metadata.
