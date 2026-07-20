# Page Verification Guide

This guide is the route-by-route companion to [VERIFICATION_RUNBOOK.md](./VERIFICATION_RUNBOOK.md). Use it after `proof:pages` generates a screenshot bundle so you can review every routed page in a fixed order with the same acceptance bar.

Stack truth: [STACK-CONTRACT.md](./STACK-CONTRACT.md).

## What this guide is for

Use this guide when you need to confirm:

1. every routed page renders the intended product surface
2. shared shell, spacing, and semantic token patterns are still intact
3. no screenshot regressed into a setup gate, overlap, clipped badge, or broken card layout
4. the document-export pages still match the three export families:
   - resume: compact and scan-first
   - cover letter: formal correspondence
   - portfolio: showcase presentation

## Generate the screenshot bundle first

Follow [VERIFICATION_RUNBOOK.md](./VERIFICATION_RUNBOOK.md), then generate the page proof set:

```bash
PAGE_PROOF_API_BASE=http://127.0.0.1:3400 \
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3411 \
bun run proof:pages -- --output-dir /tmp/bao-page-proof-$(date +%F)
```

That output directory contains:

- `report.json`
- `report.md`
- one screenshot per routed page

For responsive UI proof against a live stack on default ports:

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
```

Viewport order is always **mobile (320) → tablet (768) → desktop (1440)**. Prefer `127.0.0.1` over `localhost` so Playwright is not blocked by an IPv6-only Nuxt bind.

## Five questions for every screenshot

Ask the same five questions for every page (and every viewport in the smoke/burndown matrix):

1. Does the route render the intended page, not a fallback or setup gate?
2. Is the layout using the shared shell, container, cards, and spacing tokens rather than a one-off width or ad-hoc spacing pattern?
3. Are there any overlaps, clipped badges, floating actions on top of content, or broken card heights?
4. Do async states look intentional rather than half-rendered?
5. Does the page still look like the same product family as the rest of the app?

Also watch for mobile-specific regressions: truncated search placeholders, mid-word section-rail clipping, duplicate section titles under `WorkspaceSectionNavigator`, and control targets below 44px (`TOUCH_TARGET_MIN_CLASS`).

If any screenshot fails those questions, fix the page and rerun `proof:pages` / browser smoke before treating the verification pass as complete.

## Recommended walkthrough order

Review the product in this order:

1. Setup and dashboard
2. Jobs and source material
3. Resume, cover letter, and portfolio flows
4. Interview and skills flows
5. AI and automation surfaces
6. Platform pages: API docs, gamification, and settings
7. Export artifacts and desktop packaging

## Route-by-route checklist

The `Screenshot file` column is the filename created inside the `proof:pages` output directory.

### Setup and dashboard

| Page | Route | Screenshot file | What success looks like |
|------|-------|-----------------|-------------------------|
| Setup | `/setup` | `setup.png` | Setup gate renders intentionally, not as a fallback for authenticated routes. |
| Dashboard | `/` | `dashboard.png` | Shared shell, dashboard header, and quick actions render without overlap or empty tiles. |

### Jobs and source material

| Page | Route | Screenshot file | What success looks like |
|------|-------|-----------------|-------------------------|
| Job Board | `/jobs` | `jobs-index.png` | Search, list, and job cards/table fit the shared content width and remain readable at default viewport. |
| Job Detail | `/jobs/:id` | `jobs-detail.png` | Job content, studio info, and action rail render as one coherent detail surface. |
| Studio Directory | `/studios` | `studios-index.png` | Grid/list entries align cleanly and do not collapse unevenly. |
| Studio Detail | `/studios/:id` | `studios-detail.png` | Studio overview, hiring context, and related content render without clipped cards. |
| Studio Analytics | `/studios/analytics` | `studios-analytics.png` | Analytics hydrate via `useStudioAnalyticsPage` + `useAsyncData` (not an orphan ref); cards use shared stat patterns with intact chart/text spacing. |

### Resume, cover letter, and portfolio

| Page | Route | Screenshot file | What success looks like |
|------|-------|-----------------|-------------------------|
| Resume Builder | `/resume` | `resume-index.png` | Resume list/builder surface renders with clear primary action and stable card layout. |
| AI CV Builder | `/resume/build` | `resume-build.png` | Builder form sections are grouped clearly and do not break shared form spacing. |
| Resume Preview | `/resume/preview?id=...` | `resume-preview.png` | Printable resume surface looks compact, scan-first, and distinct from portfolio/cover-letter pages. |
| Cover Letters | `/cover-letter` | `cover-letter-index.png` | List/index page presents drafts and actions cleanly. |
| Cover Letter Detail | `/cover-letter/:id` | `cover-letter-detail.png` | Edit, preview, and export actions render without clipping; the editor is grounded to the selected job/company. |
| Portfolio Builder | `/portfolio` | `portfolio-index.png` | Portfolio drafting surface uses shared cards and action hierarchy without dead zones. |
| Portfolio Preview | `/portfolio/preview` | `portfolio-preview.png` | Preview reads like a showcase page, not a resume clone, and keeps generous spacing. |

### Interview and skills

| Page | Route | Screenshot file | What success looks like |
|------|-------|-----------------|-------------------------|
| Interview Prep Hub | `/interview` | `interview-index.png` | Overview cards and launch actions align without crowding. |
| Interview History | `/interview/history` | `interview-history.png` | History list/table preserves readable status and metadata density. |
| Interview Practice | `/interview/session?id=...` | `interview-session.png` | Prompt workspace, response column, and progress indicators render cleanly with no clipped badges or overlapping actions. |
| Skill Mapper | `/skills` | `skills-index.png` | Mapping controls and grouped outputs remain readable and consistent with the shell. |
| Career Pathways | `/skills/pathways` | `skills-pathways.png` | Pathway cards preserve hierarchy and do not collapse unevenly. |

### AI and automation

| Page | Route | Screenshot file | What success looks like |
|------|-------|-----------------|-------------------------|
| AI Chat | `/ai/chat` | `ai-chat.png` | Chat surface renders with stable transcript spacing; context scope lives in the xl sidebar (no duplicate Scope/Surface/Route chips in the narrow header). |
| AI Dashboard | `/ai/dashboard` | `ai-dashboard.png` | AI routing/status cards render without hidden controls or stale state blocks. |
| Automation Hub | `/automation` | `automation-index.png` | Capability cards and actions render as a single operational surface, not a scattered report. |
| Job Application Automation | `/automation/job-apply` | `automation-job-apply.png` | Apply flow shows a clear form/action hierarchy and grounded source selections. |
| Scraper Operations Hub | `/automation/scraper` | `automation-scraper.png` | Provider cards, stats, and recent-job table align without clipped metadata; capability intro copy is not duplicated under `WorkspaceSectionNavigator`. |
| Email Response Automation | `/automation/email` | `automation-email.png` | Email composition, generation, and send controls are visible and ordered logically. |
| Automation Runs | `/automation/runs` | `automation-runs.png` | Run history table/list remains readable and action buttons stay aligned. |
| Automation Run Detail | `/automation/runs/:id` | `automation-run-detail.png` | Step log, artifacts, and screenshots render as one coherent detail page. |

### Platform pages

| Page | Route | Screenshot file | What success looks like |
|------|-------|-----------------|-------------------------|
| API Reference | `/docs/api` | `docs-api.png` | API docs surface renders correctly inside the shared shell without iframe-style overflow. |
| Gamification Hub | `/gamification` | `gamification.png` | Progress and achievements retain consistent card/stat spacing. |
| Settings & Profile | `/settings` | `settings.png` | Section titles are owned by `WorkspaceSectionNavigator` (panels do not repeat h2 titles); rail scrolls horizontally on narrow viewports without mid-word clipping; form rows stay intact. |

## Step-by-step operator flow

Use this path when you want to verify the product end-to-end rather than route by route:

1. Open `setup` and confirm the bootstrap page is intentional.
2. Open `dashboard` and confirm the quick-action hub renders cleanly.
3. Open `jobs` and `jobs/:id` to confirm source jobs and grounded detail pages.
4. Open `resume`, `resume/build`, and `resume/preview` to confirm creation and preview flow.
5. Open `cover-letter` and a real `cover-letter/:id` page to confirm grounded editing and export controls.
6. Open `portfolio` and `portfolio/preview` to confirm the showcase family is visually distinct from the resume family.
7. Open `interview`, `interview/history`, and `interview/session` to confirm the practice loop and transcript workspace.
8. Open `skills` and `skills/pathways` to confirm skill mapping and pathway guidance.
9. Open `studios`, `studios/:id`, and `studios/analytics` to confirm source/studio intelligence pages.
10. Open `ai/chat` and `ai/dashboard` to confirm provider routing and chat surfaces.
11. Open `automation`, `automation/job-apply`, `automation/scraper`, `automation/email`, `automation/runs`, and a real `automation/runs/:id` page.
12. Open `docs/api`, `gamification`, and `settings` to confirm platform/support surfaces.
13. Run the export checks from [VERIFICATION_RUNBOOK.md](./VERIFICATION_RUNBOOK.md) and compare:
    - resume: compact and scan-first
    - cover letter: formal letter layout
    - portfolio: showcase presentation
14. Run `PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke` then `proof:browser-burndown` (mobile → tablet → desktop).
15. Run `bun run verify:desktop-runtime`.
16. Run `bun run verify:desktop-releases -- --targets macos,windows,linux-arm64` for the staged artifact set or the host-specific release commands for a fresh build.
17. Only mark desktop regeneration complete for a target when that target's native build actually ran on a matching host or CI runner.

## Export-family checks

The preview pages and exported artifacts should agree on purpose:

| Family | UI page | PDF/DOCX expectation |
|--------|---------|----------------------|
| Resume | `resume-preview.png` | Dense, scannable hierarchy for recruiter review. |
| Cover letter | `cover-letter-detail.png` plus export previews | Formal one-page correspondence with stronger paragraph rhythm. |
| Portfolio | `portfolio-preview.png` | Showcase layout with more breathing room and project emphasis. |

Use the PDF and DOCX steps in [VERIFICATION_RUNBOOK.md](./VERIFICATION_RUNBOOK.md) to confirm the actual exported documents, not just the browser previews.
