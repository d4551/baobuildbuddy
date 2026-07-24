# Stack contract (canonical)

This document overrides generic “full-stack audit” prompts that assume **Prisma**, **htmx**, or other stacks not used here.

## BINDING: product SSOT (no dual source)

**Decision (architecture, Cycle 1):** BaoBuildBuddy SSOT is **TypeScript constants + CSS design tokens + lint validators** — **not** `.bao` archive compile.

| Concern | Canonical source | Enforced by |
|---------|------------------|-------------|
| Layout / shell / surface classes | `packages/client/constants/layout.ts` (+ `layout-tokens.ts` re-exports) | `validate:daisyui-contracts`, `validate:ui-*` |
| Grid / width / modal tokens | `packages/client/constants/ui-layout.ts` | `validate:ui-layout-tokens`, page-state validators |
| Theme / glass / motion CSS vars | `packages/client/assets/css/main.css` | `validate:ui-glass-materials`, `validate:ui-motion-tokens` |
| API paths / shared constants | `packages/shared/src/constants/*` | `validate:no-direct-route-literals`, alignment gates |
| DB schema | `packages/server/src/db/schema/schema-modules.ts` (Drizzle) | `validate:no-schema-duplication` |

**Not SSOT for this product:**

- **`.bao` archive compile / generated UI primitives** — parent-workspace Bao fabric AGENTS may mandate archives; **this repo has zero `*.bao` archives** and no compile pipeline. Do not invent a mid-cycle `.bao` migration unless product owner explicitly starts cutover.
- **`~/.bao/bao.db`** — runtime SQLite **data directory** only (`DEFAULT_DB_PATH_RELATIVE`), not a design/capability archive.
- **Prisma** — not used; ignore ambient `@prisma/client` stubs in `packages/server/types/upstream-optional-modules.d.ts` (Drizzle optional-driver typing under `skipLibCheck: false`).

If parent AGENTS and this file conflict on SSOT shape: **this document wins for BaoBuildBuddy**. Report conflict; do not dual-track.

## Authoritative runtime

| Layer | Technology | Notes |
|-------|------------|--------|
| Runtime / PM | **Bun** | `bun run *` for dev, test, lint, build |
| API | **Elysia 2** (`>=2.0.0-exp.42`, pinned `2.0.0-exp.49` via root `overrides`) on Bun | Port **3000**; `/api/*` app routes + OpenAI Chat Completions **`/v1/models`** and **`/v1/chat/completions`**; OpenAPI via `@elysiajs/openapi`. **Installed pins enforced by** `validate:stack-versions` (not `npm view` latest). Absolute user-home symlinks banned by `validate:no-abs-path-symlinks`. Peer `typebox` ≥ `1.3.8`. |
| TypeScript | **7** (`@typescript/native`) + **6.0.3** API peer | Typecheck uses TS7 native; ESLint/typescript-eslint stays on TS 6.0.3 until TS 7.1 programmatic API lands |
| `skipLibCheck` | **false** | Enforced. Upstream Elysia/Drizzle/OpenAPI `.d.ts` are marked `// @ts-nocheck` by `scripts/patch-upstream-dts-nocheck.ts` (`postinstall`) until those packages ship TS7-clean declarations. First-party source remains fully checked (`scripts/typecheck-workspace.ts`). |
| API client types | **Eden Treaty** (`@elysiajs/eden@1.4.9`) | Generated from server. **No Eden 2.x on npm** (latest/experimental still 1.x); keep Eden 1 until upstream publishes Elysia-2-compatible Eden. OpenAPI plugin is `@elysiajs/openapi@2.0.0-exp.0`. |
| Persistence | **Drizzle ORM** + **SQLite** via **`bun:sqlite`** | Schema: `packages/server/src/db/schema/schema-modules.ts`; `drizzle-kit` uses `better-sqlite3` |
| UI | **Nuxt 4** + **Vue 3** + **vue-i18n** | Port **3001** |
| Styling | **Tailwind CSS 4** + **daisyUI 5** | Themes in `packages/client/assets/css/main.css` (`corporate` default, `business` prefers-dark) |

