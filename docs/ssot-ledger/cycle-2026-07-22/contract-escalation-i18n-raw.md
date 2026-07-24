# CONTRACT_ESCALATION — i18n parity (2026-07-22)

## Conflict
Parent playbook demands 100% locale completeness immediately.
Raw override catalogs: es ~87%, fr ~25%, ja ~25% of en-US leaf keys.
Mass machine-copy of English into fr/ja = lying localization (VIOLATION).

## Resolution (owner_wins)
New bar under STACK-CONTRACT:

1. `validate:i18n-parity` MUST compare **raw override catalogs** (not merged modules with English fallback).
2. **Critical journey namespaces** (auth, setup, settings AI/speech, automation.jobApply, jobs, common actions, a11y shell) require **100%** raw coverage in every locale.
3. **Coverage ratchet**: each locale's raw leaf-key coverage % MUST be ≥ floor in `scripts/i18n-coverage-floors.json`; floors only increase.
4. Full 100% raw parity for fr/ja remains a tracked improvement ledger item; progressive fill allowed outside critical namespaces.

## Gate locking
- `validate:i18n-parity` (raw + critical)
- `validate:locales` (override shape)
- floors file hashed into baseline ledger
