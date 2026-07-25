#!/usr/bin/env bash
# Baseline gate runner: runs each command from the root `lint` chain once,
# logs per-gate output to .hardening/gates/<idx>-<name>.log, writes summary TSV.
# Idempotent: skips gates whose log already exists. Safe to re-invoke.
# bash 3.2 compatible (macOS system bash).
set -u
cd "$(dirname "$0")/.."
mkdir -p .hardening/gates
SUMMARY=.hardening/gates/summary.tsv
touch "$SUMMARY"
LIST=.hardening/gates/gate-list.txt

bun -e 'const p=require("./package.json"); console.log(p.scripts.lint);' | tr '&' '\n' | sed 's/^ *//;s/ *$//' | grep -v '^$' > "$LIST"

idx=0
while IFS= read -r cmd; do
  idx=$((idx+1))
  name=$(printf '%s' "$cmd" | sed 's/[^a-zA-Z0-9:-]/_/g' | cut -c1-60)
  log=".hardening/gates/$(printf '%02d' "$idx")-$name.log"
  if [ -s "$log" ]; then
    continue
  fi
  start=$(date +%s)
  timeout 240 bash -c "$cmd" > "$log" 2>&1
  rc=$?
  dur=$(( $(date +%s) - start ))
  if grep -q "^$idx	" "$SUMMARY" 2>/dev/null; then
    continue
  fi
  printf '%s\t%s\t%s\t%s\n' "$idx" "$rc" "$dur" "$cmd" >> "$SUMMARY"
  echo "gate $idx rc=$rc ${dur}s $cmd"
done < "$LIST"
echo "ALL_GATES_ATTEMPTED"
