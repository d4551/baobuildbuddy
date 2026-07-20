# SSOT ledgers

Evidence artifacts for UI/SSOT burndown and contract decisions. Binding product SSOT remains [`../STACK-CONTRACT.md`](../STACK-CONTRACT.md) (TS constants + CSS tokens + `bun run lint` validators — **not** `.bao` archives).

| Ledger | Purpose |
|--------|---------|
| [baseline-ledger.md](./baseline-ledger.md) | Gate config hashes + route_pages baseline at burndown start |
| [defect-ledger.md](./defect-ledger.md) | Defects found/fixed (DUP, clip, hydration, touch targets, IPv4 bind, …) |
| [improvement-ledger.md](./improvement-ledger.md) | Quality raises (tokens, gates, touch targets, section-rail scroll SSOT) |
| [contract-escalation-2026-07-20.md](./contract-escalation-2026-07-20.md) | Parent `.bao`-archive playbook vs STACK-CONTRACT resolution |

Browser proof commands (stack on `127.0.0.1:3001`):

```bash
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-smoke
PAGE_PROOF_CLIENT_BASE=http://127.0.0.1:3001 bun run proof:browser-burndown
```
