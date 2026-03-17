# PROTOCOL001

## Scope

Stack conventions, execution rules, and verification requirements for BaoBuildBuddy.

## Stack Snapshot

| Concern | Current implementation |
| --- | --- |
| Runtime | Bun 1.3.x |
| Language | TypeScript strict |
| Frontend | Nuxt 4 SSR |
| Styling | Tailwind CSS 4 and daisyUI 5 |
| Backend | Elysia |
| Database | Drizzle ORM with SQLite |
| Automation | Playwright RPA in `packages/scraper` |
| Desktop | Tauri 2 in `packages/desktop` |

## Package Ownership

| Package | Responsibility |
| --- | --- |
| `@bao/shared` | Shared constants, schemas, contracts, and runtime-safe utilities |
| `@bao/server` | Elysia routes, services, orchestration, WebSockets, persistence |
| `@bao/client` | Nuxt SSR pages, composables, i18n, and daisyUI/Tailwind UI |
| `@bao/scraper` | Playwright scripts, extractors, runtime helpers, browser automation |
| `@bao/desktop` | Tauri wrapper, icons, release staging inputs, runtime manifest consumers |

## Execution Rules

1. Use existing shared contracts before adding new ones. `@bao/shared` owns cross-package automation and desktop schemas.
2. Keep SSR as the default. Client pages should prefer Nuxt SSR data flow over ad hoc browser-only fetching.
3. Keep automation flow split by concern:
   - UI in `packages/client/pages/automation`
   - orchestration in `packages/server/src/services/automation`
   - browser scripts in `packages/scraper/src/scripts`
   - protocol schemas in `packages/shared/src/schemas`
4. Keep desktop release flow split by concern:
   - native build and stage in `scripts/build-desktop-release.ts`
   - assembled release sync in `scripts/refresh-desktop-releases.ts`
   - runtime smoke tests in `scripts/verify-desktop-runtime.ts`
   - artifact inspection in `scripts/verify-desktop-release-artifacts.ts`
5. Use Context7 for Bun, Tauri, Nuxt, and Playwright API checks. Use daisyui-blueprint when UI changes rely on daisyUI structure.
6. Do not declare cross-platform success without passing the matching native workflow or equivalent verification.

## Required Commands

| Goal | Command |
| --- | --- |
| Install dependencies | `bun ci` |
| Install browser runtime | `bun run automation:browsers:install` |
| Refresh matrix | `bun run capability:matrix` |
| Format | `bun run format` |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` |
| Test | `bun run test` |
| SSR build | `bun run build` |
| Desktop runtime verify | `bun run verify:desktop-runtime` |
| Desktop artifact verify | `bun run verify:desktop-releases` |
| Native host release verify | `bun run release:verify` |

## Native Desktop Build Matrix

The canonical multi-platform build workflow is [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml).

| Artifact set | Native runner | Native build command |
| --- | --- | --- |
| macOS | `macos-14` | `bun run release:desktop:macos -- --output-root .desktop-release-artifacts` |
| Windows | `windows-latest` | `bun run release:desktop:windows -- --output-root .desktop-release-artifacts` |
| Linux x64 | `ubuntu-24.04` | `bun run release:desktop:linux-x64 -- --output-root .desktop-release-artifacts --verbose` |
| Linux arm64 | `ubuntu-24.04-arm` | `bun run release:desktop:linux-arm64 -- --output-root .desktop-release-artifacts --verbose` |
| Assembled releases | `macos-14` | `bun run release:refresh:all-os -- --source-root .desktop-release-input --targets macos,windows,linux-x64,linux-arm64` |

## Definition Of Done

- `bun run capability:matrix:check` passes
- `bun run lint` passes
- `bun run typecheck` passes
- `bun run test` passes
- `bun run build` passes
- Any touched automation or desktop flow also passes the relevant runtime and release verification
- `agentiflow/` docs still describe the real repository after the change
