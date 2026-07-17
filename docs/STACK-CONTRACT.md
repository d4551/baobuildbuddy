# Stack contract (canonical)

This document overrides generic “full-stack audit” prompts that assume **Prisma**, **htmx**, or other stacks not used here.

## Authoritative runtime

| Layer | Technology | Notes |
|-------|------------|--------|
| Runtime / PM | **Bun** | `bun run *` for dev, test, lint, build |
| API | **Elysia 2** (`>=2.0.0-exp.42`) on Bun | Port **3000**; route hooks precede handlers; OpenAPI via `@elysiajs/openapi` |
| API client types | **Eden Treaty** | Generated from server |
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

- **Layout / shell:** `packages/client/constants/layout.ts` (`SHELL_MAIN_INNER_CLASS`, drawer IDs, auth shell, page header classes, empty-state stack, toast id).
- **Grids / modal widths:** `packages/client/constants/ui-layout.ts`.
- **Auth card:** static `class` on `layouts/auth-shell.vue` must stay identical to `AUTH_CARD_SHELL_CLASS` (see `validate:daisyui-contracts`).

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
```

Optional: `bun run dev` for interactive smoke (server + client).

## Agent tooling

- **daisyUI:** Prefer project MCP **daisyUI-Snippets** when the server is enabled; otherwise [daisyUI llms.txt](https://daisyui.com/llms.txt) and repo script `validate:daisyui-contracts`.
- **Context7:** Use when quota allows for library-specific questions.
