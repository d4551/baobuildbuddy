# Why tests missed product gaps (2026-07-24)

## Root causes (LDL)

1. **OpenAPI** — `openapi-tags.test.ts` soft-skipped `if (!operation.tags) continue`, so missing tags/descriptions never failed CI. UI treated empty description as valid via i18n `noDescription`.
2. **TTS/STT** — no headed fail-closed capability proofs in the lint/proof matrix.
3. **Settings rail** — scroll SSOT gate only checked snap tokens, not desktop wrap / no-overflow when sections fit.
4. **IDE packages** — `@replit/codemirror-vim` + minimap were in `package.json` but **never imported** (dead deps = silent incomplete).
5. **Desktop notarization** — stapler path is Darwin-only; Linux could appear “verified” via runtime without `--release` DMG staple.

## Gates added

- `validate:openapi-descriptions` + fail-closed OpenAPI test (tags + description ≥12)
- `proof:tts-live` / `proof:stt-live` (exit 1 on gaps; BLOCKED ≠ PASS for TTS voices)
- Editor: Vim/minimap wired; TipTap `AppBlockEditor`; Cmd/Ctrl+P → OmniSearch
- Settings rail: `lg:flex-wrap` + `lg:overflow-x-visible`

## On-device speech

- Defaults: STT/TTS provider `browser`.
- `proof:on-device-speech` fail-closed (mic + test speaker).
- Cloud TTS provider options are profile-only until a server TTS route exists.
