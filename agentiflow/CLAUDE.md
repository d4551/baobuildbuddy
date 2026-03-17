# BaoBuildBuddy For Claude

- Read [`../AGENTS.md`](../AGENTS.md), then [`PROTOCOL001.md`](PROTOCOL001.md), [`PROTOCOL002.md`](PROTOCOL002.md), and [`PROTOCOL003.md`](PROTOCOL003.md).
- Actual stack: Bun, TypeScript strict, Nuxt 4 SSR, Tailwind 4, daisyUI 5, Elysia, Drizzle + SQLite, Playwright RPA, Tauri 2.
- Use Context7 for Bun, Tauri, Nuxt, and Playwright lookups. Use daisyui-blueprint for daisyUI component structure.
- Keep ownership boundaries intact:
  - shared contracts in `@bao/shared`
  - automation orchestration in `@bao/server`
  - browser scripts in `@bao/scraper`
  - desktop packaging in `@bao/desktop` plus `scripts/`
- Required verification baseline:
  - `bun run capability:matrix`
  - `bun run format`
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test`
  - `bun run build`
- If automation or desktop code changes, also run the relevant runtime and release verification commands.
- Do not describe HTMX, Prisma, FlatBuffers, or easy-auth as part of this repository. They are not the current BaoBuildBuddy stack.
