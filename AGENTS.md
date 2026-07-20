## Cursor Cloud Instructions

### Codebase overview

BaoBuildBuddy is a Bun-first monorepo (5 workspace packages) for game-industry career automation. See `README.md` for full architecture, scripts, and troubleshooting. **Canonical stack vs generic prompts:** [`docs/STACK-CONTRACT.md`](docs/STACK-CONTRACT.md) (Drizzle + Nuxt/Vue, not Prisma/htmx).

**BINDING SSOT (no dual source):** Design tokens, layout classes, grids, and API path constants live in **`packages/client/constants/*`**, **`packages/client/assets/css/main.css`**, and **`packages/shared/src/constants/*`**, enforced by `bun run lint` validators (`validate:ui-ssot`, `validate:daisyui-contracts`, etc.). This product does **not** use `.bao` archive compile as SSOT (zero `*.bao` archives in-tree). `~/.bao/bao.db` is the SQLite data file only. Parent-workspace AGENTS that mandate `.bao` archives do **not** override [`docs/STACK-CONTRACT.md`](docs/STACK-CONTRACT.md) for this repo.

| Package       | Path               | Role                                         |
|---------------|--------------------|--------------------------------------------- |
| `@bao/server` | `packages/server`  | Bun + Elysia API (port 3000)                 |
| `@bao/client` | `packages/client`  | Nuxt 4 SSR frontend (port 3001)              |
| `@bao/shared` | `packages/shared`  | Shared types, schemas, constants             |
| `@bao/scraper`| `packages/scraper` | Bun + Playwright automation and scraper exes |
| `@bao/desktop`| `packages/desktop` | Tauri desktop shell (optional)               |

**Stack truth:** Client data fetching uses **Vue / Nuxt** (`NuxtLink`, `useAsyncData`, composables), not htmx. The ORM is **Drizzle**, not Prisma. Themes are defined once in `packages/client/assets/css/main.css` via daisyUI **`corporate` (light, default) and `business` (prefers-dark)**; `useTheme` + `data-theme` on the shell keep persistence/settings in sync, and the navbar uses daisyUI **`swap swap-rotate`** with **`input.theme-controller[value="business"]`**. See `docs/feature-trace-matrix.md` for route-to-page mapping.

**Design tokens (single source):** Semantic colors/spacing use **daisyUI + Tailwind scale only** (no palette literals like `bg-slate-*`). Layout constants live in `packages/client/constants/layout.ts` (`SHELL_MAIN_INNER_CLASS`, `APP_DRAWER_ID`, `APP_MAIN_CONTENT_ID`, `AUTH_SHELL_OUTER_CLASS`, `AUTH_CARD_SHELL_CLASS` via `:class` on `layouts/auth-shell.vue`, `PAGE_HEADER_*`, `EMPTY_STATE_STACK_CLASS`, `TOAST_CONTAINER_DOM_ID`). Grid width/spacing tokens = `constants/ui-layout.ts`. Authenticated chrome = `layouts/default.vue`; centered flows = `layouts/auth-shell.vue`. Navbar section crumbs = `useNavbarBreadcrumbs` + `resolveLongestMatchingSidebarNavItem`. **htmx / `hx-*` in the pasted playbook are not used**—mirror those patterns with Vue async state (loading / empty / error / success) where product requirements call for it.

### Key commands

- **Dev:** `bun run dev` (starts server + client via `scripts/dev-stack.ts`; Nuxt host defaults to **`127.0.0.1`** so Playwright can reach the UI)
- **Lint:** `bun run lint` (all validators + biome + eslint + typecheck)
- **Test:** `bun run test` (server bun:test + scraper bun:test + client vitest)
- **Build:** `bun run build` (optional stricter check: `bun run build:verify` runs the web build then `verify:production-client` to ensure Nitro SSR output ships without `.map` leakage)
- **DB setup:** `bun run db:generate && bun run db:push`
- **Browser UI proof (Playwright only; not curl):** with stack up, `PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke` then `bun run proof:browser-burndown` (viewport order mobile → tablet → desktop)
- **SSR HTML check:** `bun run verify:pages`
- **Stack pins:** `bun run validate:stack-versions` (binding); `audit:stack-versions` is advisory npm-latest only

### Local AI setup

The app auto-detects models from local inference servers. Install Ollama and pull a model:

```bash
ollama serve &
ollama pull llama3.2   # or any model, e.g. qwen2.5:0.5b for a tiny smoke test
```

Then configure via Settings UI or API: set `localModelEndpoint` to `http://localhost:11434/v1` (or `http://127.0.0.1:11434/v1`). The model name is auto-detected from the server -- no hardcoded defaults.

Cloud provider keys (HuggingFace, OpenAI, Gemini, Claude) are optional and can be added via **Settings > AI Providers** in the UI.

### Gotchas

