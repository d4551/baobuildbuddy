# UI Page Audit — 2026-04-01

Status note:
- The initial capture pass for this audit was taken before the `scripts/dev-stack.ts` CLI port fix landed.
- After that fix, the clean stack on `3200/3201` no longer reproduces the broad route-wide fetch failures that were caused by the client still targeting `3000`.
- The page-by-page improvement plans below still apply as UX and structure guidance, but the original route-failure counts in this document should be treated as a pre-fix snapshot rather than the current live state.

Audit scope: every routed page under `packages/client/pages`.

Audit artifacts:
- Screenshot directory: `/tmp/bao-page-audit-shots-fresh`
- Route metadata report: `/tmp/bao-page-audit-shots-fresh/report.json`

Method:
- Authenticated browser pass against `http://localhost:3001`
- One screenshot captured per route
- Route state cross-checked against page source files in `packages/client/pages`

## Summary

- 30 routed pages were audited.
- 24 of 30 pages rendered an immediate alert state in the current local stack.
- 6 pages rendered without an immediate alert, but several of those still need density, workflow, and empty-state improvements.
- The most urgent product issue is platform-level data instability: many pages are failing with `socket connection was closed unexpectedly`, `Failed to fetch profile`, or `Service temporarily unavailable`.
- The most urgent UX issue is state design drift: many no-data cases are rendered as red error alerts instead of a shared empty-state pattern.
- The most urgent maintainability issue is page size drift. Current hotspots include:
  - `packages/client/pages/automation/runs/index.vue` — 297 lines
  - `packages/client/pages/interview/index.vue` — 286 lines
  - `packages/client/pages/automation/email.vue` — 281 lines
  - `packages/client/pages/cover-letter/[id].vue` — 280 lines
  - `packages/client/pages/skills/index.vue` — 278 lines
  - `packages/client/pages/studios/[id].vue` — 274 lines

## Global Improvements

- Stabilize the shared client-to-API contract before any visual refinement. The current page audit shows route-level fetch instability across dashboard, jobs, resume, portfolio, interview, automation, settings, gamification, and API docs.
- Replace alert-bar empty states with one shared empty-state component and keep alert bars for true error conditions only.
- Normalize every page to one shared header pattern: title, description, one primary action, secondary actions moved into compact overflow.
- Break the current page monoliths into shared sections for header, stats, filters, data grid, empty state, and retry state.
- Reduce blank vertical space after failures. Most pages collapse into a header plus one red strip and then a large empty canvas.
- Tighten cross-workflow continuity so pages link directly into the next useful step: job -> resume -> cover letter -> interview -> automation.

## Route Audit

### Dashboard

- Route: `/`
  File: `packages/client/pages/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/home.png`
  Observed: page title renders, but the dashboard content fails immediately with a socket error and leaves the rest of the surface blank.
  Improvement plan:
  - Fix the dashboard bootstrap and websocket/data path first so the page can render its KPI and activity cards consistently.
  - Replace the current full-width error strip with a shared error state above a preserved skeleton grid so the layout does not collapse.
  - Add a task-oriented first row after recovery: resume status, latest scraped jobs, next automation run, and interview readiness.

### Setup

- Route: `/setup`
  File: `packages/client/pages/setup.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/setup.png`
  Observed: auth-shell composition is clean, but the page renders as a tiny centered card with an immediate `Failed to fetch settings` error.
  Improvement plan:
  - Decouple first-run onboarding from the settings fetch so the shell can always show prerequisites, environment readiness, and next actions.
  - Convert the setup card into a clear stepper: identity, AI provider, job sources, automation readiness.
  - Add offline-safe local checks so users can configure the product even if one settings request fails.

### Jobs

- Route: `/jobs`
  File: `packages/client/pages/jobs/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/jobs-index.png`
  Observed: header and filter rail are present, but the jobs list fails and the page leaves a large blank content region.
  Improvement plan:
  - Fix the jobs query path and keep the list area populated with a table or card skeleton on failure.
  - Collapse filter density with grouped controls and a saved-search strip so the left rail earns its space.
  - Add a compact jobs summary row above results: total matches, saved jobs, applied jobs, new since refresh.

- Route: `/jobs/:id`
  File: `packages/client/pages/jobs/[id].vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/jobs-detail.png`
  Observed: the detail page fails before rendering a visible heading, so the route currently has no meaningful first-screen context.
  Improvement plan:
  - Fix route-param data loading and always render a stable hero with job title, studio, location, and status even while details load.
  - Add a sticky action rail: save job, generate cover letter, tailor resume, start interview, start apply automation.
  - Split the page into summary, responsibilities, required skills, and fit analysis sections instead of a single monolithic detail view.

