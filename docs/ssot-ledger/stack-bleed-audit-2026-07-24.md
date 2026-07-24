# Stack bleeding-edge audit — 2026-07-24

Source: `bunx npm view` dist-tags + `validate:stack-versions`.

| Package | Pin / installed | Tip dist-tag | Action |
|---------|-----------------|-------------|--------|
| bun | 1.3.14 | latest 1.3.14 | keep |
| elysia | 2.0.0-exp.49 | experimental **2.0.0-exp.49** | already tip |
| @elysiajs/openapi | 2.0.0-exp.0 | experimental 2.0.0-exp.0 | keep |
| @elysiajs/eden | ^1.4.9 | latest 1.4.9 (no Eden 2) | keep |
| nuxt | ^4.5.0 | latest 4.5.0 | keep |
| vue | ^3.5.40 | latest 3.5.40 (3.6 still rc) | keep stable |
| daisyui | 5.7.0 | latest 5.7.0 | keep |
| tailwindcss | ^4.3.3 | latest 4.3.3 | keep |
| vitest | 4.1.10 | latest 4.1.10 | keep |
| playwright (root) | 1.61.1 | latest 1.61.1 | keep |
| playwright (scraper) | **1.61.1** | was ^1.58.2 | **bumped** |
| zod | 4.4.3 | latest 4.4.3 | keep |
| @biomejs/biome | 2.5.5 | latest 2.5.5 | keep |

Vue 3.6 / Playwright beta / Vitest 5 beta intentionally **not** adopted (RC/beta).
