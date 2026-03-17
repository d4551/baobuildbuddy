# BaoBuildBuddy Agent Rules

Read [`../AGENTS.md`](../AGENTS.md) first. This file is the `agentiflow/` projection of the same repo rules, aligned to BaoBuildBuddy's actual stack and verification flow.

## Working Context

- Monorepo: Bun workspaces with `@bao/server`, `@bao/client`, `@bao/shared`, `@bao/scraper`, and `@bao/desktop`
- Frontend: Nuxt 4 SSR with Tailwind CSS 4 and daisyUI 5
- Backend: Elysia API and WebSocket endpoints
- Automation: Playwright RPA scripts in `packages/scraper`
- Desktop: Tauri 2 packaging, runtime staging, and assembled release verification

## Non-Negotiable Rules

1. Read before writing. Keep diffs grounded in the current repo, not in generic framework advice.
2. Use Context7 for framework/runtime lookups and daisyui-blueprint for daisyUI structure decisions.
3. Preserve the shared-contract model. Automation schemas belong in `@bao/shared`, orchestration in `@bao/server`, browser scripts in `@bao/scraper`, and packaging in `@bao/desktop` plus `scripts/`.
4. Do not sidestep verification. If RPA or desktop code changes, run the matching runtime and release checks.
5. Keep `agentiflow/` in sync with the codebase. If commands, stack boundaries, or release workflow change, update these docs and refresh the capability matrix.

## Required Read Order

1. [`PROTOCOL001.md`](PROTOCOL001.md)
2. [`PROTOCOL002.md`](PROTOCOL002.md)
3. [`PROTOCOL003.md`](PROTOCOL003.md)
4. [`CONTEXT7_INTEGRATION.md`](CONTEXT7_INTEGRATION.md)
5. [`capability-matrix.generated.json`](capability-matrix.generated.json)

## Standard Verification

- `bun run capability:matrix`
- `bun run format`
- `bun run lint`
- `bun run typecheck`
- `bun run test`
- `bun run build`

## Extra Verification When Applicable

- Automation or browser-runtime changes: `bun run verify:desktop-runtime`
- Desktop artifact or release changes: `bun run verify:desktop-releases`
- Native-host desktop pipeline changes: `bun run release:verify`

## Directory Sync Rule

The generated matrix is the machine-readable source of truth for repo shape. Manual docs in `agentiflow/` must agree with it. A doc that describes HTMX, Prisma, FlatBuffers, or nonexistent scripts is wrong for this repository and must be corrected immediately.
