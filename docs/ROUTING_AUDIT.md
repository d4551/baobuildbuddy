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
  Wiring `response:` maps onto handlers is deferred where Elysia 2 type inference collapses multi-outcome handlers to `Response` (schemas remain SSOT for future `status()` migration).

---

## Remediation status (prior findings)

| Finding | Status |
|---------|--------|
| Response schema coverage near-zero | **Contracts added** for all route families; registry keeps schemas live. Handler `response:` maps deferred for Elysia 2 typing. |
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
