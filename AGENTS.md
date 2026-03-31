## Cursor Cloud Instructions

### Codebase overview

BaoBuildBuddy is a Bun-first monorepo (5 workspace packages) for game-industry career automation. See `README.md` for full architecture, scripts, and troubleshooting. **Canonical stack vs generic prompts:** [`docs/STACK-CONTRACT.md`](docs/STACK-CONTRACT.md) (Drizzle + Nuxt/Vue, not Prisma/htmx).

| Package       | Path               | Role                                         |
|---------------|--------------------|--------------------------------------------- |
| `@bao/server` | `packages/server`  | Bun + Elysia API (port 3000)                 |
| `@bao/client` | `packages/client`  | Nuxt 4 SSR frontend (port 3001)              |
| `@bao/shared` | `packages/shared`  | Shared types, schemas, constants             |
| `@bao/scraper`| `packages/scraper` | Bun + Playwright automation and scraper exes |
| `@bao/desktop`| `packages/desktop` | Tauri desktop shell (optional)               |

**Stack truth:** Client data fetching uses **Vue / Nuxt** (`NuxtLink`, `useAsyncData`, composables), not htmx. The ORM is **Drizzle**, not Prisma. Themes are defined once in `packages/client/assets/css/main.css` via daisyUI **`corporate` (light, default) and `business` (prefers-dark)**; `useTheme` + `data-theme` on the shell keep persistence/settings in sync, and the navbar uses daisyUI **`swap swap-rotate`** with **`input.theme-controller[value="business"]`**. See `docs/feature-trace-matrix.md` for route-to-page mapping.

**Design tokens (single source):** Semantic colors/spacing use **daisyUI + Tailwind scale only** (no palette literals like `bg-slate-*`). Layout constants live in `packages/client/constants/layout.ts` (`SHELL_MAIN_INNER_CLASS`, `APP_DRAWER_ID`, `APP_MAIN_CONTENT_ID`, `AUTH_SHELL_OUTER_CLASS`, `AUTH_CARD_SHELL_CLASS` — must match the static `card` classes on `layouts/auth-shell.vue` for `validate:daisyui-contracts`, `PAGE_HEADER_*`, `EMPTY_STATE_STACK_CLASS`, `TOAST_CONTAINER_DOM_ID`). Grid width/spacing tokens = `constants/ui-layout.ts`. Authenticated chrome = `layouts/default.vue`; centered flows = `layouts/auth-shell.vue`. Navbar section crumbs = `useNavbarBreadcrumbs` + `resolveLongestMatchingSidebarNavItem`. **htmx / `hx-*` in the pasted playbook are not used**—mirror those patterns with Vue async state (loading / empty / error / success) where product requirements call for it.

### Key commands

- **Dev:** `bun run dev` (starts server + client in parallel)
- **Lint:** `bun run lint` (all validators + biome + eslint + typecheck)
- **Test:** `bun run test` (server bun:test + scraper bun:test + client vitest)
- **Build:** `bun run build` (optional stricter check: `bun run build:verify` runs the web build then `verify:production-client` to ensure Nitro SSR output ships without `.map` leakage)
- **DB setup:** `bun run db:generate && bun run db:push`

### Local AI setup

The app auto-detects models from local inference servers. Install Ollama and pull a model:

```bash
ollama serve &
ollama pull qwen2.5:0.5b
```

Then configure via Settings UI or API: set `localModelEndpoint` to `http://localhost:11434/v1`. The model name is auto-detected from the server -- no hardcoded defaults.

Cloud provider keys (HuggingFace, OpenAI, Gemini, Claude) are optional and can be added via **Settings > AI Providers** in the UI.

### Gotchas

1. **Client lint/typecheck self-bootstrap Nuxt + server types.** `packages/client` now prepares `.nuxt` and runs `packages/server` `build:types` automatically before client lint/typecheck, so clean clones and CI runners do not need a manual prep step.

2. **Standalone client checks are deterministic.** `bun run --filter '@bao/client' lint` and `bun run --filter '@bao/client' typecheck` both bootstrap the generated server declarations and Nuxt types they depend on.

3. **`NUXT_PUBLIC_I18N_SUPPORTED_LOCALES` must NOT be set as an env var.** Nuxt's env override replaces the parsed array with a raw string, breaking the i18n plugin. The `nuxt.config.ts` handles defaults.

4. **`better-sqlite3` is needed for `drizzle-kit push/generate`** even though the runtime uses `bun:sqlite`.

5. **`packages/server/src/db/schema/schema-modules.ts`** is the schema source; `drizzle.config.ts` points to it directly.

6. **Auth is disabled only when explicitly requested.** Set `BAO_DISABLE_AUTH=true` in `.env` for local dev, or keep auth enabled and provide `BAO_AUTH_SETUP_TOKEN` for first-run onboarding.

7. **No external database needed.** SQLite is embedded via `bun:sqlite`; the DB file is at `~/.bao/bao.db`.

8. **Local AI model is auto-detected.** When `localModelEndpoint` is set but `localModelName` is empty, the server queries `GET /v1/models` and uses the first available model.

9. **Speech model defaults are derived from provider.** `DEFAULT_SPEECH_SETTINGS` reads from `SPEECH_MODEL_OPTIONS[provider][0]`. Switching provider auto-updates the model.

10. **Bun/TS RPA uses Playwright.** Run `bun run automation:browsers:install` after `bun install` to install Chromium.

11. **`AUTOMATION_STDIO_BUFFER_LIMIT`** defaults to 200 lines. Set to `2000` in `.env` for large scraper outputs.

12. **Job provider settings must be configured** via `PUT /api/settings` with `automationSettings.jobProviders` before `POST /api/jobs/refresh` returns results. See README.md.

13. **RPA scrapers** use Playwright DOM selectors. Current status (Feb 2026):
    - **GrackleHQ**: Working (30+ jobs)
    - **WorkWithIndies**: Working (60+ jobs)
    - **RemoteGameJobs**: Working (41+ jobs)
    - **Hitmarker**: Working (primary active feed)
    - **GamesJobsDirect**: Working
    - **PocketGamer**: Working
    - **Greenhouse API**: Working (168+ jobs with full descriptions via `content=true`)
    - **Lever API**: Working

14. **Gamification is wired into all routes.** XP awards: resume (30), cover letter (30), portfolio (35), interview (75), job save (10), job apply (40), skill mapping (15). Achievement checking triggers automatically.

15. **Tauri desktop** requires Rust toolchain (`rustc` + `cargo`).

16. **Desktop release verify:** `bun run verify:desktop-releases -- --release` on macOS enforces **`xcrun stapler validate`** (stapled/notarized DMG). Checkouts with an unstapled DMG under `packages/desktop/releases` should run **`bun run verify:desktop-releases`** without `--release` for full payload + checksum checks. CI keeps `--release` after a proper notarized build.

17. **External “full-stack audit” prompts** often assume **Prisma + htmx**. This repo does **not** use those. Treat [`docs/STACK-CONTRACT.md`](docs/STACK-CONTRACT.md) as binding; map playbook items to **Drizzle + Nuxt/Vue** (see the htmx→Nuxt table there). Do not start a framework migration unless the product owner explicitly requests it.
