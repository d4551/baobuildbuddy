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

read_stale_bun_refs_with_rg() {
  local output
  local status

  set +e
  output="$(rg --files-with-matches \
    -g '!*node_modules/**' \
    -g '!**/.git/**' \
    -g '!**/.bun/**' \
    -g '!scripts/verify-bun-baseline.sh' \
    -e 'bun@1\\.3\\.9|\"1\\.3\\.9\"' .)"
  status=$?
  set -e

  if [[ $status -eq 0 ]]; then
    printf '%s' "$output"
    return 0
  fi

  if [[ $status -eq 1 ]]; then
    return 0
  fi

  echo "❌ Failed to scan for stale Bun references with ripgrep"
  exit "$status"
}

read_stale_bun_refs_with_grep() {
  local output
  local status

  set +e
  output="$(
    find . \
      \( -name 'node_modules' -o -name '.git' -o -name '.bun' \) -prune \
      -o -type f \
      ! -path './scripts/verify-bun-baseline.sh' \
      -exec grep -InE 'bun@1\\.3\\.9|\"1\\.3\\.9\"' {} +
  )"
  status=$?
  set -e

  if [[ $status -eq 0 ]]; then
    printf '%s\n' "$output" | cut -d: -f1 | sort -u
    return 0
  fi

  if [[ $status -eq 1 ]]; then
    return 0
  fi

  echo "❌ Failed to scan for stale Bun references with grep"
  exit "$status"
}

if command -v rg > /dev/null 2>&1; then
  STALE_LINES="$(read_stale_bun_refs_with_rg)"
else
  STALE_LINES="$(read_stale_bun_refs_with_grep)"
fi
if [[ -n "$STALE_LINES" ]]; then
  echo "❌ Found stale Bun 1.3.9 references:"
  echo "$STALE_LINES"
  exit 1
fi

echo "✅ Bun baseline and stale 1.3.9 reference checks passed"