## Non-goals (do not “migrate” without an explicit product decision)

- **Prisma** — not used; data access is Drizzle.
- **htmx** — not used; navigation and async UI use **Vue / Nuxt** (`NuxtLink`, `useAsyncData`, composables, `$fetch` / Eden).
- **Replacing** every `try`/`catch` or **all** `console.*` in one pass — server code uses structured logging and Elysia patterns; mass deletion is a separate, reviewed change.

## UI playbook mapping (htmx → Nuxt)

When an external checklist mentions htmx, use the **equivalent Nuxt/Vue behavior**:

| Playbook (htmx) | BaoBuildBuddy |
|-----------------|---------------|
| `hx-get` + `hx-target` + `hx-push-url` | `NuxtLink` / `navigateTo` + full layout; main landmark `#main-content` from `APP_MAIN_CONTENT_ID` |
| `hx-trigger` / `hx-indicator` | `useAsyncData` / `useFetch` pending state + `LoadingSpinner` / `LoadingSkeleton` |
| `hx-post` forms | `@submit` handlers + Eden/API calls + `useToast` / inline alerts |
| Server HTML partials | SSR pages + Vue components; reuse `components/ui/*` |

## Design tokens (single source)

Binding detail: see **BINDING: product SSOT** above. Consumers import constants; validators fail ad-hoc literals.

- **Layout / shell:** `packages/client/constants/layout.ts` (`SHELL_MAIN_INNER_CLASS`, drawer IDs, auth shell, page header classes, empty-state stack, toast id).
- **Grids / modal widths:** `packages/client/constants/ui-layout.ts`.
- **Auth card:** `layouts/auth-shell.vue` binds `:class="AUTH_CARD_SHELL_CLASS"` (recognized by `validate:daisyui-contracts` as a card-bearing SSOT constant).

## Shell components (DRY partials)

| Role | Location |
|------|----------|
| App shell (drawer, navbar, sidebar, main) | `packages/client/layouts/default.vue` + `AppNavbar.vue` + `AppSidebar.vue` |
| Auth shell | `packages/client/layouts/auth-shell.vue` |
| Page header | `packages/client/components/ui/PageHeaderBlock.vue` |
| Empty state | `packages/client/components/ui/EmptyState.vue` |
| Loading skeleton | `packages/client/components/ui/LoadingSkeleton.vue` |
| Toasts | `packages/client/components/ui/ToastContainer.vue` |
| Bootstrap / API error + retry | `packages/client/components/BootstrapErrorAlert.vue` (and similar patterns per feature) |

## Verification (local)

```bash
bun run lint
bun run test
bun run build
bun run validate:stack-versions
```

**Biome exception (scripts only):** `scripts/browser-record-product-demo.ts` may disable `performance/noAwaitInLoops` because headed Playwright capture must poll UI sequentially (parallel `Promise.all` races the DOM). Product/runtime packages keep the rule as `error`.

Optional interactive stack: `bun run dev` (server + client; Nuxt on `127.0.0.1:3001` by default).

Browser UI proof (Playwright; requires running client):

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
```

Contract-escalation note for parent `.bao`-archive playbooks: [`ssot-ledger/contract-escalation-2026-07-20.md`](./ssot-ledger/contract-escalation-2026-07-20.md).

## Agent tooling

- **daisyUI:** Prefer project MCP **daisyUI-Snippets** when the server is enabled; otherwise [daisyUI llms.txt](https://daisyui.com/llms.txt) and repo script `validate:daisyui-contracts`.
- **Context7:** Use when quota allows for library-specific questions; if MCP quota is exceeded, use `bun run audit:official-llms` + official `llms.txt` URLs as the safe equivalent.
- **brutalise / parent fabric scanners:** May reject `/workspace` as outside allowed roots. Do not invent `.bao` archives to satisfy them; rely on this contract’s validators (`bun run lint`) and browser proof scripts.
