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

## Remaining (honest)

- Full biome/eslint zero-softener cutover ≈1913 diagnostics — blocked by ratchet, not claimed green.
- Headed capability proofs (`proof:whisper-stt` / `proof:kokoro-tts` / browser burndown) require stack + browsers — run in this grind after unit green.
- Dead-i18n allowlist still 247 dynamic/deferred keys — shrink-only ratchet.

## Remaining ledger for capability debt

See `top10-live-capabilities-2026-07-24.md` — `## Remaining` empty (gate green).
