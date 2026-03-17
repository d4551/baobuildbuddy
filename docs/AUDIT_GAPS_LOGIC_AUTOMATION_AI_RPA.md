# Audit: Logic, Automation & AI × RPA Capability Gaps

Trace-based audit of logic gaps, automation orchestration issues, and AI×RPA integration weaknesses. Excludes security (see `AUDIT_WEAKNESSES.md`).

---

## Resolved (2026-03-17)

- **1.1 RPA Progress Event:** `application-automation-service.ts` now uses `rpaProgressEventSchema.safeParse()`; returns fallback on failure.
- **1.2 Automation Script ID:** `scraper-service.ts` uses `automationScriptIdSchema.safeParse()`; throws `API_ERROR_INVALID_SCRIPT_ID` on failure.
- **1.3 Smart Field Mapper:** `resolveAutofillAnalysis` logs when skipping (enableSmartSelectors off, AI unavailable) or when result is empty.
- **2.1 Playwright Retries:** `job-apply/runtime.ts` uses `withRetry` for fill, click, page.goto with exponential backoff.
- **2.4 Job Refresh:** `index.ts` runs initial `refreshJobs()` on startup before the 6h interval.
- **Job Providers:** Greenhouse, Lever, CompanyBoard use `safeParseJson` instead of `response.json()`.

---

## 1. Logic Gaps

### 1.1 RPA Progress Event Validation — RESOLVED

| File | Line | Issue |
|------|------|-------|
| `application-automation-service.ts` | 374 | ~~`rpaProgressEventSchema.parse(event)` throws~~ Now uses `safeParse`. |

---

### 1.2 Automation Script ID Validation — RESOLVED

| File | Line | Issue |
|------|------|-------|
| `scraper-service.ts` | 125 | ~~`automationScriptIdSchema.parse(scriptReference)` throws~~ Now uses `safeParse`, throws `API_ERROR_INVALID_SCRIPT_ID`. |

---

### 1.3 Smart Field Mapper – Silent Fallback — RESOLVED (logging added)

| File | Flow | Issue |
|------|------|-------|
| `application-automation-service.ts` | `resolveAutofillAnalysis` L2411–2428 | When `enableSmartSelectors` is off or `tryLoadAIService()` returns null, returns empty `selectorMap` and `fieldAnswers` with no logging. Job-apply proceeds with adapter-only selectors. |
| `smart-field-mapper.ts` | `analyze` | On fetch failure, HTML too short, or AI parse failure, returns `EMPTY_FIELD_ANALYSIS_RESULT` silently. No telemetry or user feedback that AI-assisted mapping was skipped. |

**Gap:** User cannot distinguish “AI mapping failed” from “AI mapping disabled” or “no custom fields needed.” No retry visibility.

---

### 1.4 Job-Apply Adapter Detection

| File | Issue |
|------|-------|
| `scraper/src/job-apply/adapters.ts` | Only `greenhouse`, `lever`, and `generic` adapters. URL-based detection via `resolveJobApplyAdapter(page.url())`. |
| `scraper/src/job-apply/runtime.ts` | `APPLY_LINK_SELECTOR` hardcodes `greenhouse.io`, `lever.co`, `apply` href fragments. Other ATS (Ashby, Workday, SmartRecruiters) fall back to `generic` with weaker selectors. |

**Gap:** No AI-assisted adapter detection. Custom/unknown ATS forms rely on `input[name='...']` heuristics; AI could infer adapter from page structure.

---

### 1.5 Verification Step – No Confirmation Fallback

| File | Line | Issue |
|------|------|-------|
| `scraper/src/job-apply/runtime.ts` | 616–632 | `verifySubmissionStep` checks `JOB_APPLY_CONFIRMATION_PHRASES` in body text. If none match, step is still marked `ok` with message “No confirmation text detected.” Run is considered successful. |

**Gap:** Submission could fail (e.g. validation error, CAPTCHA) but run reports success. No AI-based verification of success vs. error page.

---

## 2. Automation Orchestration Gaps

### 2.1 Fixed Timeouts, No Retries — RESOLVED

| File | Line | Issue |
|------|------|-------|
| `scraper/src/job-apply/runtime.ts` | — | ~~No retries~~ `withRetry` added for fill, click, page.goto with exponential backoff. |

---

### 2.2 Scheduled Run Recovery – Timer-Only

| File | Flow | Issue |
|------|------|-------|
| `application-automation-service.ts` | Boot recovery | Pending `automation_runs` rows are reloaded and in-memory timers set. If server restarts repeatedly before `runAt`, timers are recreated each time. No idempotency or deduplication. |
| Same | Schedule dispatch | No distributed lock. Multiple instances could both dispatch the same run. |

**Gap:** Single-server assumption. No coordination for multi-instance or cron-based scheduling.

---

### 2.3 Concurrency Limit – Per Type Only

| File | Line | Issue |
|------|------|-------|
| `application-automation-service.ts` | 804–811 | `maxConcurrentRuns` applies to `job_apply` only. Scrape and email-response runs are not counted. A burst of scrapes + job-applies could overload system. |

