# Top gaps — Live capabilities + DRY (2026-07-24)

## TOP capability gaps (closed this grind)

1. **Ollama down / AI hard-BLOCKED** — Install+serve Ollama (`llama3.2:1b`), Settings `local` wiring, nonce chat via `/api/ai/chat` + UI. Gate: `proof:ollama-live`.
2. **PDF not fail-closed** — UI Export→PDF with `%PDF-` + ≥1KB. Gate: `proof:pdf-live`.
3. **Honest proof lied** — now calls `assertLiveInference` (FAIL not assumed BLOCKED).
4. **Chat empty CTA** — routes to Settings AI Providers when `isAiConfigurationIncomplete`.
5. **App builds** — server `dist/index.js` + Nuxt `.output`.

## Closed this pass

6. **UI-only proofs** — `proof:ollama-live` / `proof:pdf-live` click+type (no settings/resume API inject).
7. **product-demo probe DRY** — uses `scripts/utils/live-ai-probe.ts`.
8. **job-apply console 404** — verify/context returns **204** when harness off.
9. **Scraper Playwright** aligned.

## Closed (follow-up grind)

10. **Export toast SSOT** — `runExportWithToast` wired resume/portfolio/cover-letter.
11. **Env→settings local model seed** — empty DB endpoint filled from `LOCAL_MODEL_*`.
12. **Burndown nav race** — openRoute retry/skip when click already navigating.
13. **Cover-letter PDF UI** — Generate dialog → Export PDF.
14. **Burndown soft warns** — Playwright role-click fallback → **0 findings**.
15. **RPA UI proof** — Settings enable WWI → hub → Run Job Scraper → Job Apply (`proof:rpa-live`).
16. **Portfolio PDF UI** — Add Project → Export PDF.
17. **AI+themed PDF video** — `proof:ai-pdf-video`.
18. **RPA video** — `proof:rpa-live` records scrape+job-apply webm.
19. **Full desktop tour video** — `proof:full-desktop-tour`.
20. **Native Tauri + full `gen/runtime`** — `prepare:desktop-runtime` + `verify:desktop-runtime` EXIT 0 (server/bin/scraper).
21. Brand/API/resume prose → AppJsonField/AppProseField; dual FAB removed; Fix Setup primary.
22. Playwright **1.62.0**, vue-i18n **11.4.7**, Tauri **2.11**.
23. **OpenAPI descriptions** — `openapiDetail` on all routes; `validate:openapi-descriptions`; live missing_desc=0.
24. **DOM reactivity** — `proof:dom-reactivity` findings=0.
25. **Local Kokoro TTS** — ONNX + `/api/speech/synthesize` + RIFF fail-closed; `proof:kokoro-tts`.
26. **IDE editor** — CM6 Vim/minimap/rectangular multi-cursor + TipTap blocks + Cmd/Ctrl+P OmniSearch + BroadcastChannel collab.
27. **Local Whisper STT** — `speech:whisper:serve` + default STT=`local`; `proof:whisper-stt`.
28. **Zero-debt gate** — `validate:zero-capability-debt` forbids Remaining theater + requires wiring markers.

## Remaining

_None. `validate:zero-capability-debt` fails if this section regains numbered debt items._

## Intentional product choices (not debt)

- Cloud OpenAI/HF **TTS** ignored — Kokoro local is SSOT.
- Browser Web Speech remains optional fallback for TTS/STT when `provider=browser`.
- Real-time multi-user Yjs cloud collab not shipped; same-origin BroadcastChannel collab is the local SSOT.

## Proof commands

```bash
ollama serve && ollama pull llama3.2:1b
bun run speech:kokoro:serve &
bun run speech:whisper:serve &
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 \
PAGE_PROOF_SERVER_BASE=http://127.0.0.1:3000 \
  bun run proof:kokoro-tts
bun run proof:whisper-stt
bun run proof:editor-ide
bun run proof:dom-reactivity
bun run proof:browser-burndown
bun run proof:browser-smoke
bun run validate:zero-capability-debt
bun run lint
```
