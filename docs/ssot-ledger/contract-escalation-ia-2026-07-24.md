# CONTRACT_ESCALATION — Navigation IA (2026-07-24)

## Conflict
Screenshots showed flat 14-peer IA vs industry group/command-palette patterns.
Parent `.bao` playbooks do not define this product’s nav IA.

## Resolution (owner_wins)
`docs/STACK-CONTRACT.md` remains product SSOT shape (TS constants + validators).
**New IA bar** declared here and implemented in `packages/client/constants/navigation.ts`:

| Rule | Bar |
|------|-----|
| Sidebar structure | Grouped: `work` \| `create` \| `intelligence` \| `system` |
| Shortcuts chrome | No always-visible `<kbd>` in sidebar; shortcuts via tip + OmniSearch + g-chord |
| Navbar crumbs | Section-only for peer destinations (no fake Dashboard parent) |
| Dock | ≤5: dashboard, jobs, resume, ai-chat, settings |
| Pipeline status | Prefix-linear (later steps cannot show complete while earlier incomplete) |
| FAB | Hidden below `lg` (dock owns mobile primary destinations) |

## Proof
`validate:nav-ia` + dock/pipeline/breadcrumb specs + `proof:browser-smoke` / burndown / desktop capabilities.
