# Improvement ledger — enterprise grind

| Artifact | Baseline | New | Delta | Gate |
|----------|----------|-----|-------|------|
| biome.json offs / enabled=false | 5 / 1 | 0 / 0 | −6 softeners | `validate:biome-no-softenings` + ratchet MAX=0 |
| eslint layout mutes + ignore patterns | 9 offs + 3 ignore evasions | 2 allowed offs (no-undef, Nuxt multiword) + 0 ignore | cutover flat/essential | `validate:eslint-no-softenings` |
| packages/* biome errors | ~1900 | 0 | cleared | `bunx biome check .` |
| Speech profile endpoints | persistence-only | UI editable STT/TTS endpoints | journey closed | speech-model-profile-state.spec |
| Dead-i18n allowlist | 293 | 247 | −46 stale | `validate:no-dead-i18n-keys` MAX=247 |

CONTRACT: TS/CSS token SSOT (`docs/STACK-CONTRACT.md`); `.bao` archives not product SSOT.