1. **Client lint/typecheck/test self-bootstrap Nuxt + server types.** `packages/client` prepares `.nuxt` and runs `packages/server` `build:types` automatically before client lint, typecheck, **and test**, so clean clones and CI runners do not need a manual prep step.

2. **Standalone client checks are deterministic.** `bun run --cwd packages/client lint`, `bun run --cwd packages/client typecheck`, and `bun run --cwd packages/client test` all bootstrap the generated server declarations and Nuxt types they depend on.

3. **`NUXT_PUBLIC_I18N_SUPPORTED_LOCALES` must NOT be set as an env var.** Nuxt's env override replaces the parsed array with a raw string, breaking the i18n plugin. The `nuxt.config.ts` handles defaults.

4. **`better-sqlite3` is needed for `drizzle-kit push/generate`** even though the runtime uses `bun:sqlite`.

5. **`packages/server/src/db/schema/schema-modules.ts`** is the schema source; `drizzle.config.ts` points to it directly.

6. **Auth is disabled only when explicitly requested.** Set `BAO_DISABLE_AUTH=true` in `.env` for local dev, or keep auth enabled and provide `BAO_AUTH_SETUP_TOKEN` for first-run onboarding.

7. **No external database needed.** SQLite is embedded via `bun:sqlite`; the DB file is at `~/.bao/bao.db`.

8. **Local AI model is auto-detected.** When `localModelEndpoint` is set but `localModelName` is empty, the server queries `GET /v1/models` and uses the first available model.

9. **Speech model defaults are derived from provider.** `DEFAULT_SPEECH_SETTINGS` reads from `SPEECH_MODEL_OPTIONS[provider][0]`. Switching provider auto-updates the model.

10. **Bun/TS RPA uses Playwright.** Run `bun run automation:browsers:install` after `bun install` to install Chromium. Polluted `PLAYWRIGHT_BROWSERS_PATH` (Cursor sandbox marker or missing dir) is resolved by pure helpers in `@bao/shared/utils/playwright-browsers-path`; server `config/paths.ts` and scraper `runtime/config.ts` are the only `process.env` adapters.

11. **`BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS=true`** is the sole SSRF private-host opt-in for job-apply URL validation (default deny). Do not set in production. Integration fixtures set it explicitly; `BAO_ENABLE_AUTOMATION_VERIFY` no longer gates private hosts.

12. **`AUTOMATION_STDIO_BUFFER_LIMIT`** defaults to 200 lines. Set to `2000` in `.env` for large scraper outputs.

13. **Job provider settings must be configured** via `PUT /api/settings` with `automationSettings.jobProviders` before `POST /api/jobs/refresh` returns results. See README.md.

14. **RPA scrapers** use Playwright DOM selectors. Current status (Feb 2026):
    - **GrackleHQ**: Working (30+ jobs)
    - **WorkWithIndies**: Working (60+ jobs)
    - **RemoteGameJobs**: Working (41+ jobs)
    - **Hitmarker**: Working (primary active feed)
    - **GamesJobsDirect**: Working
    - **PocketGamer**: Working
    - **Greenhouse API**: Working (168+ jobs with full descriptions via `content=true`)
    - **Lever API**: Working

15. **Gamification is wired into all routes.** XP awards: resume (30), cover letter (30), portfolio (35), interview (75), job save (10), job apply (40), skill mapping (15). Achievement checking triggers automatically.

16. **Tauri desktop** requires Rust toolchain (`rustc` + `cargo`).

17. **Desktop release verify:** `bun run verify:desktop-releases -- --release` on macOS enforces **`xcrun stapler validate`** (stapled/notarized DMG). Checkouts with an unstapled DMG under `packages/desktop/releases` should run **`bun run verify:desktop-releases`** without `--release` for full payload + checksum checks. CI keeps `--release` after a proper notarized build.

18. **External “full-stack audit” prompts** often assume **Prisma + htmx** or **`.bao` archive compile as UI SSOT**. This repo does **not** use those. Treat [`docs/STACK-CONTRACT.md`](docs/STACK-CONTRACT.md) as binding (see also [`docs/ssot-ledger/contract-escalation-2026-07-20.md`](docs/ssot-ledger/contract-escalation-2026-07-20.md)); map playbook items to **Drizzle + Nuxt/Vue** and TS/CSS token SSOT. Do not start a framework or `.bao` migration unless the product owner explicitly requests it.

19. **Nuxt `--host localhost` can bind IPv6-only** (`[::1]:3001`), which makes `http://127.0.0.1:3001` unreachable for Playwright. Prefer `bun run dev` / `dev-stack` (IPv4 default) or pass `--host 127.0.0.1`.

20. **UI visual proof ≠ API curl.** Use `proof:browser-smoke` / `proof:browser-burndown` (and human review via `docs/PAGE_VERIFICATION_GUIDE.md`). Curl is fine for `/api/health` and similar API checks only.

21. **Workspace Bun pin** is `packageManager` / engines in root `package.json` (currently `bun@1.3.14`).
