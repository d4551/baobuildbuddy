# PROTOCOL002

## Scope

Domain map, lifecycle, naming rules, and file ownership for BaoBuildBuddy automation, desktop runtime, and `agentiflow/`.

## Automation Lifecycle

1. Nuxt pages under [`packages/client/pages/automation`](../packages/client/pages/automation) collect user intent and render run history.
2. Elysia routes in [`packages/server/src/routes/automation.routes.ts`](../packages/server/src/routes/automation.routes.ts) and related server modules validate input and schedule runs.
3. Server services in [`packages/server/src/services/automation`](../packages/server/src/services/automation) own orchestration, scheduling, and persistence.
4. Browser execution happens in [`packages/scraper/src/scripts`](../packages/scraper/src/scripts) and related runtime helpers.
5. Shared protocol schemas live in:
   - [`packages/shared/src/schemas/rpa-protocol.schema.ts`](../packages/shared/src/schemas/rpa-protocol.schema.ts)
   - [`packages/shared/src/schemas/rpa-events.schema.ts`](../packages/shared/src/schemas/rpa-events.schema.ts)
6. Desktop builds bundle the server, runner, manifest, and scraper runtime under `gen/runtime`.

## Naming And Ownership

| Concern | Owner | Canonical location |
| --- | --- | --- |
| Shared automation contracts | `@bao/shared` | `packages/shared/src/schemas` |
| Server run orchestration | `@bao/server` | `packages/server/src/services/automation` |
| Scraper and job-apply scripts | `@bao/scraper` | `packages/scraper/src/scripts` |
| Desktop runtime contract | `@bao/shared` + scripts | `packages/shared/src/constants/scripts.ts`, `packages/shared/src/utils/desktop-runtime-contract.ts`, `scripts/` |
| Native desktop assembly | scripts + `@bao/desktop` | `scripts/build-desktop-release.ts`, `scripts/refresh-desktop-releases.ts`, `packages/desktop` |
| Assembled release output | generated artifact | `packages/desktop/releases` |
| Per-host staging output | generated artifact | `.desktop-release-artifacts` |

## Agentiflow Directory Protocol

`agentiflow/` contains two kinds of files:

| Kind | Files | Rule |
| --- | --- | --- |
| Manual protocol docs | `README.md`, `AGENTS.md`, `PROTOCOL001.md`, `PROTOCOL002.md`, `PROTOCOL003.md`, `CLAUDE.md`, `GEMINI.md`, `CURSOR_RULE.mdc`, `CONTEXT7_INTEGRATION.md` | Human-maintained, must describe the current repository accurately |
| Generated state | `capability-matrix.generated.json` | Refresh with `bun run capability:matrix`; never hand-edit |

## Sync Triggers

Update the manual protocol docs and regenerate the matrix when any of the following changes:

- workspace package layout
- required repo commands
- automation page inventory
- RPA protocol version
- desktop release targets
- desktop release workflow path or native runner layout
- root-level rule-copy presence

## Repository Facts This Protocol Must Preserve

- BaoBuildBuddy does not use HTMX, Prisma, FlatBuffers, or easy-auth in this repository.
- The frontend is Nuxt SSR, not a server-driven HTMX app.
- Automation is Playwright-based and the desktop verifier also uses Playwright.
- Desktop artifacts are built natively per operating system in CI and assembled afterward.
- The current RPA protocol version is sourced from the shared schema, not from `agentiflow/` prose.
