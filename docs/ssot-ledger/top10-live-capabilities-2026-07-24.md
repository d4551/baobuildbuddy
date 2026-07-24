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

## Remaining DRY / best-in-class (next)

1. **Portfolio PDF UI** — empty library still skips Export.
2. **STT** — still BLOCKED (no mic in cloud agent).

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
