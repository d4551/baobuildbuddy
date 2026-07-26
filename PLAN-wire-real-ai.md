# Wire real AI context (job/studio/skill), fix prompt bugs, prove it e2e

## Context

The product's AI surfaces are **context-blind in the places that matter most**, and the
test suite cannot see it because it asserts plumbing and error shapes but never
**prompt content**. Concretely, with file:line evidence gathered this session:

1. **Cover letter never reads the scraped job or the studio.**
   - `packages/server/src/services/ai/prompts-resume.ts:49` — `coverLetterPrompt(company, position, jobInfo, resumeContext)`.
     Instruction 3 of that prompt demands *"Demonstrates knowledge of the company and their games/products"* —
     but no studio record is ever supplied. The model is asked to know something it was never told.
   - `packages/server/src/routes/cover-letter-route-contracts.ts:60-70` — `generateCoverLetterBodySchema`
     has **no `jobId`, no `studioId`, no skills**. `jobInfo: t.Optional(t.Record(t.String(), t.Unknown()))`
     is an untyped escape hatch, not a contract.
   - `packages/server/src/routes/cover-letter-route-generation.ts:127-129` —
     `jobInfoText = body.jobInfo ? JSON.stringify(body.jobInfo, null, 2) : "No additional job information provided"`.
     It never queries the `jobs` table. "AI customising cover letters based on scraped jobs" is **not wired**.

2. **Resume enhance passes the wrong argument — a live bug.**
   - `prompts-resume.ts:4` — `resumeEnhancePrompt(resume: string, jobDescription?: string)`.
   - `packages/server/src/routes/resume-route-support.ts:204,206` — `const section = body.section || "all"`
     then `resumeEnhancePrompt(serializeResumeForAi(resume), section)`.
   - The prompt therefore renders `Target Job Description:\nall`. A section name is injected where a
     job description belongs. Silently wrong, never asserted.
   - (Resume **score** is correct: `resume-route-support.ts:270-271` loads the job by `body.jobId` and
     serializes it via `serializeJobForAi`. This is the pattern to copy.)

3. **Rich context builders already exist but are interview-only — a DRY/SSOT violation.**
   - `packages/server/src/services/interview-service-prompt-context.ts` provides
     `buildStudioPromptContext(studio)` (name, type, interviewStyle, technologies, games, remote,
     and the RPA-scraped `enrichment.summary / hiringSignals / interviewFocusAreas / candidatePitchAngles`)
     and `buildJobPromptContext(config)` (title, company, location, technologies, requirements,
     description, source, enrichment).
   - Consumers are only `interview-service-question-prompts.ts`, `-response-feedback.ts`,
     `-final-analysis.ts`. **Mock interviews are genuinely well-wired.** Cover letter, resume and
     portfolio never touch these builders.

4. **Why the tests miss all of it.** There are **zero `.skip`/`.todo`** in the suite — the problem is
   the assertion layer, not skipping:
   - `interview-service-prompt-context.ts` has **no test file at all**. The richest context builders in
     the repo are untested.
   - `cover-letter-route-generation.test.ts` asserts error codes, secret redaction, and content-shape
     validity — never that the prompt contains the job/studio facts. Prompts are **pure string
     functions**, so this is trivially assertable; asserting it mechanically forces the context through.

5. **Portfolio AI** has only a system persona string (`prompts-system.ts:44`) — no portfolio prompt
   builder carrying studio/job/skill context.

6. **MCP is not implemented in the product.** `grep -rln "modelcontextprotocol|MCP" packages/*/src`
   returns nothing. MCP exists only as agent tooling, not as a product surface.

7. **Auto-applier is real**, contrary to doubt: `smart-field-mapper.ts` +
   `automation-job-apply-autofill.ts:71` (`smartFieldMapper.analyze`), prompt at
   `smart-field-mapper-analysis.ts:7`, tuning in `config/env.ts:178-202`, with tests. It needs
   **live proof**, not new code.

