# Context7 Integration

BaoBuildBuddy uses Context7 for framework and runtime verification. Do not guess current API behavior when touching Bun, Tauri, Nuxt, or Playwright flows.

## Use Context7 For

| Area | Tool |
| --- | --- |
| Bun process/runtime APIs | Context7 |
| Tauri packaging, CI, and test guidance | Context7 |
| Playwright browser/runtime behavior | Context7 |
| Nuxt SSR conventions | Context7 |
| daisyUI component structure | `daisyui-blueprint`, not Context7 |

## Current Library IDs

| Library | Context7 library ID |
| --- | --- |
| Bun | `/oven-sh/bun` |
| Tauri docs | `/tauri-apps/tauri-docs` |
| Playwright | `/microsoft/playwright` |
| Nuxt 4 | `/websites/nuxt_4_x` |

## Notes On Elysia

An authoritative Elysia documentation index is not currently exposed in this Context7 access set. For Elysia-specific changes, prefer existing repository patterns first and verify against primary upstream documentation separately when needed.

## Repo-Relevant Context7 Checks

### Tauri

Context7 confirms the repo's desktop workflow shape:

- native artifacts should be built on platform-specific runners in CI
- macOS bundling can be split into `tauri build --no-bundle` followed by `tauri bundle --bundles app,dmg`
- WebDriver CI guidance exists for desktop-app verification on Linux and Windows

### Bun

Context7 confirms the Bun child-process API used throughout `scripts/`:

- `Bun.spawn(command, options)` returns a subprocess
- `stdout` and `stderr` can be captured as readable streams
- `await proc.exited` is the supported completion check

### Playwright

Context7 is required when touching:

- browser launch configuration
- Chromium channel behavior
- desktop runtime verification logic
- scraper navigation and page interaction contracts

## Standard Workflow

1. Resolve the relevant library ID.
2. Query the exact API or workflow you are about to change.
3. Apply the change.
4. Run the repository verification commands.
