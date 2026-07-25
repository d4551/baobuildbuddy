# Enterprise grind top10 — 2026-07-25

CONTRACT: product SSOT = TS constants + CSS tokens + validators (`docs/STACK-CONTRACT.md`). `.bao` archive playbook mapped to that fabric (zero `*.bao` archives in-tree).

## Avoidance → start here (hardest / most deferred)

1. Biome zero-softener cutover (`linter.enabled=false` on `.vue`, 5× `"off"`)
2. ESLint layout mute + unused-ignore evasions
3. Dead-i18n allowlist (247)
4. Speech settings endpoint fields unsurfaced
5. Full responsive burndown every route @ 320/768/1280

## Top 5 UI/UX journey gaps

1. Job-apply: bootstrap fail → retry → empty resume → run → skipped follow_apply_link timeline
2. AI chat voice: local Whisper/Kokoro path discoverable; STT/TTS endpoint editable in Settings
3. Settings IA: speech + AI providers one coherent rail (no orphan endpoint)
4. OmniSearch: every work surface deep-link + keyboard Cmd/Ctrl+P parity
5. Mobile/tablet/desktop: dock active, glass shell, 44px targets, no orphan chrome

## Top 5 legacy blockers

1. Biome/ESLint softeners hiding Vue + secret + barrel + await-in-loop debt
2. Dead-i18n allowlist theater
3. Incomplete daisyUI variant SSOT re-exports (partially fixed)
4. Dual STT option builders / speech settings not on Settings surface
5. Softener zero-tolerance validators unwired until configs match

## Baseline metrics

See `baseline.json` in this directory.