8. **Voice chat is real**: `speech.routes.ts`, `speech-synthesize-service.ts`, `useSpeech.ts`, and a
   fail-closed gate `scripts/validate-local-kokoro-tts.ts`. Default endpoint
   `http://127.0.0.1:8880/v1` (`settings.ts:119`). Kokoro is **not currently running** (probe `000`);
   Ollama **is** live (`200` on 11434). Kokoro must be **started and verified**, not written off.

9. **Stale model ids**: `packages/shared/src/constants/ai-provider.ts:13,84` and
   `packages/server/src/services/ai/claude-provider.ts:20` still reference
   `claude-sonnet-4-5-20250929` / `claude-3-*`. Current family is Claude 5.

**Intended outcome:** every AI surface receives the job/studio/skill context it claims to use; the
prompt content is asserted by tests so context can never silently drop again; and each chain
(scrape → cover letter/resume, auto-apply, mock interview, voice) is proven working in the real
browser and against live providers.

### Already landed this session (gate green: typecheck 0, lint 0, `bun test` 746/0, `bun run test` all packages 0 fail)

- daisyUI 5 dead classes: `avatar placeholder` → `avatar avatar-placeholder` (3 sites) and
  `menu-title` moved inside `<ul class="menu">`; validator extended to catch **bare-word** v5 renames
  (`placeholder`/`online`/`offline`, `active`/`disabled`/`focus`) which the old hyphen-only regex missed.
- Collapsed sidebar rail geometry: `p-4` on a 56px rail left 24px for a 44px target (20px overflow).
  Now `is-drawer-close:p-1` + centered items — measured in-browser: 14/14 links one center (27.5 vs
  rail center 28), **0 overflowing**, min target 47×44.
- Vite `#app-manifest` overlay: `optimizeDeps.exclude: ["nuxt"]` + removed the `resolve.conditions`
  override that was dropping `browser`/`development` conditions.
- Cover letter POST returned no `createdAt`/`updatedAt` (echoed insert payload); now reads back the
  persisted row, contract tightened from `t.Optional` to required, entity type derived from the Drizzle
  table. Mutation-proved: reverting the fix fails 5 tests.
- Removed dead duplicate `CoverLetterService`; removed 7 dead Hitmarker i18n keys.
- Test-runner ownership: client `*.spec.ts` are vitest/happy-dom-owned; excluded from `bun test` at
  root **and** package level, enforced by new `scripts/validate-dom-test-runner-ownership.ts`.
- Quick actions now carry page entity into destinations that **actually consume it**
  (`ai/chat`, `interview`, `studios`) via `packages/client/utils/quick-action-context.ts`;
  `route-studio-context.ts` hydrates `?studio=` so chat shows "Riot Games", not `riot-games`.

## Work

### 1. Promote the prompt-context builders to a shared, tested SSOT (hardest first)
- Move `buildStudioPromptContext` / `buildJobPromptContext` out of the interview-only module into a
  shared prompt-context module under `packages/server/src/services/ai/` (e.g.
  `prompt-context-entities.ts`), re-exported for interview so its behaviour is unchanged.
- Add a **skill context** builder from the existing skill-mapping data
  (`packages/server/src/db/schema/skill-mappings.ts`, `services/skill-mapping-service.ts`).
- Add the missing unit tests asserting each builder's output **contains the input facts**
  (studio technologies, games, `enrichment.hiringSignals`, job requirements, description, skills).

### 2. Fix the resume-enhance argument bug and give it real job/studio context
- `resume-route-support.ts`: stop passing `section` as `jobDescription`. Extend `resumeEnhancePrompt`
  to take an explicit context object (section, job context, studio context, skill context) so the
  positional confusion cannot recur.
- Accept optional `jobId`/`studioId` on the enhance body contract; load the records the same way
  `handleResumeAiScore` already does; thread through the shared builders.

### 3. Wire the cover letter to scraped jobs + studio + skills
- Extend `generateCoverLetterBodySchema` with typed `jobId` and `studioId` (keep `jobInfo` for
  backwards compatibility but stop treating it as the only source).
