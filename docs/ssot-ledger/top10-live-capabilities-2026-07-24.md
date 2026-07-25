# Top gaps — Live capabilities + DRY (2026-07-24)

## TOP capability gaps (closed this grind)

1. **Ollama down / AI hard-BLOCKED** — Install+serve Ollama (`llama3.2:1b`), Settings `local` wiring, nonce chat via `/api/ai/chat` + UI. Gate: `proof:ollama-live`.
2. **PDF not fail-closed** — UI Export→PDF with `%PDF-` + ≥1KB. Gate: `proof:pdf-live`.
3. **Honest proof lied** — now calls `assertLiveInference` (FAIL not assumed BLOCKED).
4. **Chat empty CTA** — routes to Settings AI Providers when `isAiConfigurationIncomplete`.
5. **App builds** — server `dist/index.js` + Nuxt `.output` (use `NUXT_IGNORE_LOCK=1` while dev stack holds port).

## Closed this pass

6. **UI-only proofs** — `proof:ollama-live` / `proof:pdf-live` click+type (no settings/resume API inject).
7. **product-demo probe DRY** — uses `scripts/utils/live-ai-probe.ts`.
8. **job-apply console 404** — verify/context returns **204** when harness off.
9. **Scraper Playwright** aligned to **1.61.1**.

## Closed (follow-up grind)

10. **Export toast SSOT** — `runExportWithToast` wired resume/portfolio/cover-letter.
11. **Env→settings local model seed** — empty DB endpoint filled from `LOCAL_MODEL_*`.
12. **Burndown nav race** — openRoute retry/skip when click already navigating.

## Closed (cover-letter + burndown)

13. **Cover-letter PDF UI** — Generate dialog type company/position → Export PDF (`%PDF-`, 1930B).
14. **Burndown soft warns** — Playwright role-click fallback → **0 findings**.

## Closed (RPA integration)

15. **RPA UI proof** — Settings enable WWI → hub → Run Job Scraper → runs 17→18 → Job Apply typed+run (`proof:rpa-live`).

## Closed (portfolio PDF)

16. **Portfolio PDF UI** — Add Project (type title/desc/tech) → Export PDF `%PDF-` 1394B.

## Closed (video proofs)

17. **AI+themed PDF video** — `proof:ai-pdf-video` (chat nonce + theme flip + resume/cover/portfolio PDFs).
18. **RPA video** — `proof:rpa-live` records scrape+job-apply webm.

## Closed (desktop authenticity)

19. **Full desktop tour video** — 19 pages + AI nonce + PDF + RPA (`proof:full-desktop-tour`, 9.2MB webm, 0 findings).
20. **Native Tauri** — rustc 1.97.1; `bao-build-buddy-desktop` running; X11 window screenshot+15s video. Honest: `gen/runtime` is manifest stub (not full packaged Bun binaries).

## Closed (non-IDE debt cleanup)

21. Brand content JSON → AppJsonField; API docs tester → AppCodeEditor; resume prose fields → AppProseField.
22. Dual FAB eliminated (floating chat removed; quick FAB only). Fix Setup → PRIMARY.
23. Playwright **1.62.0**, vue-i18n **11.4.7**. proof:debt-cleanup video findings=0.

## Closed (prose + desktop runtime + reactivity)

24. Remaining non-chat prose → AppProseField + `validate:prose-editor-ssot`.
25. Tauri tip: `@tauri-apps/api@2.11.1`, `@tauri-apps/cli@2.11.4`.
26. **Desktop `gen/runtime` full package** — `prepare:desktop-runtime` + `verify:desktop-runtime` EXIT 0 (server/bin/scraper ~96MB; gitignored under `src-tauri/gen/`).
27. `proof:dom-reactivity` findings=0 (CM6 type→DOM, theme flip, omnisearch, mobile dock + desktop sidebar).

## Closed (on-device speech)

28. **On-device STT/TTS** — Browser (on-device) labels + hint; Test speaker control; `proof:on-device-speech` findings=0 (SpeechRecognition.start + speechSynthesis.speak). Cloud TTS has no server synth route yet (settings metadata only).

## Remaining (honest)

1. **STT** — no mic in cloud agent (env). Code + `/api/speech` wired; live mic unproven here.
2. **TTS** — browser `speechSynthesis` wired; cloud TTS not e2e-proven.
3. **IDE editor goals** (Vim/multi-cursor/TipTap/Cmd+P) — deferred.
4. **UI gapless polish** — API Docs empty OpenAPI descriptions; settings rail horizontal scroll density.

## Proof commands

```bash
# Ollama must be running: ollama serve && ollama pull llama3.2:1b
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 \
PAGE_PROOF_SERVER_BASE=http://127.0.0.1:3000 \
LOCAL_MODEL_ENDPOINT=http://127.0.0.1:11434/v1 \
LOCAL_MODEL_NAME=llama3.2:1b \
  bun run proof:ollama-live
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:pdf-live
NUXT_IGNORE_LOCK=1 bun run build
```
