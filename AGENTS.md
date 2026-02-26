## Cursor Cloud specific instructions

### Codebase overview

BaoBuildBuddy is a Bun-first monorepo (4 packages) for game-industry career automation. See `README.md` for full architecture, scripts, and troubleshooting.

| Package | Path | Role |
|---------|------|------|
| `@bao/server` | `packages/server` | Bun + Elysia API (port 3000) |
| `@bao/client` | `packages/client` | Nuxt 4 SSR frontend (port 3001) |
| `@bao/shared` | `packages/shared` | Shared types, schemas, constants |
| `@bao/desktop` | `packages/desktop` | Tauri desktop wrapper (optional) |

### Key commands

Standard commands are in `README.md` Section 10.4. The essentials:

- **Dev:** `bun run dev` (starts server + client in parallel)
- **Lint:** `bun run lint` (runs all validators + biome + eslint + typecheck)
- **Test:** `bun run test` (server bun:test + client vitest)
- **Build:** `bun run build`
- **DB setup:** `bun run db:generate && bun run db:push`

### Non-obvious gotchas

1. **Nuxt types must be prepared before client lint.** Run `cd packages/client && bun --bun run nuxt prepare` if `.nuxt/tsconfig.json` doesn't exist. The update script handles this automatically.

2. **Server type declarations must be generated before client lint/typecheck.** Run `bun run --filter '@bao/server' build:types` first. The `bun run typecheck` script does this automatically but `bun run --filter '@bao/client' lint` does not.

3. **`NUXT_PUBLIC_I18N_SUPPORTED_LOCALES` must NOT be set as an env var at runtime.** Nuxt's env override system replaces the parsed array with a raw comma-separated string, breaking the i18n plugin. The `nuxt.config.ts` handles defaults. Other `NUXT_PUBLIC_I18N_*` string env vars are fine.

4. **`better-sqlite3` is needed for `drizzle-kit push/generate`** even though the runtime uses `bun:sqlite`. It's a dev dependency in the root `package.json`.

5. **`packages/server/src/db/schema/index.ts`** is a barrel re-export from `schema-modules.ts`, required by `drizzle.config.ts`. If missing, `db:generate` and `db:push` fail.

6. **Auth is disabled in local dev** by setting `BAO_DISABLE_AUTH=true` in `.env`.

7. **No external database needed.** SQLite is embedded via `bun:sqlite`; the DB file is at `~/.bao/bao.db` by default.

8. **AI features require at least one provider key** (or local model endpoint). The app runs without them but AI-powered features (chat, interview, resume review) won't function. HuggingFace free tier now requires an API token (set `HUGGINGFACE_TOKEN` in `.env` or via Settings UI).

9. **Python/RPA is optional.** The scraper package requires Python 3.10+ and Chrome, but the rest of the app works without it.

10. **RPA/TagUI requires `OPENSSL_CONF=/dev/null`** in containerized environments. Without this, OpenSSL 3.x fails to load `libproviders.so` and TagUI cannot initialize Chrome. Set this in `.env` and ensure the server process inherits it.

11. **RPA requires PHP CLI** (`php-cli` package) for TagUI's parsing engine. Install via `sudo apt-get install -y php-cli`.

12. **`PYTHON_BINARY` env var** should point to the venv Python (e.g., `/workspace/.venv/bin/python3`) so the server's `rpa-runner.ts` uses the correct Python with RPA packages installed.

13. **`AUTOMATION_STDIO_BUFFER_LIMIT`** defaults to 200 lines. Large scraper outputs (e.g., studio scraper with 1300+ lines) get truncated. Set to `2000` in `.env` for full output.

14. **Job provider settings must be configured** via `PUT /api/settings` before `POST /api/jobs/refresh` returns results. The `automationSettings.jobProviders` object must include Greenhouse boards, Lever companies, and ATS templates. See `README.md` Section 9.4.

15. **RPA gaming board scrapers** (GameDev.net, GrackleHQ, etc.) depend on current website DOM structures. The RPA infrastructure works but individual scrapers may return empty results when site layouts change — this is expected and scrapers need selector updates.
