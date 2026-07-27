#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BASELINE="bun@1.3.14"
# Previous pin. Kept as a literal so a half-finished bump is caught; the pattern is
# passed through a variable because inlining it under single quotes double-escaped
# the dots and the scan silently matched nothing.
STALE_VERSION="1.3.11"
# Dots are escaped: the pattern is an extended regex for rg/grep, so a bare "."
# would match any character and make the scan both over- and under-eager.
STALE_VERSION_PATTERN="${STALE_VERSION//./\\.}"
STALE_PATTERN="bun@${STALE_VERSION_PATTERN}|\"${STALE_VERSION_PATTERN}\""
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
    -e "$STALE_PATTERN" .)"
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
      \( -path './node_modules' -o -path './.git' -o -path './.bun' \) -prune \
      -o -type f \
      ! -path './scripts/verify-bun-baseline.sh' \
      -exec grep -InE "$STALE_PATTERN" {} +
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
  echo "❌ Found stale Bun ${STALE_VERSION} references:"
  echo "$STALE_LINES"
  exit 1
fi

echo "✅ Bun baseline and stale ${STALE_VERSION} reference checks passed"
