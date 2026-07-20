# Route Registration Audit — `packages/server/src/routes/`

**Date:** 2026-07-20 (docs accuracy pass)
**Scope:** 18 `*.routes.ts` modules under `packages/server/src/routes/`, plus 3 WebSocket handlers in `packages/server/src/ws/`
**Reference:** `docs/STACK-CONTRACT.md` (Drizzle + Nuxt, **Elysia 2**, Bearer API key auth)

---

## Stack cutover notes

- Runtime is **Elysia 2** (`>=2.0.0-exp.42`; workspace override pins current exp). Route registration uses **hooks-before-handler** order.
- Request/response contracts use Elysia/`typebox` `t` schemas (not baobox).
- OpenAPI is served by `@elysiajs/openapi`; operation tags come from per-route `detail.tags`.
- Canonical response schema objects live in `*-route-contracts.ts` / `route-response-registry.ts`.
- Handlers attach `response:` maps and return exclusively via Elysia `status(code, body)` (required for Elysia 2 multi-outcome typing).

---

## Route modules (HTTP)

| Module | Prefix / role |
|--------|----------------|
| `auth.routes.ts` | `/api/auth` |
| `user.routes.ts` | `/api/user` |
| `search.routes.ts` | `/api/search` |
| `jobs.routes.ts` | `/api/jobs` |
| `studio.routes.ts` | `/api/studios` |
| `resume.routes.ts` | `/api/resumes` |
| `cover-letter.routes.ts` | `/api/cover-letters` |
| `portfolio.routes.ts` | `/api/portfolio` |
| `interview.routes.ts` | `/api/interview` |
| `automation.routes.ts` | `/api/automation` |
| `automation-screenshots.routes.ts` | `/api/automation/screenshots` |
| `scraper.routes.ts` | `/api/scraper` |
| `ai.routes.ts` | `/api/ai` |
| `skill-mapping.routes.ts` | `/api/skills` |
| `gamification.routes.ts` | `/api/gamification` |
| `settings.routes.ts` | `/api/settings` |
| `stats.routes.ts` | `/api/stats` |
| `openai-v1.routes.ts` | `/v1/*` OpenAI-compatible Chat Completions |

Supporting `*-route-*.ts` files hold contracts, listing helpers, and generation support — they are not separate HTTP mounts.

## WebSocket handlers

| File | Endpoint |
|------|----------|
| `packages/server/src/ws/chat.ws.ts` | `/api/ws/chat` |
| `packages/server/src/ws/interview.ws.ts` | `/api/ws/interview` |
| `packages/server/src/ws/automation.ws.ts` | `/api/ws/automation` |

---

## Remediation status (prior findings)

| Finding | Status |
|---------|--------|
| Response schema coverage near-zero | **Fixed** — contracts + per-route `response:` maps + `status()` returns on all HTTP route families. |
| Hardcoded automation/gamification error strings | **Fixed** — `API_ERROR_*` constants |
| GET `/user/profile` write side-effect | **Fixed** — read-only; profile seeded at DB init |
| Studio `Record<string, unknown>` update bag | **Fixed** — typed `Partial<StudioInsert>` |
| Studio contract/DB field drift (`founded`, `genres`, …) | **Fixed** — contracts match Drizzle `studios` columns |
| Search empty-query shape | **Fixed** — shared `searchAllResponseSchema` |
| Legacy swagger aliases | **Removed** from `API_ENDPOINTS` |
| OpenAPI tags missing on operations | **Fixed** — per-route `detail.tags` |

---

## Auth posture

`authGuard` remains after `authRoutes` in `app.ts`. WebSocket handshakes still call `authenticateApiKey`.

---

## Verification

```bash
bun run lint
bun run typecheck
bun run test
bun run build
VERIFY_HOST=127.0.0.1 VERIFY_PORT=3001 bun run verify:pages
# or: VERIFY_BASE_URL=http://127.0.0.1:3001 bun run verify:pages
```

Prefer `127.0.0.1` over `localhost` so verification matches the IPv4 Nuxt bind used by `bun run dev`.
