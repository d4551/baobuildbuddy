# Route Registration Audit — `packages/server/src/routes/`

**Date:** 2026-07-08
**Scope:** 17 route files, 99 HTTP routes, 3 WebSocket handlers
**Reference:** `docs/STACK-CONTRACT.md` (Drizzle + Nuxt, Elysia 1.x, Bearer API key auth)

---

## Summary

| File | Routes | Response Schemas | Body Schemas | Rate Limited |
|---|---|---|---|---|
| `ai.routes.ts` | 7 | 0 | 7 | yes (25/min) |
| `auth.routes.ts` | 4 | 0 | 1 | yes (bootstrap) |
| `automation.routes.ts` | 10 | 10 | 10 | yes |
| `automation-screenshots.routes.ts` | 1 | 1 | 1 (params) | no |
| `cover-letter.routes.ts` | 7 | 0 | 7 | no |
| `gamification.routes.ts` | 7 | 0 | 1 | no |
| `interview.routes.ts` | 6 | 0 | 6 | no |
| `jobs.routes.ts` | 10 | 0 | 10 | no |
| `portfolio.routes.ts` | 7 | 0 | 7 | no |
| `resume.routes.ts` | 10 | 0 | 10 | no |
| `scraper.routes.ts` | 2 | 0 | 1 | no |
| `search.routes.ts` | 2 | 0 | 2 | no |
| `settings.routes.ts` | 7 | 0 | 7 | yes (read/write split) |
| `skill-mapping.routes.ts` | 7 | 0 | 7 | yes (analysis) |
| `stats.routes.ts` | 3 | 0 | 0 | no |
| `studio.routes.ts` | 7 | 0 | 7 | no |
| `user.routes.ts` | 2 | 0 | 1 | no |
| **Total** | **99** | **11** | **89** | — |

**Auth posture (good):** `authGuard` is correctly placed AFTER `authRoutes` in `app.ts:170` so all non-auth, non-health routes inherit the `onBeforeHandle` Bearer check. `authenticateApiKey` is also invoked explicitly in all three WebSocket handshakes (`chat.ws.ts`, `automation.ws.ts`, `interview.ws.ts`).

**`API_ENDPOINTS` coverage (good):** No hardcoded `/api/...` prefixes in any route file. All prefixes use `toApiScopedPath(API_ENDPOINTS.xxx)`. The only literal path inside a route file is `"/api-keys"` in `settings.routes.ts:114`, which is a relative child of the `/api/settings` prefix already applied — correct.

---

## Findings (severity-ranked)

### 🔴 CRITICAL — Response schema coverage is 11 / 99 (11%)

**Files affected:** 15 of 17 route files declare **zero** response schemas. Only `automation.routes.ts` (10) and `automation-screenshots.routes.ts` (1) declare `response:` keys.

**Why this is critical:**
1. OpenAPI/Swagger docs at `/api/docs/api` cannot enumerate success/error envelopes — clients break silently on shape changes.
2. Runtime response validation is disabled — handlers can return any shape and the server accepts it.
3. The `ErrorResponse` model is defined at `app.ts:118` but no route declares a 4xx/5xx response shape that references it.

**Per-file gap:**

| File | Body schema | Response schema | Risk |
|---|---|---|---|
| `ai.routes.ts` | ✓ (7) | ✗ | LLM response shape can drift; client crashes |
| `auth.routes.ts` | partial (1/4) | ✗ | Bootstrap error path `API_ERROR_AUTH_SETUP_TOKEN_INVALID` not typed |
| `cover-letter.routes.ts` | ✓ (7) | ✗ | Mutation responses (`createCoverLetter`, `updateCoverLetter`) unchecked |
| `gamification.routes.ts` | partial (1/7) | ✗ | XP award envelope returns ad-hoc object literal |
| `interview.routes.ts` | ✓ (6) | ✗ | Session create/complete/response shapes undeclared |
| `jobs.routes.ts` | ✓ (10) | ✗ | `POST /refresh` error envelope hand-rolled |
| `portfolio.routes.ts` | ✓ (7) | ✗ | Project CRUD responses undeclared |
| `resume.routes.ts` | ✓ (10) | ✗ | AI-score / enhance / export response undeclared |
| `scraper.routes.ts` | partial (1/2) | ✗ | Error envelope returns `portalId` in user-facing string |
| `search.routes.ts` | ✓ (2) | ✗ | Empty-query early-return shape diverges from typed search response |
| `settings.routes.ts` | ✓ (7) | ✗ | Provider test / import / export shapes undeclared |
| `skill-mapping.routes.ts` | ✓ (7) | ✗ | `deleteSkillMappingById` returns `status(code, payload)` outside schema |
| `stats.routes.ts` | ✗ (0) | ✗ | All three reads are completely untyped at route boundary |
| `studio.routes.ts` | ✓ (7) | ✗ | `analytics` returns hand-rolled aggregation object |
| `user.routes.ts` | partial (1/2) | ✗ | Auto-create default profile path returns ad-hoc literal |