### Resume

- Route: `/resume`
  File: `packages/client/pages/resume/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/resume-index.png`
  Observed: the page header and CTA composition are strong, but the primary resume list fails and the surface collapses into a red error strip.
  Improvement plan:
  - Restore the resume query path and keep a reusable list skeleton visible below the header.
  - Split the page into saved resumes, recent exports, and downstream actions instead of one single workspace block.
  - Break this 243-line page into extracted sections for header, stats, list, and state rendering.

- Route: `/resume/build`
  File: `packages/client/pages/resume/build.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/resume-build.png`
  Observed: one of the cleaner healthy pages, but the form is very sparse and linear for such an important workflow.
  Improvement plan:
  - Turn the single-card form into a clearer guided builder with a context preview for target role, studio, and inferred question set.
  - Add progressive disclosure so the page can prefill from a selected job or studio instead of asking for disconnected manual input.
  - Use the empty right side for generated guidance, role examples, and resume quality tips rather than dead space.

- Route: `/resume/preview`
  File: `packages/client/pages/resume/preview.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/resume-preview.png`
  Observed: the route falls into a `Resume not found` alert bar instead of a proper empty preview state.
  Improvement plan:
  - Replace the alert treatment with a centered empty-state component and a clear chooser CTA.
  - Keep export and print controls disabled until a resume is resolved, instead of showing active-looking actions above an error.
  - Add a left-side selector for recent resumes so preview is recoverable without forcing a navigation detour.

### Cover Letter

- Route: `/cover-letter`
  File: `packages/client/pages/cover-letter/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/cover-letter-index.png`
  Observed: strong header, CTA, and stats composition, but the list query fails and the content area becomes empty.
  Improvement plan:
  - Fix the list bootstrap and keep letter rows or cards visible through a stable skeleton and empty-state contract.
  - Break this 264-line page into header, metrics, filter bar, and list components.
  - Add explicit lineage chips on each letter row: job, studio, template, export status.

- Route: `/cover-letter/:id`
  File: `packages/client/pages/cover-letter/[id].vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/cover-letter-detail.png`
  Observed: the page renders breadcrumbs and actions, but the main body remained in a loading skeleton state during the capture.
  Improvement plan:
  - Ensure deterministic data hydration so the editor and preview resolve cleanly on first load.
  - Convert the page into a two-pane editor/preview layout with persistent export status and template controls.
  - Break this 280-line route into separate detail header, editor, preview, and export modules.

### Portfolio

- Route: `/portfolio`
  File: `packages/client/pages/portfolio/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/portfolio-index.png`
  Observed: header and summary stats are present, but the workspace fails immediately with `Failed to fetch portfolio`.
  Improvement plan:
  - Fix the portfolio bootstrap and reuse a shared empty-state pattern instead of treating no portfolio data as a full error state.
  - Add project completeness cards and direct import actions from resume, cover letter, and interview evidence.
  - Reduce the dead white space under the alert with starter examples and portfolio templates.

- Route: `/portfolio/preview`
  File: `packages/client/pages/portfolio/preview.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/portfolio-preview.png`
  Observed: the route renders `Portfolio not found` as an error strip with top-level export controls still visible.
  Improvement plan:
  - Replace the alert with a proper empty preview state and disable export until a portfolio exists.
  - Add layout/theme preview options once the page resolves, so the preview route becomes more than a static read-only shell.
  - Split this 237-line page into preview chrome, resolved content, and not-found/empty states.

### Studios

- Route: `/studios`
  File: `packages/client/pages/studios/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/studios-index.png`
  Observed: the page loads cleanly, but the directory is entirely empty and visually underpowered for discovery.
  Improvement plan:
  - Add a studio spotlight rail and last-refresh provenance so the page feels alive even with zero matches.
  - Introduce richer filter chips and recommended drills based on studios already tied to saved jobs.
  - Make the zero-results state actionable with scraper refresh and sample studio cards.

- Route: `/studios/:id`
  File: `packages/client/pages/studios/[id].vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/studios-detail.png`
  Observed: the page resolves to `Studio unavailable`, so the detail route currently does not establish stable context for the selected studio.
  Improvement plan:
  - Guarantee a stable not-found state with directory suggestions and related jobs instead of a hard failure banner.
  - When data exists, split the page into company snapshot, culture, open roles, and interview prep context.
  - Break this 274-line route into focused sections so empty/error logic is not tangled with resolved detail rendering.

