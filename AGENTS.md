## Cursor Cloud Instructions

### Codebase overview

BaoBuildBuddy is a Bun-first monorepo (5 workspace packages) for game-industry career automation. See `README.md` for full architecture, scripts, and troubleshooting.

| Package       | Path               | Role                                         |
|---------------|--------------------|--------------------------------------------- |
| `@bao/server` | `packages/server`  | Bun + Elysia API (port 3000)                 |
| `@bao/client` | `packages/client`  | Nuxt 4 SSR frontend (port 3001)              |
| `@bao/shared` | `packages/shared`  | Shared types, schemas, constants             |
| `@bao/scraper`| `packages/scraper` | Bun + Playwright automation and scraper exes |
| `@bao/desktop`| `packages/desktop` | Tauri desktop wrapper (optional)             |

### Key commands

- **Dev:** `bun run dev` (starts server + client in parallel)
- **Lint:** `bun run lint` (all validators + biome + eslint + typecheck)
- **Test:** `bun run test` (server bun:test + scraper bun:test + client vitest)
- **Build:** `bun run build`
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

1. **Nuxt types must be prepared before client lint.** Run `cd packages/client && bun --bun run nuxt prepare` if `.nuxt/tsconfig.json` doesn't exist. The update script handles this automatically.

2. **Server type declarations must be generated before client lint/typecheck.** Run `bun run --filter '@bao/server' build:types` first. `bun run typecheck` does this automatically but `bun run --filter '@bao/client' lint` does not.

3. **`NUXT_PUBLIC_I18N_SUPPORTED_LOCALES` must NOT be set as an env var.** Nuxt's env override replaces the parsed array with a raw string, breaking the i18n plugin. The `nuxt.config.ts` handles defaults.

4. **`better-sqlite3` is needed for `drizzle-kit push/generate`** even though the runtime uses `bun:sqlite`.

5. **`packages/server/src/db/schema/schema-modules.ts`** is the schema source; `drizzle.config.ts` points to it directly.

6. **Auth is disabled in local dev** by setting `BAO_DISABLE_AUTH=true` in `.env`.

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
