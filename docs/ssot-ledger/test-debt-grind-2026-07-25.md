# Test debt grind — 2026-07-25

## Why tests missed honesty gaps

1. Job-apply bootstrap fail-closed shipped without product unit tests (only generic `api-response.spec`).
2. STT provider unknown → silent `"browser"` skipped Whisper; options duplicated in `useSTT` vs `createServerSttRequestOptions`.
3. `follow_apply_link` `no_link` recorded as `"ok"`; RPA schema/persistence coerced unknown → `"ok"`.
4. Dead-i18n scanned `packages/client` only — shared voice key constants looked "dead" (293 allowlist theater).
5. Softener zero-tolerance tests claimed live `biome.json` hardened while tip-of-main still soft — `bun test ./scripts` red / lint unwired = LDL.
6. `BootstrapErrorAlert` lived outside `components/ui/` while SSOT owners pointed at missing path.
7. `readApiDataOrEmpty` fail-open helper unused but tested as correct — reintroduction footgun.

## Fixed this turn

| Gap | Fix |
|-----|-----|
| STT fail-open | Empty/unknown → `DEFAULT_SPEECH_SETTINGS.stt.provider` (`local`); defaults fill model/endpoint |
| STT options DRY | `useSTT` → `createServerSttRequestOptions` |
| Job-apply helpers | `automation-job-apply-page-form.spec.ts` + fail-closed envelope assert |
| STT unit tests | `speech-stt-provider.spec.ts`, `speech-stt-request-options.spec.ts` |
| follow_apply_link | Export detector; unit tests; `no_link` → `"skipped"` through schema/sanitize/UI |
| BootstrapErrorAlert | Moved to `components/ui/`; Nuxt component spec |
| Dead-i18n | Scan `packages/shared`; prune 46 stale; ratchet **247** |
| Softener LDL | Fixture-based zero-softener tests; **ratchet gates in lint** (biome offs≤5, eslint offs≤9) |
| Fail-open reader | Deleted `readApiDataOrEmpty` |

## E2E verified this turn (no false greens)

| Proof | Result |
|-------|--------|
| `proof:browser-smoke` | **69/0** failures |
| `proof:browser-burndown` | **57×viewport, 0 errors** |
| Honesty surfaces (job-apply / ai-chat dock / settings) | console=0, mobile dock active=1 |
| Artifacts | `/opt/cursor/artifacts/test-debt-grind/` (+ video) |

Also fixed unwired SSOT that made SSR 500: `ALERT_VARIANT_CLASS` / progress / stats tokens; `AIChatBubble` density imports from `~/constants/chat`.

## Remaining (honest, ratchet-enforced — not ignored)

- Full biome/eslint zero-softener cutover ≈1913 diagnostics — **lint ratchets** block growth (offs≤5 / eslint offs≤9); zero-cutover not claimed.
- Dead-i18n allowlist **247** (was 293) — shrink-only `MAX_ALLOWLIST_ENTRIES`.
- Whisper/Kokoro live speech proofs need local model servers (not claimed this turn).

## Remaining ledger for capability debt

See `top10-live-capabilities-2026-07-24.md` — `## Remaining` empty (gate green).
