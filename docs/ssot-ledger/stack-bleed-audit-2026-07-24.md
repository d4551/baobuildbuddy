# Stack bleed audit — 2026-07-24 (updated)

## Tip alignment (npm dist-tag)

| Package | Installed | Tip | Notes |
|---------|-----------|-----|-------|
| daisyui | 5.7.0 | 5.7.0 | ok |
| playwright | 1.62.0 | 1.62.0 | ok |
| vue-i18n | 11.4.7 | 11.4.7 | ok |
| vitest | 4.1.10 | 4.1.10 | ok |
| nuxt | ^4.5.0 | 4.5.0 | ok |
| vue | ^3.5.40 | 3.5.40 | ok |
| tailwindcss | ^4.3.3 | 4.3.3 | ok |
| @tauri-apps/api | 2.11.1 | 2.11.1 | bumped |
| @tauri-apps/cli | 2.11.4 | 2.11.4 | bumped |
| elysia | 2.0.0-exp.49 | (latest track 1.4.29) | **STACK pin** — do not downgrade |
| typescript (eslint) | 6.0.3 | — | peer for typescript-eslint |
| @typescript/native | 7.0.2 | 7.0.2 | typecheck native |

## Intentional overrides

- Root `overrides` Elysia 2.0.0-exp.49 per `docs/STACK-CONTRACT.md`
- Upstream `.d.ts` `@ts-nocheck` patch for TS7 native
- biome `noAwaitInLoops` off only for headed Playwright proof scripts
