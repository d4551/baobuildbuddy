# BaoBuildBuddy Weakness Audit

Current audit snapshot after the 2026-03-17 remediation pass.

## Resolved in current tree

- **2026-03-17 (Context7 + daisyUI plan):** daisyUI Blueprint btn modifier violations fixed across 19 Vue files; validator extended to require btn+modifier. daisyUI added to audit-official-llms. RPA progress events use safeParse; automation script ID uses safeParse. Greenhouse, Lever, CompanyBoard job providers use safeParseJson. Initial job refresh on startup. Playwright retries with backoff for fill, click, goto. Smart field mapper logging when returning empty.
- `POST /api/auth/init` no longer allows unauthenticated first-key bootstrap without an explicit setup token.
- Auth is no longer disabled implicitly from loopback host binding; `BAO_DISABLE_AUTH` is now explicit-only.
- Gaming portal providers now log structured failure reasons instead of silently collapsing every failure into empty results.
- The daisyUI validator now rejects `list-disc` / `list-inside` mixed into `list` markup, and the live list drift in resume/job surfaces is removed.
- `scripts/dev-stack.ts` now uses Bun-native subprocess management instead of `node:child_process`.

## Current owner contracts

- The runtime data layer owner in this repo is Drizzle plus `bun:sqlite`.
- `packages/server/src/db/schema/schema-modules.ts` remains the schema source of truth for persistence.
- Prisma is not an active runtime or migration path in this tree.

## Remaining findings

| Area | File | Weakness | Severity | Fix |
|------|------|----------|----------|-----|
| Security | `packages/server/src/config/env.ts` | Production can still start with localhost-only `CORS_ORIGINS` defaults if deploy-time env is incomplete. | Medium | Fail startup when production CORS origins are missing or obviously local-only. |
| Security | `packages/server/src/services/automation/automation-validation.ts` | Verification flags can still relax private-host checks for automation probes. | Low | Keep this restricted to controlled verification environments and document it clearly. |
| Data integrity | `packages/server/src/db/schema/jobs.ts` | Unique handling for nullable `contentHash` still depends on SQLite NULL semantics. | Medium | Enforce a non-null dedupe key or use a partial uniqueness strategy. |
| Docs/process | `README.md`, `docs/STARTER_GUIDE.md` | Operator setup still relies on environment knowledge for `BAO_AUTH_SETUP_TOKEN`. | Low | Add a dedicated first-run auth section with copy-paste examples for secure local onboarding. |
