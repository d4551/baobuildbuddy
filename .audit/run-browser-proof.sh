#!/usr/bin/env bash
# Managed browser-proof run: start prod server+client, run proof, kill everything.
# Nothing is left running when this script exits (success, failure, or timeout).
set -u
cd "$(dirname "$0")/.."
PROOF_SCRIPT="${1:?proof script name, e.g. proof:browser-smoke}"
LOG=.audit/proof-stack.log
: > "$LOG"

export BAO_DISABLE_AUTH=true
export BAO_ENCRYPTION_KEY="${BAO_ENCRYPTION_KEY:-bao-test-encryption-key-32bytes}"
export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="$(bun -e 'import { arch, platform, release } from "node:os"; import { resolvePlaywrightHostPlatformOverride } from "./packages/shared/src/utils/playwright-browsers-path.ts"; process.stdout.write(resolvePlaywrightHostPlatformOverride(platform(), arch(), release()) ?? "");')"
case "${PLAYWRIGHT_BROWSERS_PATH:-}" in *cursor-sandbox-cache*) unset PLAYWRIGHT_BROWSERS_PATH ;; esac

PORT=3100 bun run packages/server/dist/index.js >> "$LOG" 2>&1 &
SERVER_PID=$!
PORT=3001 NUXT_PUBLIC_API_BASE=http://127.0.0.1:3100 bun packages/client/.output/server/index.mjs >> "$LOG" 2>&1 &
CLIENT_PID=$!

cleanup() {
  kill -TERM "$SERVER_PID" "$CLIENT_PID" 2>/dev/null
  sleep 1
  kill -KILL "$SERVER_PID" "$CLIENT_PID" 2>/dev/null
  pkill -f "packages/server/dist/index.js" 2>/dev/null
  pkill -f "client/.output/server/index.mjs" 2>/dev/null
  exit 0
}
trap cleanup EXIT INT TERM

ready=0
for _ in $(seq 1 45); do
  if curl -sf http://127.0.0.1:3001/ >/dev/null 2>&1 && curl -sf http://127.0.0.1:3100/api/health >/dev/null 2>&1; then
    ready=1; break
  fi
  sleep 2
done
if [ "$ready" != "1" ]; then
  echo "STACK FAILED TO BOOT"; tail -20 "$LOG"; exit 1
fi
echo "STACK UP (server:3100 client:3001)"

PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run "$PROOF_SCRIPT"
PROOF_EXIT=$?
echo "PROOF_EXIT:$PROOF_EXIT"
exit "$PROOF_EXIT"
