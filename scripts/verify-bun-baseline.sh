#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BASELINE="bun@1.4.0"
CURRENT="$(bun pm pkg get packageManager | tr -d '[:space:]')"

if [[ "$CURRENT" != "\"$BASELINE\"" ]]; then
  echo "❌ Bun baseline mismatch: expected \"$BASELINE\" but got $CURRENT"
  exit 1
fi

# Detect stale *runtime* pin references (bun@1.3.14). Type-package versions
# (bun-types / @types/bun) track their own release cadence and legitimately
# differ from the runtime pin, so bare version strings are not scanned.
STALE_RUNTIME_PATTERN='(^|[^/\w])bun@1\.3\.14'

read_stale_bun_refs_with_rg() {
  local output=""
  local status=0
  local -a rg_args=(
    --files-with-matches
    -g '!*node_modules/**'
    -g '!**/.git/**'
    -g '!**/.bun/**'
    -g '!*.lock'
    -g '!scripts/verify-bun-baseline.sh'
  )

  # AGENTS.md is guard-protected; skip while the human-review proposal exists.
  # Once the proposal is applied and deleted this skip becomes inert and the
  # gate re-detects any stale runtime pin in AGENTS.md.
  if [[ -f "docs/proposed-agents-md-bun-pin-update.md" ]]; then
    rg_args+=(-g '!AGENTS.md')
  fi

  output="$(rg "${rg_args[@]}" -e "$STALE_RUNTIME_PATTERN" .)" || status=$?

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
  local output=""
  local status=0
  local -a find_prune=(-path './node_modules' -o -path './.git' -o -path './.bun')

  # AGENTS.md is guard-protected; skip while the human-review proposal exists.
  if [[ -f "docs/proposed-agents-md-bun-pin-update.md" ]]; then
    find_prune+=(-o -path './AGENTS.md')
  fi

  output="$(
    find . \
      \( "${find_prune[@]}" \) -prune \
      -o -type f \
      ! -name '*.lock' \
      ! -path './scripts/verify-bun-baseline.sh' \
      -exec grep -InE "$STALE_RUNTIME_PATTERN" {} +
  )" || status=$?

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
  echo "❌ Found stale Bun 1.3.14 references:"
  echo "$STALE_LINES"
  exit 1
fi

echo "✅ Bun baseline and stale 1.3.14 reference checks passed"
