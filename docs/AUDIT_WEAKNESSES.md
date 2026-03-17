# BaoBuildBuddy Weakness Audit

Trace and audit report using Context7 and daisyUI Blueprint. Generated from codebase exploration and daisyUI component contracts.

## Summary by Severity

| Severity | Count |
|----------|-------|
| High | 1 |
| Medium | 12 |
| Low | 18 |

---

## 1. Security

| File | Weakness | Severity | Fix |
|------|----------|----------|-----|
| `packages/server/src/routes/auth.routes.ts` (L43–69) | `POST /api/auth/init` is public. Anyone who can reach the server can create an API key if none exists. | **High** | Add rate limiting or a one-time setup token for first-time init. |
| `packages/server/src/config/env.ts` (L107–118) | Auth disabled when host is `127.0.0.1`, `localhost`, or `::1` regardless of `BAO_DISABLE_AUTH`. A server bound to localhost but reachable via tunnel could expose unauthenticated APIs. | **Medium** | Only disable auth when `BAO_DISABLE_AUTH` is explicitly set. Do not infer from host alone. |
| `packages/server/src/config/env.ts` (L94–106) | In production, `CORS_ORIGINS` defaults from env. If unset, falls back to localhost-only. Deployments may forget to set it. | **Medium** | In production, require `CORS_ORIGINS` when not localhost-only, or fail startup with a clear error. |
| `packages/server/src/services/automation/automation-validation.ts` | `allowAutomationPrivateHostsInVerificationContext()` bypasses SSRF checks when verification flags are set. | **Low** | Document clearly; ensure flags only used in controlled verification environments. |
| `packages/desktop/src-tauri/src/main.rs` | Desktop passes through `BAO_DISABLE_AUTH` from environment. | **Low** | Ignore `BAO_DISABLE_AUTH` in packaged desktop builds. |

---

## 2. Robustness

| File | Weakness | Severity | Fix |
|------|----------|----------|-----|
| `packages/server/src/services/gamification-service.ts` (L947) | `trackAction(...).catch()` swallows errors. XP/achievement tracking failures are invisible. | **Medium** | Log errors and consider a dead-letter path for failed tracking. |
| `packages/scraper/src/job-apply/runtime.ts` | Playwright actions use fixed 5s timeout. No retries on transient failures. | **Medium** | Add retries with backoff for transient failures. |
| `packages/server/src/services/jobs/providers/gaming-providers.ts` (L97) | `response.json()` used without validation. Malformed JSON can throw and break the provider. | **Medium** | Use safe parse (e.g. try/catch + schema) and handle parse failures. |
| `packages/server/src/services/scraper-service.ts` (L125) | `automationScriptIdSchema.parse()` throws on invalid input. | **Low** | Use `safeParse` and return 400 with clear message. |
| `packages/server/src/services/automation/application-automation-service.ts` (L374) | `rpaProgressEventSchema.parse()` throws. Unvalidated events can crash handler. | **Low** | Use `safeParse` and ignore or log invalid events. |
| `scripts/audit-official-llms.ts` (L106–111) | Retry logic wraps single fetch; no parallel attempts. | **Low** | Clarify intent or add parallel attempts if desired. |

---

## 3. UI/UX (daisyUI Blueprint)

Per daisyUI Blueprint: `btn` requires a color/style modifier; `list` uses `list` + `list-row`.

| File | Weakness | Severity | Fix |
|------|----------|----------|-----|
| `packages/client/pages/index.vue` (L469) | `class="btn btn-sm"` without semantic modifier. | **Low** | Add `btn-ghost` or `btn-primary`. |
| `packages/client/pages/studios/index.vue` (L279) | Same: `btn btn-sm` without modifier. | **Low** | Add modifier. |
| `packages/client/pages/skills/pathways.vue` (L227) | Same: `btn btn-sm` without modifier. | **Low** | Add modifier. |
| `packages/client/pages/resume/preview.vue` (L204) | Uses `list-disc list-inside` (Tailwind) instead of daisyUI `list` + `list-row`. | **Low** | Use `list` + `list-row` for consistency. |
| `packages/client/pages/jobs/[id].vue` (L235) | Same: `list-disc list-inside` instead of daisyUI list. | **Low** | Use daisyUI list components. |
| `packages/client/components/resume/ResumePreview.vue` (L82) | Same. | **Low** | Use daisyUI list components. |
| `scripts/validate-daisyui-contracts.ts` | `list` + `list-row` contract exists; `list-disc`/`list-inside` not validated. | **Low** | Document Tailwind list usage or extend validation. |

---

## 4. Build/CI

| File | Weakness | Severity | Fix |
|------|----------|----------|-----|
| `.github/workflows/desktop-release.yml` | Bun version hardcoded to `1.3.10`. | **Medium** | Read from `package.json` `packageManager` or shared config. |
| `scripts/setup.sh` | Parses `packageManager` with `awk`; fragile if format changes. | **Medium** | Use `bun --version` or more robust parser. |
| `scripts/prepare-desktop-runtime.ts` | Relies on `LOCALAPPDATA`, `XDG_CACHE_HOME`, etc. | **Medium** | Validate required env vars and fail with clear messages when missing. |
| `scripts/validate-*.ts`, `scripts/verify-*.ts` | Use `process.cwd()` for project root. | **Low** | Document "run from repo root" requirement. |
| `.github/workflows/desktop-release.yml` | Linux jobs install specific Ubuntu packages. | **Low** | Pin versions or use Docker image with known deps. |
| `scripts/setup.sh` | `grep "already exists"` for DB recovery is brittle. | **Low** | Prefer structured error messages or exit codes. |

---

## 5. Data Integrity

| File | Weakness | Severity | Fix |
|------|----------|----------|-----|
| `packages/server/src/db/schema/jobs.ts` (L35) | SQLite allows multiple NULLs in unique index on `contentHash`. Jobs with NULL can duplicate. | **Medium** | Add partial unique index or non-null default where dedup required. |
| `packages/server/src/db/schema/jobs.ts` | `savedJobs` has no unique constraint on `(jobId)`. | **Low** | Add unique constraint if duplicate saves should be prevented. |
| `packages/server/src/db/schema/jobs.ts` | `applications` has no unique constraint on `(jobId)`. | **Low** | Add unique constraint if duplicate applications per job should be prevented. |
| `packages/server/src/db/schema/settings.ts` | Settings JSON columns not validated at DB level. | **Low** | Validate on application read/write. |
| `packages/server/src/services/jobs/providers/*.ts` | Job providers return data without schema validation before insert. | **Low** | Validate with `scrapedJobSchema` before persisting. |

---

## Priority Actions

1. **Security:** Add rate limiting or auth for `POST /api/auth/init`.
2. **Security:** Remove auth bypass based solely on host; keep only when `BAO_DISABLE_AUTH` is explicitly set.
3. **Robustness:** Validate `response.json()` in job providers (e.g. Hitmarker).
4. **Build/CI:** Derive Bun version from `package.json` in workflows.
5. **Data integrity:** Address `contentHash` NULL handling for job deduplication.
6. **daisyUI:** Add btn modifiers and migrate list-disc to list + list-row where appropriate.
