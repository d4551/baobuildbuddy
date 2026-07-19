# Improvement ledger

| Artifact | Baseline | New | Delta | SSOT bar | Gate |
|----------|----------|-----|-------|----------|------|
| Abs path symlink | tracked `/Users/.../dist` | removed + banned | tooling `rg` restored | no host paths in tree | `validate:no-abs-path-symlinks` |
| Raw-token shadow test | wrong-path (primitive exempt) | consumer path | honest mutation | primitives exempt; consumers banned | `validate-no-raw-design-tokens.test.ts` |
| Client vitest | DataCloneError sans `.nuxt` | self-bootstrap | order-independent | mirror lint/typecheck prep | `packages/client` `test` script |
| Schedule helpers | 2 composable copies | 1 `schedule-timestamp.ts` | 0 Nuxt dup warnings | one export owner | `nuxt prepare` quiet + specs |
| API envelope readers | forked `readApiData` | `requireApiResponseData` / `readApiDataOrEmpty` | typed SSOT | `utils/api-response.ts` | api-response.spec |
| Stack alignment | npm latest advisory | installed pin assert | fails on Elysia 1.x | STACK-CONTRACT pins | `validate:stack-versions` |
| Automation test env | bash-only private-host flag | preload SSOT | bare `bun test` green 3/3 | SSRF opt-in for fixtures | `test-setup.ts` |
| vue/html-indent | 183 warnings | 0 | −183 | clean client eslint | client eslint |
| Integration parse errors | opaque failure | status+body slice | faster RCA | typed test helper | helpers change |
