#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BASELINE="bun@1.3.10"
CURRENT="$(bun pm pkg get packageManager | tr -d '[:space:]')"

if [[ "$CURRENT" != "\"$BASELINE\"" ]]; then
  echo "❌ Bun baseline mismatch: expected \"$BASELINE\" but got $CURRENT"
  exit 1
fi

if command -v rg > /dev/null 2>&1; then
  STALE_LINES="$(rg --files-with-matches \
    -g '!*node_modules/**' \
    -g '!**/.git/**' \
    -g '!**/.bun/**' \
    -g '!scripts/verify-bun-baseline.sh' \
    -e 'bun@1\\.3\\.9|\"1\\.3\\.9\"' . || true)"
else
  STALE_LINES="$(grep -RIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.bun --exclude=scripts/verify-bun-baseline.sh -E 'bun@1\\.3\\.9|\"1\\.3\\.9\"' . | cut -d: -f1 | sort -u || true)"
fi
if [[ -n "$STALE_LINES" ]]; then
  echo "❌ Found stale Bun 1.3.9 references:"
  echo "$STALE_LINES"
  exit 1
fi

echo "✅ Bun baseline and 1.3.9 guard checks passed"