- In `cover-letter-route-generation.ts`, load the job from the `jobs` table and the studio from
  `studios` (fields available: `technologies`, `games`, `culture`, `interviewStyle`, `enrichment`),
  and pass them through the shared builders into `coverLetterPrompt`.
- Change `coverLetterPrompt`'s signature to take a context object, so instruction 3 ("demonstrate
  knowledge of the company and their games") is actually backed by supplied data.
- Client: pass `jobId`/`studioId` from the cover-letter page (and let the now-context-aware quick
  action forward them, adding `/cover-letter` and `/resume` to
  `FORWARDED_ENTITY_KEYS_BY_PATH` **together with** the consuming code, per the note in that file).

### 4. Portfolio AI context
- Add a portfolio prompt builder that consumes the shared studio/job/skill context, mirroring the
  interview pattern, and wire the portfolio AI route to it.

### 5. Stale package/model patterns
- Update `ai-provider.ts:13,84` and `claude-provider.ts:20` to the Claude 5 family
  (`claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5-20251001`).

### 6. Remaining contract stubs
- Replace the remaining `t.Unknown()` response stubs (gamification, jobs, studio, user,
  automation-screenshot contracts) with real schemas, as already done for resume/automation.

### 7. Docs, ignores, one-off scripts
- README: verify badges + ELI5 at top and mermaid charts are present **and accurate** to the state
  above (no ASCII-art changes); correct anything that overstates AI context wiring.
- `.gitignore`: add any missing scratch/artifact paths surfaced during the run.
- Audit `scripts/` for one-off probes that should be deleted or promoted to real validators.

## Verification (no script false greens)

1. **Gate chain**: `bun run typecheck && bun run lint && bun test` and `bun run test` — all green.
2. **Prompt-content tests**: new unit tests assert the generated prompt string contains the studio
   technologies/games/enrichment and job requirements/description. **Mutation-prove** each: remove the
   context threading and confirm the test fails (as was done for the cover-letter timestamps).
3. **Live AI against Ollama** (confirmed up, `200` on `http://localhost:11434/v1/models`):
   scrape → pick a real scraped job → generate a cover letter and a resume enhancement → assert the
   output references studio/job specifics.
4. **OpenAI-compatible endpoint**: already verified live — `GET /v1/models` on `127.0.0.1:3400`
   returns the provider list. Extend to a real `POST /v1/chat/completions` round trip plus the SSE
   streaming path.
5. **Voice chat**: start Kokoro on `127.0.0.1:8880`, then exercise TTS through the app and confirm a
   real RIFF/WAV response from `/audio/speech` (do **not** declare this blocked).
6. **Auto-applier**: run job-apply against the local fixture harness
   (`packages/server/src/test-support/automation/job-apply-fixture.ts`) and confirm submission plus
   captured screenshots.
7. **PDF styling**: export cover letter and resume PDFs per template and assert theme colours and
   font geometry via the existing `packages/shared/src/utils/pdf-streams.ts` helpers
   (`extractPdfTextRuns`, `pdfTextRunFontSize`).
8. **Browser proof in the Claude Browser** (not scripted Playwright), desktop + mobile viewports:
   studios populate, collapsed rail geometry measured, AI chat context panel names the studio,
   interview/cover/resume surfaces show the forwarded context. Screenshots captured and inspected.

### Known blocker to state, not to hide

`brutalise` cannot scan this repo: `brutal_full_gate` rejects a `files[]` manifest without
`targetDir` ("partial file lists hide violations"), and `targetDir: /Users/brandon/Downloads/baobuildbuddy`
is refused as "outside allowed scan roots". The server's root allow-list lives in MCP config, which
the access-guard reserves for a human. **Required human action:** add
`/Users/brandon/Downloads/baobuildbuddy` to the brutalise server's allowed scan roots. Until then the
MAS audit half cannot be discharged; the repo's own ~90 validators are the in-repo substitute and are green.