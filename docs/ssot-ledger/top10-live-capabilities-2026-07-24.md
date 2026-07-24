# Top gaps — Live capabilities + DRY (2026-07-24)

## TOP capability gaps (closed this grind)

1. **Ollama down / AI hard-BLOCKED** — Install+serve Ollama (`llama3.2:1b`), Settings `local` wiring, nonce chat via `/api/ai/chat` + UI. Gate: `proof:ollama-live`.
2. **PDF not fail-closed** — UI Export→PDF with `%PDF-` + ≥1KB. Gate: `proof:pdf-live`.
3. **Honest proof lied** — now calls `assertLiveInference` (FAIL not assumed BLOCKED).
4. **Chat empty CTA** — routes to Settings AI Providers when `isAiConfigurationIncomplete`.
5. **App builds** — server `dist/index.js` + Nuxt `.output` (use `NUXT_IGNORE_LOCK=1` while dev stack holds port).

## Remaining DRY / best-in-class (next)

1. **product-demo still embeds its own `assertLiveInference`** — migrate to `scripts/utils/live-ai-probe.ts`.
2. **Export page handlers** — resume/cover/portfolio preview `handleExport` still parallel; shared toast/error path optional.
3. **`.env` LOCAL_MODEL_* vs settings DB** — still dual source; boot sync optional.
4. **Cover-letter/portfolio PDF** — same helper, not yet in `proof:pdf-live`.
5. **STT** — still BLOCKED (no mic in cloud agent).

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
