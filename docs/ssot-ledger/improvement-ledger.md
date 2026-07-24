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

| I1 | `scripts/dev-stack.ts` client bind | baseline: localhost→::1-only | new: 127.0.0.1 dual-stack-safe | Δ: browser smoke reachable on IPv4 | SSOT: runtime LOOPBACK_HOST_IPV4 | gate: `scripts/dev-stack.test.ts` |
| I2 | Settings section copy | baseline: page subtitle×2 | new: page×1 + section-specific | Δ: subtitleHits 2→1 | SSOT: settings-sections + locales | gate: validate:i18n-parity + visual proof |
| I3 | AI chat context | baseline: chips×2 surfaces | new: one visible set / viewport | Δ: visible badges 8→4 | SSOT: AIChatConversationPanel/Sidebar | gate: post-fix chip audit |
| I4 | Touch targets | baseline: dock ~42px | new: min-h-11 (55px measured) | Δ: ≥44px | SSOT: TOUCH_TARGET_MIN_CLASS | gate: deep-audit dockItemMin |
| I5 | AppNavbar mobile chrome | baseline: truncating section crumbs @320 | new: logo-only &lt;sm, labeled ≥sm | Δ: ellipsis false @320; label visible @640 | SSOT: AppNavbar + MAX_W_40_CLASS | gate: validate:no-raw-design-tokens + navbar-320 proof |
| I6 | Section rail clip gate | baseline: no overflow-x-clip ban | new: class-literal ban + mutation red→green | Δ: gate fails on inject | SSOT: validate-section-rail-scroll-ssot | gate: scripts/validate-section-rail-scroll-ssot.test.ts |
| I7 | Studio analytics hydration | baseline: mismatch console error | new: 0 hydration errors | Δ: errors 1→0 | SSOT: useAsyncData data owner | gate: browser analytics-verify.json |
| I8 | Touch targets drawer/menu | baseline: 42px h | new: min-h-11 (≥44) | Δ: +2px to AAA bar | SSOT: SHELL_SIDEBAR_ITEM_CLASS / TOUCH_TARGET_MIN_CLASS | gate: mobile-deep post-fix |
| I9 | Job source count SSOT | baseline: panel≠workspace; badge `n/3` | new: `countActiveJobProviderSources` | Δ: truthful enabled+configured count | SSOT: utils/job-provider-source-count.ts | gate: vitest + JI screenshot |
| I10 | Burndown stale clicks | baseline: warn after empty-state unmount | new: skip if label delisted | Δ: 3 warns→0 | SSOT: browser-interaction-burndown | gate: loop-4 burndown 0 findings |
| I11 | Touch floor hardened | baseline: min-h-11 alone →42px under menu-sm | new: h-11 + no menu-sm | Δ: locale 42→44 | SSOT: TOUCH_TARGET_MIN_CLASS + SHELL_NAVBAR_DROPDOWN | gate: live measure + lint |
| I12 | Gamification @320 | baseline: streak clip | new: col stack + shrink-0 label | Δ: clipped→full "day streak" | SSOT: DashboardGamificationCard | gate: deep-a + pass-c/d |
| I13 | FAB/dock collision | first-paint streak under FAB/dock | streak clear + pe-16/pb-36 | shell-chrome.spec + burndown |
| I14 | Floating chat viewport | panel left=-44 | left=16 w=288 | shell-chrome.spec |
| I15 | Section rail labels | hidden@320 | truncate visible SECTION_RAIL_LABEL | validate-section-rail-scroll |
| I16 | menu-sm paper | menu-sm+min-h-11 | menu-sm removed | shell-chrome.spec |
| I17 | Floating chat send | composer clipped h-96 | flex-col panel; Send inPanel+aboveDock | shell-chrome.spec + measure |
| I18 | Primary density | btn-primary+btn-sm | PRIMARY_ACTION_CLASS + validate:primary-action-density | gate |
| I19 | Jobs empty CTAs | under dock | CTAs before copy; Configure primary | measure underDock=false |
| I20 | AI chat settings-first | STT forms first paint | compact voice + collapse profiles | screenshot |
| I21 | Page header density | text-2xl always | text-xl sm:text-2xl | PAGE_HEADER_* SSOT |

| I22 | OmniSearch Cmd+K | button-only | Ctrl/Cmd+K opens + focuses input | Δ: enterprise palette | SSOT: useKeyboardShortcuts | gate: keyboard-nav-parity + browser probe |
| I23 | Search fabric types | 4 types | 8 types incl cover/portfolio/interview/runs | Δ: +4 entities | SSOT: constants/search.ts | gate: search-type-parity |
| I24 | Outline/soft tokens | raw literals | OUTLINE/SOFT_ACTION_CLASS + gate | Δ: 0 quoted btn-outline in .vue | SSOT: layout-tokens | gate: outline-action-density |
| I25 | Elysia tip | exp.46 | exp.49 + websocket capability | Δ: tip non-downgrade | SSOT: STACK-CONTRACT | gate: stack-versions |

| I26 | Tailwind CSS import | bare `tailwindcss` ENOENT in Vite SSR build | `tailwindcss/index.css` + gate | Δ: CI build green | SSOT: STACK-CONTRACT | gate: validate:tailwind-css-import |
