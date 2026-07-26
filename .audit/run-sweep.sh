#!/usr/bin/env bash
# Pre-ship audit sweep: run every lint-chain command independently, record PASS/FAIL.
# Resumable: commands already in sweep-results.tsv are skipped.
set -u
cd "$(dirname "$0")/.."
RESULTS=.audit/sweep-results.tsv
DETAIL=.audit/sweep-detail.log
touch "$RESULTS"
while IFS= read -r cmd; do
  [ -z "$cmd" ] && continue
  if grep -qF "$cmd	" "$RESULTS" 2>/dev/null; then
    continue
  fi
  echo "=== RUN: $cmd" >> "$DETAIL"
  if eval "$cmd" >> "$DETAIL" 2>&1; then
    printf '%s\tPASS\n' "$cmd" >> "$RESULTS"
  else
    printf '%s\tFAIL\n' "$cmd" >> "$RESULTS"
  fi
done < .audit/lint-commands.txt
echo "SWEEP DONE: $(grep -c '	PASS' "$RESULTS") pass, $(grep -c '	FAIL' "$RESULTS") fail"
