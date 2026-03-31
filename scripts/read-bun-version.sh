#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_JSON="$REPO_ROOT/package.json"
DEFAULT_BUN_VERSION="1.3.11"

if [[ ! -f "$PACKAGE_JSON" ]]; then
  printf '%s\n' "$DEFAULT_BUN_VERSION"
  exit 0
fi

PACKAGE_MANAGER_LINE="$(
  grep -Eo '"packageManager"[[:space:]]*:[[:space:]]*"bun@[0-9]+\.[0-9]+\.[0-9]+"' "$PACKAGE_JSON" \
    | head -n 1
)"

if [[ -z "$PACKAGE_MANAGER_LINE" ]]; then
  printf '%s\n' "$DEFAULT_BUN_VERSION"
  exit 0
fi

printf '%s\n' "$PACKAGE_MANAGER_LINE" | sed -E 's/.*"bun@([^"]+)"/\1/'
