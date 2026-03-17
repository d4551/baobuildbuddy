# PROTOCOL003

## Scope

Verification and synchronization protocol for BaoBuildBuddy, with specific requirements for automation, desktop runtime, and `agentiflow/`.

## Before Editing

1. Read [`../AGENTS.md`](../AGENTS.md) and the relevant protocol files in this directory.
2. Verify framework/runtime behavior with Context7 before changing Bun, Tauri, Nuxt, or Playwright integrations.
3. If UI structure changes and daisyUI classes matter, pull the relevant component patterns from daisyui-blueprint.
4. Search for existing shared utilities before adding new script helpers or schema definitions.

## After Editing

Always run:

1. `bun run capability:matrix`
2. `bun run format`
3. `bun run lint`
4. `bun run typecheck`
5. `bun run test`
6. `bun run build`

Run these in addition when relevant:

1. `bun run verify:desktop-runtime`
2. `bun run verify:desktop-releases`
3. `bun run release:verify`

## Platform Verification Rules

- Do not claim Windows, macOS, and Linux native release success from a single-host local build.
- The native source of truth for multi-platform artifacts is [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml).
- Local `release:verify` confirms the matching host-native Tauri build plus runtime verification.
- `verify:desktop-releases` can validate assembled artifacts for multiple targets when the release directory already contains them.

## Agentiflow Sync Rules

- `agentiflow/capability-matrix.generated.json` must match the repository after every change to commands, workflows, automation pages, or package layout.
- Manual `agentiflow/` docs must not contradict the generated matrix.
- If a protocol file references a missing command, missing root copy, or wrong stack component, fix the document in the same change.

## Failure Policy

No verification shortcut counts as complete work. If a required command cannot run on the current host, state that directly and rely only on the verification that was actually executed plus the CI workflow that owns the missing native platform.
