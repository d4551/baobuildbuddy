# Top 10 enterprise UX — Cycle 9 (2026-07-20)

Evidence: browser-smoke gamification 500 (`$props.t`), Eden dual-path audit, jobs detail save cold-load. SSOT: `docs/STACK-CONTRACT.md`.

## TOP 5 journey gaps (wired)

1. **Gamification crash** — Achievements/Challenges used prop-drilled `t`; page omitted `:t` → SSR 500. **Fixed:** `useI18n()` inside cards.
2. **Jobs detail Save cold-load** — `isSaved` never bootstrapped. **Fixed:** `Promise.all([getJob, fetchSavedJobs])` in `useAsyncData`.
3. **Jobs detail off Eden** — `getJob` used `requestApi` + `buildJobDetailEndpoint`. **Fixed:** `JobsApi({ id }).get()` + Eden path.
4. **Resumes dual HTTP** — CRUD still `requestApi` while job-apply used Eden. **Fixed:** `useResume` → `api.resumes.*` (export stays `downloadApiFile`).
5. **Automation runs empty dead-end** — muted text only. **Fixed:** `<EmptyState` CTA to Automation Hub; studios catalog empty gates filters/stats.

## TOP 5 legacy blockers (refactored)

1. **`StudiosApi` truncated** — ClientApi only typed `analytics`. **Fixed:** full `StudiosApi` + `useStudio` Eden CRUD reads/writes.
2. **`validate:no-eden-dual-path` incomplete** — **Fixed:** owns `resumes` + `studios`; file gates for `useJobs` / `useResume` / `useStudio`.
3. **Jobs View primary density** — raw `btn btn-primary`. **Fixed:** `PRIMARY_ACTION_CLASS`.
4. **Trends nested `bg-base-200`** — **Fixed:** solid `bg-base-100` inside glass card.
5. **Stack pins** — Nuxt 4.5.0 / Vue 3.5.40 / daisyUI 5.6.18 / Elysia `2.0.0-exp.46` tip (npm Elysia 1.x is not an upgrade).

## Proof commands

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
bun run lint && bun run test
```