**Fix template (apply to every route in every file):**
```ts
.post(
  "/path",
  async ({ body, set }) => handler(body, set),
  {
    body: StandardSchemaV1(bodySchema),
    response: {
      [HTTP_STATUS_OK]: StandardSchemaV1(responseOkSchema),
      [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
      [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
      [HTTP_STATUS_UNPROCESSABLE_ENTITY]: StandardSchemaV1(routeErrorBodySchema),
    },
  },
)
```

The error-envelope pattern already lives in `automation-route-contracts.ts`. Extract it to `packages/shared/src/contracts/route-error-envelope.bao` and import across all 15 files.

---

### 🟠 HIGH — Hardcoded error strings instead of `@bao/shared/constants/api-errors`

Multiple handlers return raw string errors instead of typed constants. This breaks i18n, telemetry, and the `ErrorResponse` model contract.

**Locations:**
- `gamification.routes.ts:27` → `return { error: "amount and reason are required." };`
- `automation.routes.ts:95` → `"jobUrl and resumeId are required."`
- `automation.routes.ts:126` → `"jobUrl, resumeId, and runAt are required."`
- `automation.routes.ts:158` → `"subject and message are required."`
- `automation.routes.ts:204` → `"subject, message, and runAt are required."`
- `automation.routes.ts:239` → `"target is required."`
- `automation.routes.ts:261` → `"target and runAt are required."`
- `automation.routes.ts:293` → `"id is required."`

**Fix:** Add `API_ERROR_*` constants in `packages/shared/src/constants/api-errors.ts` and reference them. The other ~30 endpoints already do this correctly — these eight are drift.

---

### 🟠 HIGH — `scraper.routes.ts` reflects user input in error message

`scraper.routes.ts:47`:
```ts
details: `Unsupported scraper portal: ${params.portalId}`,
```

`params.portalId` is already validated by `scraperPortalParamsSchema` (a regex literal set), so this is currently safe — but the message is shaped inconsistently with other handlers (no `API_ERROR_*` prefix, raw string interpolation). Move to a constant:

```ts
import { API_ERROR_UNSUPPORTED_SCRAPER_PORTAL } from "@bao/shared/constants/api-errors";
// ...
return { error: API_ERROR_UNSUPPORTED_SCRAPER_PORTAL, details: { portalId: params.portalId } };
```

---

### 🟡 MEDIUM — `stats.routes.ts` has zero schema coverage (body **and** response)

`stats.routes.ts` registers three GET handlers with no `query:` and no `response:` schema. The service layer (`statisticsService.getDashboardStats()`) returns `Record<string, unknown>` shapes that are never validated at the route boundary.

**Fix:** Define `statsDashboardResponseSchema`, `statsWeeklyResponseSchema`, `statsCareerResponseSchema` in a new `stats-route-contracts.ts` and declare them as `response:` keys.

---

### 🟡 MEDIUM — `user.routes.ts` PUT replaces whole body, no PATCH

`user.routes.ts:34-54` accepts a full `UserProfileUpdateRouteBody` and overwrites `userProfile` with `{ ...body }`. If the client omits a field it is dropped, not preserved. Compare to `studio.routes.ts:119-149` which iterates `Object.entries(body)` and only updates keys where `val !== undefined`.

Either change to PATCH semantics (loop + skip undefined, like studios) or document the PUT-as-replace contract on the OpenAPI tag.

---

### 🟡 MEDIUM — `studio.routes.ts:136` uses `Record<string, unknown>` for the update bag

```ts
const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
```

This satisfies the runtime but defeats the schema. Apply the typed `StudioUpdateBody` keys explicitly:

```ts
const updates: Partial<typeof studios.$inferInsert> = { updatedAt: new Date().toISOString() };
for (const [key, val] of Object.entries(body)) {
  if (val !== undefined && key in studios) updates[key as keyof typeof studios.$inferInsert] = val;
}
```

---

### 🟡 MEDIUM — `user.routes.ts` auto-inserts a default profile row on first GET

`user.routes.ts:17-32` inserts a default empty profile if none exists. This is a write side-effect on a GET, which:
1. Violates HTTP semantics (GET must be safe + idempotent).
2. Will create a row even for an unauthenticated request if auth is disabled.
3. Returns the in-memory object (`defaultProfile`) instead of the persisted row, so `updatedAt` and any DB defaults are missing.

**Fix:** Move profile creation to an explicit `POST /api/user/profile` (init) or to a startup hook in `db/client.ts`. Keep GET read-only.

---

### 🟡 MEDIUM — Rate-limit gaps on mutating routes

Only the AI, auth-bootstrap, settings, automation, and skill-mapping analysis endpoints have explicit rate limits. The following mutating route families are unprotected beyond the global limit:

- `POST /api/jobs/save`, `POST /api/jobs/apply`, `PUT /api/jobs/apply/:id`
- `POST /api/resumes`, `PUT /api/resumes/:id`, `POST /api/resumes/:id/ai-enhance`, `POST /api/resumes/:id/ai-score`
- `POST /api/cover-letters`, `POST /api/cover-letters/:id/ai-enhance`
- `POST /api/portfolio/projects`, `PUT /api/portfolio/projects/:id`
- `POST /api/studios`, `PUT /api/studios/:id`
- `POST /api/interview/sessions`, `POST /api/interview/sessions/:id/response`

The global limit (`RATE_LIMIT_GLOBAL_MAX_REQUESTS` in `config/rate-limit.ts`) is the only barrier. A user can hammer `/jobs/refresh` or `/ai/match-jobs` until the global cap trips.

**Fix:** Add per-route-family rate limits using the `RATE_LIMIT_*` constants pattern from `settings.routes.ts:45-63`. Suggested: 10/min for mutations, 30/min for AI-adjacent reads.

---

### 🟡 MEDIUM — `search.routes.ts` early-return shape diverges from typed search response

`search.routes.ts:33-41` returns a hand-built empty envelope `{ query, results: [], counts: {...}, totalTime: 0 }` when `q.length < 2`, while the success path returns whatever `searchService.searchAll()` produces. The two shapes must be identical for client code that reads `response.results`.

**Fix:** Define `searchAllResponseSchema` in `search-route-contracts.ts` and use it for both branches.

---

### 🟢 LOW — `interview.routes.ts` derives fields on every read

`interview.routes.ts:39-42`:
```ts
.get("/sessions", async () => {
  const sessions = await interviewService.getSessions();
  return Promise.all(sessions.map(sessionWithDerivedFields));
})
```

`sessionWithDerivedFields` is called per-session. If the list grows large this becomes N+1 DB hits. Verify it is in-memory only; if it triggers `interviewService.getSessionById(id)` per row, switch to a batch fetch + join.

---

### 🟢 LOW — `cover-letter.routes.ts` AI endpoints not rate-limited

`cover-letter.routes.ts` has no rate-limit middleware despite exposing AI endpoints (`POST /:id/ai-enhance`). The global cap is the only defense. Apply the same `MS_PER_MINUTE / 25` pattern as `ai.routes.ts:33-40`.

---

### 🟢 LOW — Inconsistent tag set across routes

Tags declared on routes: `AI`, `Auth`, `User`, `Settings`, `Jobs`, `Resumes`, `Cover Letters`, `Portfolio`, `Interview`, `Studios`, `Scraper`, `AI`, `Gamification`, `Skill Mapping`, `Search`, `Stats`, `Automation`. The `OPENAPI_TAGS` array in `app.ts:62-80` mirrors this set but `automation-screenshots.routes.ts` has tag `["Automation"]` — verify the screenshots sub-routes also tag as `Automation` for grouping, not a separate tag.

---

### 🟢 LOW — `/api/docs/api` mount point duplicated in legacy aliases

`API_ENDPOINTS` exposes `apiDocsUi` / `apiDocsJson` alongside `apiDocsUiLegacy` / `apiDocsJsonLegacy`. Confirm the legacy aliases are 301-redirected or removed; if both serve Swagger UI the OpenAPI client generators will pick one arbitrarily.

---

## Endpoints missing from `API_ENDPOINTS`

None observed — every route prefix resolves through `API_ENDPOINTS.*`. The pattern is consistent across all 17 files.

## Endpoints in `API_ENDPOINTS` missing from routes

Quick scan: `health`, `auth.*`, `user.*`, `settings.*`, `jobs.*` (10 children all registered), `resumes.*`, `coverLetters.*`, `portfolio.*`, `interview.*`, `studios.*`, `scraper.*`, `ai.*`, `gamification.*`, `skills.*`, `search.*`, `stats.*`, `automation.*`, `automationScreenshots.*` — all present.

No orphan endpoints.

---

## Recommended remediation order

1. **CRITICAL — Response schemas (15 files).** Extract shared error envelope to `packages/shared/src/contracts/route-error-envelope.bao`, then mechanically add `response:` keys to every route. This unlocks real OpenAPI docs and runtime validation.
2. **HIGH — Replace 8 hardcoded error strings with `API_ERROR_*` constants.**
3. **HIGH — Decouple user-profile GET from write side-effect.**
4. **MEDIUM — Add per-route-family rate limits to mutations + AI-adjacent reads.**
5. **MEDIUM — Tighten `studio.routes.ts` update typing.**
6. **LOW — Verify interview N+1, cover-letter AI rate-limit, tag consistency.**

Estimated effort: 6–8 hours for the CRITICAL pass alone (mechanical schema add), 2 hours for HIGHs, 4 hours for MEDIUMs.