- Route: `/studios/analytics`
  File: `packages/client/pages/studios/analytics.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/studios-analytics.png`
  Observed: the route shows `No studio analytics available` and leaves most of the canvas empty.
  Improvement plan:
  - Add last-scrape provenance, freshness badges, and a direct scrape CTA tied to the analytics empty state.
  - Reserve the page grid and chart skeletons even when no analytics exist so the information architecture stays stable.
  - Split this 205-line page into header, metrics, charts, and state modules.

### Interview

- Route: `/interview`
  File: `packages/client/pages/interview/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/interview-index.png`
  Observed: the stepper is useful, but the page fails on profile fetch before session setup can proceed.
  Improvement plan:
  - Make context selection independent from profile fetch so interview flows can still start from job or studio context.
  - Add a side-by-side split between scraped-job mode and studio-drill mode instead of one generic top block.
  - Break this 286-line page into stepper, context picker, configuration form, and state components.

- Route: `/interview/session`
  File: `packages/client/pages/interview/session.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/interview-session.png`
  Observed: the current local stack fails to fetch the session, even though this route previously proved grounded prompts in the earlier live verification pass.
  Improvement plan:
  - Restore reliable session fetch and cache the generated question set locally so a refresh does not collapse the workflow.
  - Expand the answer composer into a clearer writing surface with rubric, timer controls, and answer guidance pinned in a side rail.
  - Preserve previous proof grounding by surfacing resume/job/studio lineage inline on the question cards.

- Route: `/interview/history`
  File: `packages/client/pages/interview/history.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/interview-history.png`
  Observed: no sessions are rendered, but the page uses an error-colored alert instead of a neutral history empty state.
  Improvement plan:
  - Replace the alert with a timeline/table empty-state component that points directly back into `Interview a Scraped Job` and `Start Studio Drill`.
  - Add filters for studio, role, score, and recency so the page scales once history exists.
  - Preserve vertical structure with skeleton rows even when history is empty.

### Skills

- Route: `/skills`
  File: `packages/client/pages/skills/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/skills-index.png`
  Observed: the page loads cleanly and has a sound high-level structure, but the lower half becomes an under-designed zero-data field.
  Improvement plan:
  - Fill the lower workspace with starter examples, imported evidence prompts, and a reusable mapping template gallery.
  - Tighten the stats + pathways + top mappings area into a denser dashboard so the page feels more useful before any data exists.
  - Break this 278-line page into header, stats, summary cards, filters, and mapping list components.

- Route: `/skills/pathways`
  File: `packages/client/pages/skills/pathways.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/skills-pathways.png`
  Observed: the page stacks a warning and an error and then leaves the rest of the space unused.
  Improvement plan:
  - Distinguish pathway empty state from gamification dependency problems with separate cards instead of stacked banners.
  - Show starter pathways or example tracks when recommendations are unavailable.
  - Keep one consistent state rail for progress, prerequisites, and recommended next steps.

### Automation

- Route: `/automation`
  File: `packages/client/pages/automation/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/automation-index.png`
  Observed: this page has good information architecture in the healthy capture, but the current local stack still throws a top-level socket failure.
  Improvement plan:
  - Stabilize the capabilities fetch so the pipeline, audit table, and action cards always render.
  - Collapse summary cards and pipeline into a more compact top band, with provider failures highlighted as actionable items.
  - Treat this page as the operations home for the entire product, not just a status dashboard.

- Route: `/automation/email`
  File: `packages/client/pages/automation/email.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/automation-email.png`
  Observed: the route currently stops at `Failed to fetch settings`.
  Improvement plan:
  - Decouple the workflow form from settings bootstrap and show provider readiness inline rather than blocking the whole route.
  - Add recent runs, sample prompt templates, and SMTP/provider diagnostics in a side panel.
  - Break this 281-line page into prerequisites, composer, run history, and state modules.

- Route: `/automation/job-apply`
  File: `packages/client/pages/automation/job-apply.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/automation-job-apply.png`
  Observed: one of the healthiest pages, but the form is visually bare and lacks context for the selected resume and cover letter.
  Improvement plan:
  - Add a right-hand context rail with selected resume, cover letter, job lineage, and RPA readiness checks.
  - Parse the job URL into a preview card before the user submits or schedules the run.
  - Promote the primary decision between immediate run and scheduled run with clearer hierarchy and guidance.

