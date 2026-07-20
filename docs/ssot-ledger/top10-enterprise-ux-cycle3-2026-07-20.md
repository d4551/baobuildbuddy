# Top 10 enterprise UX — Cycle 3 (2026-07-20)

Evidence: `/opt/cursor/artifacts/cycle3-audit/` (Playwright m→t→d). SSOT: `docs/STACK-CONTRACT.md`.

## TOP 5 journey gaps

1. **Dual chat chrome** — Dock AI Chat + floating chat FAB on mobile crowds dock (fixed: floating desktop-only).
2. **Jobs empty funnel clutter** — hero + search + empty stack; description under dock (hardened EmptyState density).
3. **Resume empty as alert** — Create CTA + info alert redundancy (fixed: EmptyState primitive).
4. **Settings idle badge ghost** — empty circle meta when save idle (fixed: meta only when label).
5. **Setup primary density** — Next/Launch without PRIMARY_ACTION_CLASS touch floor (fixed).

## TOP 5 legacy blockers

1. **Floating chat always-on below lg** while dock owns AI — dual primary destination.
2. **PageHero gap burns fold** — compact gap tightened `gap-2 sm:gap-4`.
3. **Section navigator H2 + tab DUP** on Automation Overview — `omitActiveHeadingBelowLg`.
4. **Alert-as-empty** pattern bypasses EmptyState SSOT.
5. **Smoke skip-link false positives** + missing dual-chat probe — gate hardened.

## Fix order (this tip)

1. Hide floating chat below lg + on `/ai/*`
2. Settings idle badge / Resume EmptyState / Automation heading
3. Hero + EmptyState density / setup PRIMARY_ACTION_CLASS
4. Smoke: fail mobile floating FAB when dock has AI Chat
