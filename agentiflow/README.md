# BaoBuildBuddy Agentiflow Protocol

This directory is the assistant-facing protocol bundle for BaoBuildBuddy. It exists to keep AI agent instructions aligned with the real repository, not with an imagined stack.

## Source Of Truth

Read these in order before making changes:

1. [`../AGENTS.md`](../AGENTS.md)
2. [`PROTOCOL001.md`](PROTOCOL001.md)
3. [`PROTOCOL002.md`](PROTOCOL002.md)
4. [`PROTOCOL003.md`](PROTOCOL003.md)
5. [`CONTEXT7_INTEGRATION.md`](CONTEXT7_INTEGRATION.md)
6. [`capability-matrix.generated.json`](capability-matrix.generated.json)

## Actual Stack

| Layer | Current repo reality |
| --- | --- |
| Runtime | Bun 1.3.x |
| Language | TypeScript strict |
| Frontend | Nuxt 4 SSR |
| Styling | Tailwind CSS 4 + daisyUI 5 |
| Backend | Elysia |
| Database | Drizzle ORM + SQLite |
| Automation | Playwright RPA in `packages/scraper` |
| Desktop | Tauri 2 in `packages/desktop` |

## Directory Protocol

| Path | Owner | Update rule |
| --- | --- | --- |
| `agentiflow/README.md` | Human-maintained | Update when the protocol layout or source-of-truth order changes |
| `agentiflow/AGENTS.md` | Human-maintained | Keep aligned with root [`../AGENTS.md`](../AGENTS.md) and the protocol docs |
| `agentiflow/PROTOCOL001.md` | Human-maintained | Keep aligned with current stack, commands, and release workflow |
| `agentiflow/PROTOCOL002.md` | Human-maintained | Keep aligned with package ownership, automation flow, and artifact layout |
| `agentiflow/PROTOCOL003.md` | Human-maintained | Keep aligned with verification and sync requirements |
| `agentiflow/CLAUDE.md` | Human-maintained | Condensed Anthropic-facing variant of the same rules |
| `agentiflow/GEMINI.md` | Human-maintained | Condensed Gemini-facing variant of the same rules |
| `agentiflow/CURSOR_RULE.mdc` | Human-maintained | Cursor-specific projection of the same protocol |
| `agentiflow/CONTEXT7_INTEGRATION.md` | Human-maintained | Keep tool usage and library IDs current |
| `agentiflow/capability-matrix.generated.json` | Generated | Refresh only with `bun run capability:matrix` |

## Current Root Rule Copies

Root-level discovery files are optional and the generated matrix records the exact set currently present. Today the repository root ships [`../AGENTS.md`](../AGENTS.md); assistant-specific variants live in this directory unless additional root copies are added intentionally.

## Required Commands

| Purpose | Command |
| --- | --- |
| Refresh matrix | `bun run capability:matrix` |
| Enforce matrix drift | `bun run capability:matrix:check` |
| Format | `bun run format` |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` |
| Test | `bun run test` |
| SSR build | `bun run build` |
| Desktop runtime smoke test | `bun run verify:desktop-runtime` |
| Desktop artifact validation | `bun run verify:desktop-releases` |
| Native host release verification | `bun run release:verify` |

## Release And RPA Reality

- Native desktop artifacts are built per operating system in [`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml).
- The assembled release directory lives in [`packages/desktop/releases`](../packages/desktop/releases).
- Automation scripts live in [`packages/scraper/src/scripts`](../packages/scraper/src/scripts) and speak the shared RPA protocol defined in [`packages/shared/src/schemas/rpa-protocol.schema.ts`](../packages/shared/src/schemas/rpa-protocol.schema.ts).
- Automation UI lives under [`packages/client/pages/automation`](../packages/client/pages/automation).
