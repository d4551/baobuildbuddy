# Proposed AGENTS.md change (guard-protected — requires human review)

## Change

Line 95 of AGENTS.md:

```
21. **Workspace Bun pin** is `packageManager` / engines in root `package.json` (currently `bun@1.4.0`).
```

Should become:

```
21. **Workspace Bun pin** is `packageManager` / engines in root `package.json` (currently `bun@1.4.0`).
```

## Reason

Root `package.json` `packageManager` is already `bun@1.4.0`. The AGENTS.md reference is stale.
The `verify-bun-baseline.sh` gate scans for stale references to the previous workspace Bun pin and will flag AGENTS.md.