**Gap:** No global automation concurrency cap across all run types.

---

### 2.4 Job Refresh – No Initial Run — RESOLVED

| File | Line | Issue |
|------|------|-------|
| `server/src/index.ts` | — | ~~No initial run~~ `runJobRefresh()` now called on startup before interval. |

---

## 3. AI × RPA Capability Gaps

### 3.1 AI Used Only for Form Field Mapping

| Capability | Status | Gap |
|------------|--------|-----|
| **Job-apply form selectors** | ✅ AI via `smartFieldMapper` when `enableSmartSelectors` | Works for `email`, `fullName`, `phone`, etc. when AI available. |
| **Custom field answers** | ✅ AI infers `fieldAnswers` for non-core fields | Merged with user `customAnswers`. |
| **Scraper extraction** | ❌ No AI | Scrapers use Playwright DOM selectors and regex. No AI for parsing job cards, pagination, or handling layout changes. |
| **Adapter detection** | ❌ No AI | URL-based only. |
| **Submission verification** | ❌ No AI | Keyword matching only. |
| **Cover letter tailoring** | ⚠️ Partial | Cover letter is generated separately (AI) but passed as static text to job-apply. No per-field or per-ATS tailoring during apply. |

---

### 3.2 Email Response – AI Only for Draft

| Flow | AI Role | Gap |
|------|---------|-----|
| Email response automation | AI generates reply text | No AI for: parsing incoming email structure, extracting thread context, or choosing tone from email sentiment. |
| Delivery | SMTP only | No AI for follow-up scheduling or reply timing. |

---

### 3.3 Interview – AI Disconnected from RPA

| Component | AI | RPA | Gap |
|-----------|-----|-----|-----|
| Mock interview | AI generates questions, analyzes responses | None | No RPA to simulate video interview UI or record responses. |
| Job apply | RPA fills forms | AI for selectors/answers | No AI-driven “interview prep” based on job description before apply. |

**Capability gap:** AI could analyze job description + resume to suggest custom answers before RPA runs, but that happens only via `smartFieldMapper` at runtime, not as a pre-apply step.

---

### 3.4 Scraper – No AI

| Scraper | Extraction | AI Potential |
|---------|------------|--------------|
| Hitmarker, Grackle, etc. | DOM selectors, JSON parsing | AI could handle layout changes, extract from unstructured HTML, or normalize job titles/descriptions. |
| Studio scraper | Same | AI could extract company culture, benefits, tech stack from prose. |

**Gap:** Scrapers are brittle to DOM changes. AI-based extraction could improve resilience.

---

## 4. Data & Observability Gaps

### 4.1 Gamification – Silent Failures

| File | Line | Issue |
|------|------|-------|
| `gamification-service.ts` | 947 | `trackActionFireAndForget()` uses `.catch()` that only logs. XP/achievement awards can fail (DB error, validation) with no retry or dead-letter. |

---

### 4.2 Automation Run Output – No Structured Errors

| Flow | Issue |
|------|-------|
| Scraper stdout/stderr | NDJSON protocol; `result` and `error` events. No schema for partial success (e.g. “3/10 jobs scraped, 7 failed”). |
| Job-apply steps | `steps` array has `action`, `status`, `message`. No machine-readable error codes for “field not found” vs “timeout” vs “CAPTCHA detected.” |

**Gap:** Hard to build retry logic or analytics from run output.

---

## 5. Summary Table

| Category | Gap | Severity | Effort | Status |
|----------|-----|----------|--------|--------|
| Logic | `rpaProgressEventSchema.parse` throws | Medium | Low | ✅ Resolved |
| Logic | `automationScriptIdSchema.parse` throws | Medium | Low | ✅ Resolved |
| Logic | Smart field mapper silent fallback | Low | Medium | ✅ Resolved (logging) |
| Logic | Job-apply verification accepts “no confirmation” | Medium | Medium | Open |
| Automation | No retries on Playwright actions | Medium | Medium | ✅ Resolved |
| Automation | No initial job refresh on startup | Low | Low | ✅ Resolved |
| Automation | No global concurrency limit | Low | Medium | Open |
| AI×RPA | Scraper extraction not AI-assisted | Low | High | Open |
| AI×RPA | Adapter detection not AI-assisted | Low | Medium | Open |
| AI×RPA | Submission verification not AI-assisted | Medium | Medium | Open |
| Observability | Gamification errors swallowed | Medium | Low | Partial (logs; no dead-letter) |
| Observability | No structured run error codes | Low | Medium | Open |

---

## 6. Recommended Priorities

1. ~~**Quick wins:** `safeParse` for `rpaProgressEventSchema` and `automationScriptIdSchema`; add initial job refresh on startup.~~ ✅ Done 2026-03-17
2. ~~**Robustness:** Retries with backoff for Playwright actions in job-apply runtime.~~ ✅ Done 2026-03-17
3. ~~**Observability:** Log when smart field mapper falls back to empty result~~ ✅ Done 2026-03-17; consider dead-letter for gamification (open).
4. **AI×RPA:** AI-assisted submission verification (success vs. error page); optional AI-based adapter detection for unknown ATS.
