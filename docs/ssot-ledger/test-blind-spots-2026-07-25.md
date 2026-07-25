# Test blind spots — what we were not testing (2026-07-25)

## Incomplete / soft criteria (fixed this turn)

| Soft pattern | Why LDL | Fix |
|--------------|---------|-----|
| `proof:tts-live` → speechSynthesis only | Green without Kokoro | Redirect → `proof:kokoro-tts` |
| `proof:stt-live` / honest STT `BLOCKED` | Mic theater skipped Whisper | Redirect → `proof:whisper-stt`; honest probes Whisper |
| OpenAPI `if (!expectedTag) continue` | Untagged routes invisible | Matcher for OpenAI V1 + throw on unknown paths |
| `test.skip` / hardcoded BLOCKED | Soft CI | `validate:no-soft-test-skips` |
| Ledger Remaining theater | Deferred debt | `validate:zero-capability-debt` |

## Surfaces now covered (fail-closed)

- Local Kokoro TTS (RIFF WAV bytes)
- Local Whisper STT (transcribe API)
- Ollama nonce echo
- PDF UI export
- RPA scrape run (UI click + run status)
- IDE: Vim/minimap/TipTap/Cmd+P
- OpenAPI descriptions on all matched routes
- Zero Remaining ledger items

## Still not a unit-test surface (by design)

- Notarized macOS DMG stapler (Darwin-only host check)
- Multi-user Yjs cloud collab (BroadcastChannel local collab is SSOT)
- Physical microphone capture in headless CI (Whisper file upload is the STT SSOT)