- Route: `/automation/scraper`
  File: `packages/client/pages/automation/scraper.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/automation-scraper.png`
  Observed: the route header renders, but the capability audit fails in the current local stack.
  Improvement plan:
  - Keep provider cards and freshness timestamps visible even if the capabilities request fails.
  - Split provider readiness, scrape actions, and recent run history into separate panels for faster scanning.
  - Make per-provider quick actions prominent so the page works as an operations console.

- Route: `/automation/runs`
  File: `packages/client/pages/automation/runs/index.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/automation-runs-index.png`
  Observed: filters are present, but the run list fails and the page becomes another large empty surface.
  Improvement plan:
  - Restore the runs query path and keep a skeleton table pinned below the filters.
  - Add a latest-failure summary card and saved filters so the page is useful before the full list resolves.
  - Break this 297-line route into header, filters, list, and state views.

- Route: `/automation/runs/:id`
  File: `packages/client/pages/automation/runs/[id].vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/automation-run-detail.png`
  Observed: the detail page fails to load and never reaches its run timeline or payload content.
  Improvement plan:
  - Fix the run-detail fetch first and preserve step/timeline skeletons below the hero.
  - Add a three-column detail layout: run summary, screenshots/artifacts rail, logs and payloads.
  - Surface AI diagnosis and retry recommendations for failed runs instead of a bare retry button.

### AI

- Route: `/ai/chat`
  File: `packages/client/pages/ai/chat.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/ai-chat.png`
  Observed: this is one of the cleaner live pages. The main chat surface works, but the right rail is bulky and the lower speech-profile area competes with the conversation.
  Improvement plan:
  - Make the context rail collapsible and move advanced speech controls behind a secondary disclosure.
  - Increase the composer height and bring suggested prompts closer to the entry point.
  - Add conversation memory markers that show when the chat is using current page, resume, or job context.

- Route: `/ai/dashboard`
  File: `packages/client/pages/ai/dashboard.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/ai-dashboard.png`
  Observed: the earlier healthy proof showed strong provider cards, but the current local stack now fails on settings fetch.
  Improvement plan:
  - Keep the current provider-card structure, but isolate settings/bootstrap failure so stats and last-known provider readiness still render.
  - Add a routing matrix that shows which provider powers chat, cover letters, interview, automation mapping, and speech.
  - Add a change log or readiness timeline so providers are observable over time, not just at the current moment.

### Settings

- Route: `/settings`
  File: `packages/client/pages/settings.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/settings.png`
  Observed: the route currently fails on profile fetch, so the current local state does not reach the earlier improved provider layout.
  Improvement plan:
  - Fix profile bootstrap before additional visual work; a settings page that fails on load is the most urgent product-level blocker after the dashboard.
  - Once stable, reduce section density further by turning the page into task-based modules: profile, preferences, automation defaults, AI providers, brand control.
  - Keep AI providers and routing in one clearly prioritized section with readiness, default, routing, and credentials stacked in that order.

### Gamification

- Route: `/gamification`
  File: `packages/client/pages/gamification.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/gamification.png`
  Observed: the route fails immediately and leaves the full progression surface empty.
  Improvement plan:
  - Make the page resilient to data failure and still render core level, XP, streak, and quests from cached/local state.
  - Split this 238-line page into summary strip, quests, achievements, and progression history.
  - Tie gamification events back into resume, cover letter, interview, and automation actions so the page reflects the broader product.

### API Docs

- Route: `/docs/api`
  File: `packages/client/pages/docs/api.vue`
  Screenshot: `/tmp/bao-page-audit-shots-fresh/docs-api.png`
  Observed: the route currently renders only a `Service temporarily unavailable` alert.
  Improvement plan:
  - Make the documentation shell load independently from the live spec/tester request.
  - Replace the giant single-scroll reference with grouped endpoint navigation and a split-pane request/response viewer.
  - Keep example payloads, auth requirements, and tester controls visible even when one backend request fails.

## Priority Order

- P0: fix shared API/bootstrap instability affecting dashboard, settings, jobs, resume, portfolio, interview, automation, gamification, and docs routes.
- P0: replace error-colored empty states with the shared empty-state pattern across preview, history, pathways, and analytics pages.
- P1: split page monoliths over roughly 200 lines into extracted page sections and state components.
- P1: tighten cross-page action flow so each core route moves directly into the next workflow step.
- P2: increase information density and reduce blank white space on healthy-but-sparse builder pages.
