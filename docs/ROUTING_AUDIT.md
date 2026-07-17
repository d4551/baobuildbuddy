# Route Registration Audit — `packages/server/src/routes/`

**Date:** 2026-07-17 (cutover update)
**Scope:** 17 route files, HTTP routes + 3 WebSocket handlers
**Reference:** `docs/STACK-CONTRACT.md` (Drizzle + Nuxt, **Elysia 2**, Bearer API key auth)

---

## Stack cutover notes

- Runtime is **Elysia 2** (`>=2.0.0-exp.42`). Route registration uses **hooks-before-handler** order.
- Request/response contracts use Elysia/`typebox` `t` schemas (not baobox).
- OpenAPI is served by `@elysiajs/openapi`; operation tags come from per-route `detail.tags`.
- Canonical response schema objects live in `*-route-contracts.ts` / `route-response-registry.ts`.
- Handlers attach `response:` maps and return exclusively via Elysia `status(code, body)` (required for Elysia 2 multi-outcome typing).

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
VERIFY_BASE_URL=http://localhost:3001 bun run verify:pages
```
