# Baobuildbuddy Client Package — Architecture Inventory

Nuxt 4 (Vue 3 + TypeScript) client application for the baobuildbuddy career-growth platform.
White-label, i18n-aware, daisyUI-themed SPA with SSR, Eden Treaty API access, and a
gamified end-to-end career workflow (jobs → resumes → cover letters → portfolio →
automation → interviews → AI chat).

---

## 1. High-Level Structure

```
packages/client/
├── app.vue                  # Root app shell — settings bootstrap, brand i18n overrides, SEO head
├── error.vue                # Global error page (status code + reset/clear-error actions)
├── pages/                   # 30 file-route pages (Nuxt file-based routing)
├── components/              # ~161 .vue files across feature subdirectories (+ supporting .ts)
├── composables/             # ~161 composable modules + specs
├── constants/               # ~20 typed constant / copy-key / registry files + specs
├── utils/                   # ~30 pure utility modules
├── types/                   # Client-side type definitions (Eden contracts, automation, i18n)
├── layouts/                 # default.vue (authenticated shell), auth-shell.vue (setup/auth)
├── middleware/auth.ts       # Route guard redirecting unauthenticated users to setup
├── locales/                 # en-US (schema source), es-ES, fr-FR, ja-JP
├── plugins/                 # Nuxt plugins (Eden client, toast, etc.)
└── nuxt.config.ts           # Nuxt runtime configuration
```

---

## 2. App Shell & Layouts

### `app.vue`
- Boots shared `useSettings()` + `useBrand()` on SSR (`useAsyncData("app-shell-settings")`, non-lazy).
- Applies brand copy overrides per active locale via `watchEffect` → `buildBrandedLocaleMessages`.
- `useHead` / `useHeadSafe` / `useSeoMeta` wire favicon, fonts, OG tags, title template.

### `layouts/default.vue` — Authenticated Shell
- daisyUI drawer pattern: sidebar (desktop) + collapsible mobile drawer.
- Desktop detection via `matchMedia(LAYOUT_DESKTOP_MEDIA_QUERY)`.
- Registers global keyboard shortcuts (`useKeyboardShortcuts`).
- Renders `AppNavbar`, `AppSidebar` (drawer-side), `AppDock` (mobile), `ToastContainer`.
- Conditionally renders `LazyFloatingChatWidget` except on `/ai/chat`.
- Theme init from persisted settings; syncs theme + drawer state reactively.

### `layouts/auth-shell.vue`
- Centered auth/onboarding surface for setup and login flows.

### `middleware/auth.ts`
- Skips `/setup`; otherwise checks `auth.checkAuthStatus()` → redirects to setup when
  auth required and no stored API key.

### `error.vue`
- Displays status code, message (i18n fallback), and reset/back-to-dashboard CTAs.

---

## 3. Pages (30 routes)

| Route | File | Purpose |
|---|---|---|
| `/` | `pages/index.vue` | Dashboard: welcome banner, gamification, stat cards, pipeline, quick actions |
| `/setup` | `pages/setup.vue` | 3-step setup wizard (profile → AI config → completion) |
| `/settings` | `pages/settings.vue` | Settings panels (profile, AI providers, brand, automation, job intelligence, email) |
| `/jobs` | `pages/jobs/index.vue` | Jobs index with filters, search, saved/applied tracking |
| `/jobs/[id]` | `pages/jobs/[id].vue` | Job detail (sidebar + main content, apply dialog, match score) |
| `/resume` | `pages/resume/index.vue` | Resume library + editor panels |
| `/resume/build` | `pages/resume/build.vue` | Resume builder (questions, target card, enhancement steps) |
| `/resume/preview` | `pages/resume/preview.vue` | Resume preview document |
| `/cover-letter` | `pages/cover-letter/index.vue` | Cover letter list + editor |
| `/cover-letter/[id]` | `pages/cover-letter/[id].vue` | Cover letter detail (form, stats, generate dialog) |
| `/portfolio` | `pages/portfolio/index.vue` | Portfolio grid (projects, profile cards) |
| `/portfolio/preview` | `pages/portfolio/preview.vue` | Portfolio preview |
| `/interview` | `pages/interview/index.vue` | Interview hub (config, recent sessions) |
| `/interview/session` | `pages/interview/session.vue` | Live interview session (chat, scorecard, feedback) |
| `/interview/history` | `pages/interview/history.vue` | Interview history (sessions, detail cards) |
| `/skills` | `pages/skills/index.vue` | Skill mapper (filters, insights, mappings) |
| `/skills/pathways` | `pages/skills/pathways.vue` | Skills pathways (grid, readiness card) |
| `/studios` | `pages/studios/index.vue` | Studios index (grid, filters) |
| `/studios/[id]` | `pages/studios/[id].vue` | Studio detail / preview modal |
| `/studios/analytics` | `pages/studios/analytics.vue` | Studio analytics |
| `/ai/dashboard` | `pages/ai/dashboard.vue` | AI provider dashboard (preference, provider grid) |
| `/ai/chat` | `pages/ai/chat.vue` | Full-page AI chat (conversation panel, sidebar, voice controls) |
| `/automation` | `pages/automation/index.vue` | Automation hub (action grid, audit card) |
| `/automation/scraper` | `pages/automation/scraper.vue` | Scraper (overview, capabilities, jobs) |
| `/automation/job-apply` | `pages/automation/job-apply.vue` | Job-apply automation (form, run cards, scheduled) |
| `/automation/runs` | `pages/automation/runs/index.vue` | Automation runs table + filters |
| `/automation/runs/[id]` | `pages/automation/runs/[id].vue` | Run detail (stats, payload, timeline, screenshots) |
| `/automation/email` | `pages/automation/email.vue` | Email automation |
| `/gamification` | `pages/gamification.vue` | Gamification hub (challenges, achievements, summary) |
| `/docs/api` | `pages/docs/api.vue` | API documentation explorer (navigator, sections, tester) |

All authenticated pages declare `definePageMeta({ middleware: ["auth"] })`.
Each page delegates business logic to a `use<Feature>Page` composable and renders
feature-specific components. SEO meta is wired via `useSeoMeta` with i18n keys.

---

## 4. Components (~161 `.vue` files across feature subdirectories)

### `components/ui/` — Shared UI Primitives (22 `.vue` files)
Reusable design-system components shared across all features:

| Component | Role |
|---|---|
| `PageScaffold.vue` | Width/spacing token scaffold for page roots |
| `PageHeaderBlock.vue` | Title + description + actions header |
| `PageHeroHeader.vue` | Elevated hero header with aside content |
| `SectionGrid.vue` | Token-driven responsive grid layouts |
| `WorkPipeline.vue` | Horizontal step pipeline (dashboard flow) |
| `EmptyState.vue` | Empty-state column with optional CTA (link/button) |
| `LoadingSkeleton.vue` | Skeleton loaders (stats, lines, variants) |
| `ui/BootstrapErrorAlert.vue` | Error alert with retry action |
| `ConfirmDialog.vue` | Confirmation dialog (delete confirmations, etc.) |
| `AppModalFrame.vue` | Modal frame with focus trap, size tokens |
| `AppBreadcrumbs.vue` | Breadcrumb navigation |
| `AppPagination.vue` | Pagination control |
| `ToastContainer.vue` | Global toast host (aria-live, motion transitions) |
| `StatsRow.vue` | Horizontal stat row |
| `UiRadialMeter.vue` | Radial dial meter (readiness scores) |
| `AIProviderIcon.vue` | AI provider icon renderer |
| `QuickActionFab.vue` | Floating action button speed dial |
| `WorkspaceSectionNavigator.vue` | Section navigator with scroll-spy + scroll-snap SSOT (`validate:section-rail-scroll`; no `overflow-x-clip` on the navigator) |
| `CloseIcon.vue`, icons | Inline SVG icon set |

### `components/layout/` (3 files)
`AppNavbar.vue`, `AppSidebar.vue`, `AppDock.vue` — navigation chrome driven by
`NAVIGATION_ITEMS` registry with sidebar/dock inclusion flags. Menu/dock items use `TOUCH_TARGET_MIN_CLASS` (`min-h-11` / ≥44px).

### `components/icons/` (17 `.vue` files + registry)
Inline SVG icon components (`IconSearch`, `IconBolt`, `IconTrash`, etc.) +
`icon-registry.ts` mapping.

### `components/dashboard/` (~10 files)
Dashboard-specific cards: `DashboardWelcomeBanner`, `DashboardGamificationCard`,
`DashboardStatCardsGrid`, `DashboardChallengeActivityGrid`, `DashboardQuickActionsCard`,
`DashboardOnboardingCard`, + `dashboard-page-contracts.ts`.

### `components/resume/` (18 files)
Resume editor ecosystem: `ResumeEditorPanels`, `ResumePreviewDocument`, `ResumePreview`,
`ResumeLibraryPanel`, `ResumeProjectsEditor`, `ResumeEnhancementSteps`,
`ResumeBuildQuestionsCard`, `ResumeBuildTargetCard`, `ResumeBuildStatusCard`,
`ResumeCompletionCard`, `PersonalInfoForm`, `EducationList`, `ExperienceList`,
`SkillsEditor`, `ResumeGamingFields`, `ResumeTabList`, `ResumeEditorToolbar`,
`resume-page-contracts.ts`.

### `components/jobs/` (7 files)
`JobCard`, `JobSearchBar`, `JobsPageFiltersCard`, `JobDetailSidebar`,
`JobDetailMainContent`, `JobApplyDialog`, `JobMatchScore`.

### `components/interview/` (13 files)
`InterviewChat`, `ScoreCard`, `InterviewConfigModal`, `InterviewConfigSessionFields`,
`InterviewSessionOverviewCard`, `InterviewSessionContent`, `InterviewSessionPromptCard`,
`InterviewSessionContextCard`, `InterviewSessionFeedbackCard`, `InterviewRecentSessionsCard`,
`InterviewHistorySessionsCard`, `InterviewHistoryDetailCard`, `StudioSelector`.

### `components/cover-letter/` (~6 files)
`CoverLetterEditorCard`, `CoverLetterDetailFormCard`, `CoverLetterDetailStats`,
`CoverLetterGenerateDialog`, `CoverLetterPreviewCard`.

### `components/portfolio/` (~5 files)
`PortfolioGrid`, `PortfolioProjectModal`, `PortfolioProjectsCard`, `PortfolioProfileCard`,
`ProjectCard`.

### `components/skills/` (~6 files)
`SkillsPageFilters`, `SkillsPageMappings`, `SkillsPageInsights`, `SkillsPathwaysGrid`,
`SkillsPathwaysReadinessCard`.

### `components/studios/` (3 files)
`StudiosIndexGrid`, `StudiosIndexFiltersCard`, `StudiosPreviewModal`.

### `components/automation/` (19 files)
`AutomationHubActionGrid`, `AutomationHubAuditCard`, `AutomationScraperOverviewCard`,
`AutomationScraperCapabilityCard`, `AutomationScraperCapabilityGrid`,
`AutomationScraperJobsCard`, `AutomationJobApplyFormCard`, `AutomationJobApplyRunCard`,
`AutomationJobApplyScheduledCard`, `AutomationRunsTable`, `AutomationRunsFilters`,
`AutomationRunDetailStatsCard`, `AutomationRunDetailPayloadGrid`,
`AutomationRunDetailTimelineCard`, `AutomationRunDetailScreenshotsCard`,
`AutomationCoverageChips`, `automation-visuals.ts`, `scraper-sections.ts`,
`hub-sections.ts`.

### `components/ai/` (12 files)
`AIChatSidebar`, `AIChatBubble`, `AIChatConversationPanel`, `AIStreamingResponse`,
`FloatingChatWidget`, `FloatingChatPanel`, `FloatingChatToggleButton`, `BaoFairy`,
`AIDashboardPreferenceCard`, `AIDashboardProviderGrid`, `ChatVoiceControls`,
`SpeechModelProfileFields`.

### `components/settings/` (~20 files)
Settings panel ecosystem: `SettingsProfilePanel`, `SettingsPreferencesPanel`,
`SettingsAIProvidersPanel`, `SettingsAiRoutingCard`, `SettingsAiProviderAccordionList`,
`SettingsAutomationPanel`, `SettingsBrandPanel`, `SettingsJobIntelligencePanel`,
`SettingsJobIntelligenceSourcesGrid`, `SettingsJobIntelligenceTaxonomyWorkspace`,
`SettingsJobIntelligenceProvidersWorkspace`, `SettingsJobIntelligenceCollectionsCard`,
`SettingsEmailDeliveryPanel`, `SettingsSectionTabs`, `SettingsPanelHeader`,
`SpeechModelProfileFields`, + `settings-sections.ts`, `save-state.ts`,
`job-intelligence.ts`.

### `components/settings/brand/` (6 files)
`BrandIdentityTab`, `BrandContentTab`, `BrandThemesTab`, `BrandThemeSwatches`,
`BrandTypographyTab`, `BrandPreviewCard`, `BrandStatsCard`.

### `components/setup/` (5 files)
`SetupStepIndicator`, `SetupProfileStep`, `SetupAiConfigStep`, `SetupCompletionStep`,
`setup-page-contracts.ts`.

### `components/gamification/` (~6 files)
`GamificationSummaryCard`, `GamificationChallengesCard`, `GamificationAchievementsCard`,
`DailyChallenge`, `AchievementBadge`, `XPBar`.

### `components/api-docs/` (3 files)
`ApiDocsEndpointNavigator`, `ApiDocsEndpointSections`, `ApiEndpointTesterDialog`.

### `components/common/` (1 file)
`AppExportMenu.vue` — shared export/download menu.

---

## 5. Composables (~161 modules)

Composables are the heart of the client architecture. Pages are thin — they call a
`use<Feature>Page()` composable that aggregates state, actions, derived values, and
bootstrap logic. Composables are organized into three tiers:

### Tier 1: Core Infrastructure Composables

| Composable | Role |
|---|---|
| `useApi.ts` | Returns the typed Eden Treaty `$api` client (`ClientApi`) |
| `useAuth.ts` | Auth status check, init, stored API key get/set |
| `useBrand.ts` | Resolved brand settings + daisyUI CSS var map (read-only) |
| `useTheme.ts` | Light/dark theme toggle (cookie + `data-theme` attribute) |
| `useToast.ts` | Reactive toast store (success/error/info/warning, auto-dismiss) |
| `useSettings.ts` | Shared settings state (`useState` key) + fetch/save |
| `nuxtRuntime.ts` | Internal Nuxt runtime boundary (`useNuxtRuntimeApp`, `useNuxtState`) |
| `api-request.ts` | Typed `$fetch` / `fetch` boundary + file download helper |
| `async-flow.ts` | Reference-counted loading state, `settlePromise`, `assertApiResponse` |
| `useKeyboardShortcuts.ts` | Global `g+key` route shortcuts + `Cmd/Ctrl+K` chat focus |
| `useFocusTrap.ts` | WCAG-compliant dialog focus trapping |
| `useScrollSpy.ts` | IntersectionObserver-based section scroll spy + hash sync |
| `useDebouncedValue.ts` | Debounced reactive ref |
| `usePagination.ts` | Pagination state |
| `useDeleteConfirmation.ts` | Delete dialog state (show, pending id, confirm/cancel) |
| `useNavbarBreadcrumbs.ts` | Breadcrumb derivation from route |
| `useScoreColor.ts` | Score-based color coding |
| `createClientLogger` (utils) | Client-side diagnostic event dispatcher (no direct console) |

### Tier 2: Feature Page Composables (orchestration layer)

Each page composable composes Tier 3 modules and exposes a unified API to its page:

| Composable | Page |
|---|---|
| `useDashboardPage.ts` | `/` |
| `useSetupPage.ts` | `/setup` |
| `useSettingsPage.ts` | `/settings` |
| `useJobsIndexPage.ts` | `/jobs` |
| `useResumePage.ts` | `/resume` |
| `useCoverLetterListPage.ts` | `/cover-letter` |
| `usePortfolioPage.ts` | `/portfolio` |
| `useInterviewHubPage.ts` | `/interview` |
| `useInterviewSessionPage.ts` | `/interview/session` |
| `useInterviewHistoryPage.ts` | `/interview/history` |
| `useSkillsPage.ts` | `/skills` |
| `useSkillsPathwaysPage.ts` | `/skills/pathways` |
| `useStudiosIndexPage.ts` | `/studios` |
| `useStudioAnalyticsPage.ts` | `/studios/analytics` |
| `useAIDashboardPage.ts` | `/ai/dashboard` |
| `useAIChatPage.ts` | `/ai/chat` |
| `useAutomationHubPage.ts` | `/automation` |
| `useAutomationScraperPage.ts` | `/automation/scraper` |
| `useAutomationJobApplyPage.ts` | `/automation/job-apply` |
| `useAutomationRunDetailPage.ts` | `/automation/runs/[id]` |
| `useAutomationEmailPage.ts` | `/automation/email` |
| `useApiDocsPage.ts` | `/docs/api` |

### Tier 3: Decomposed Feature Modules

Feature logic is split into cohesive modules (bootstrap, actions, derived, contracts,
presentation, data) imported by the Tier 2 page composable:

- **AI:** `ai-state.ts`, `ai-context.ts`, `ai-chat-actions.ts`, `ai-chat-page-actions.ts`,
  `ai-chat-page-derived.ts`, `ai-chat-page-scroll.ts`, `ai-data-actions.ts`,
  `ai-dashboard-bootstrap.ts`, `ai-dashboard-actions.ts`, `ai-dashboard-presentation.ts`,
  `ai-dashboard-selection.ts`
- **Automation:** `automation-hub-page-data.ts`, `automation-hub-page-contracts.ts`,
  `automation-hub-page-presentation.ts`, `automation-scraper-bootstrap.ts`,
  `automation-scraper-actions.ts`, `automation-scraper-derived.ts`,
  `automation-scraper-presentation.ts`, `automation-run-detail-page-contracts.ts`
- **Interview:** `interview-hub-bootstrap.ts`, `interview-hub-actions.ts`,
  `interview-hub-derived.ts`, `interview-hub-presentation.ts`, `interview-hub-role-options.ts`,
  `interview-session-actions.ts`, `interview-session-timer.ts`, `interview-normalizers.ts`,
  `interview-history-page-state.ts`, `interview-history-page-actions.ts`,
  `interview-history-page-derived.ts`, `interview-history-page-contracts.ts`,
  `interview-history-page-formatters.ts`
- **Resume:** `resume-page-bootstrap.ts`, `resume-page-actions.ts`,
  `resume-page-actions-contracts.ts`, `resume-page-mutation-actions.ts`,
  `resume-page-editor-actions.ts`, `resume-page-view-actions.ts`, `resume-page-derived.ts`
- **Portfolio:** `portfolio-page-state.ts`, `portfolio-page-actions.ts`,
  `portfolio-page-derived.ts`
- **Skills:** `skills-page-actions.ts`, `skills-page-derived.ts`,
  `skills-pathways-page-contracts.ts`, `skills-pathways-page-data.ts`,
  `skills-pathways-page-presentation.ts`
- **Jobs:** `jobs-index-page-contracts.ts`, `jobs-index-page-runtime.ts`,
  `jobs-index-page-actions.ts`, `jobs-index-page-derived.ts`
- **Cover Letter:** `cover-letter-list-page-actions.ts`
- **Settings:** `settings-page/derived.ts`, `settings-page/save-actions.ts`,
  `settings-page/provider-actions.ts`
- **Setup:** `setup-page-bootstrap.ts`, `setup-page-actions.ts`
- **Dashboard:** `dashboard-page-data.ts`
- **Floating Chat:** `floating-chat-widget-core.ts`, `floating-chat-widget-exposed.ts`,
  `floating-chat-widget-actions.ts`, `floating-chat-widget-derived.ts`,
  `floating-chat-widget-contracts.ts`
- **API Docs:** `api-docs-page-contracts.ts`, `api-docs-page-data.ts`,
  `api-docs-page-navigation.ts`, `api-docs-page-presentation.ts`, `api-docs-page-tester.ts`,
  `api-docs-page-tester-request.ts`, `api-docs-page-tester-actions.ts`

### API Normalizers (`api-normalizer-*.ts`)
Typed response unwrapping / normalization per API domain:
`api-normalizer-shared.ts`, `api-normalizer-user.ts`, `api-normalizer-settings.ts`,
`api-normalizer-settings-automation.ts`, `api-normalizer-settings-constants.ts`,
`api-normalizer-jobs.ts`, `api-normalizer-resume.ts`, `api-normalizer-cover-letter.ts`,
`api-normalizer-portfolio.ts`, `api-normalizer-interview.ts` (via `interview-normalizers.ts`),
`api-normalizer-skills.ts`, `api-normalizer-studios.ts`.

### Other Feature Composables
- `useAI.ts` — chat + analysis + generation orchestrator
- `useAutomation.ts`, `useAutomationRunStream.ts` — RPA run lifecycle + WebSocket stream
- `useFlowEngine.ts` — cross-page UX decision engine (readiness → recommended action)
- `useGamification.ts`, `usePipelineGamification.ts` — XP/challenge/streak state
- `useInterview.ts`, `useChatVoice.ts`, `useSpeech.ts`, `useSTT.ts`, `useTTS.ts`,
  `useSpeechModelProfiles.ts` — interview + voice/Speech-to-Text/Text-to-Speech
- `useJobs.ts`, `useResume.ts`, `useCoverLetter.ts`, `usePortfolio.ts`,
  `useSkillMapping.ts`, `useStudio.ts`, `useStatistics.ts`, `useUser.ts`
- `useBrandPreviewStyles.ts` — brand preview CSS derivation
- `useAIChatContextSummary.ts` — AI chat context summarization
- `useFloatingChatWidget.ts` — floating chat widget orchestrator

### Specs
Co-located tests: `useAuth.nuxt.spec.ts`, `useSettings.nuxt.spec.ts`,
`useChatVoice.nuxt.spec.ts`, `useAutomationRunStream.nuxt.spec.ts`,
`useScrollSpy.spec.ts`, `floating-chat-widget-actions.spec.ts`.

---

## 6. Constants & Registries (~20 files)

All UI copy is i18n-keyed; constants hold translation keys, not display strings.

| File | Role |
|---|---|
| `navigation.ts` | `NAVIGATION_ITEMS` registry + active-route matching (`isRouteActive`, `normalizeRoutePath`) |
| `layout.ts` | DOM IDs, shell/surface/hero/empty-state class contracts |
| `ui-layout.ts` | Width/spacing/grid/modal size token → Tailwind class maps |
| `dashboard-copy.ts` | Dashboard i18n key registry (typed via `AppTranslationSchema`) |
| `dashboard-core.ts` | Dashboard stat cards, onboarding steps, async data key, time constants |
| `dashboard-pipeline.ts` | Pipeline steps, flow actions, quick actions, activity type matchers |
| `flow-engine.ts` | `FlowActionId` registry, readiness resolution, recommendation engine |
| `gamification.ts` | XP/progress bounds, skeleton lines, gamification icons |
| `chat.ts` | Chat density tokens (comfortable/compact), panel/container size classes |
| `skills.ts` | Skills filter/category/confidence/gamification constants |
| `studios.ts` | Studio index debounce + visible-count constants |
| `i18n.ts` | Locale code → label key map, `isAppLanguageCode` guard |
| `i18n-catalog.ts` | `I18N_MESSAGE_CATALOG` (en/es/fr/ja) + `AvailableLocale` type |
| `flow-engine.spec.ts` | Flow engine tests |

---

## 7. Utils (~30 pure modules)

| File | Role |
|---|---|
| `endpoints.ts` | API base / route base / endpoint / WebSocket URL resolution |
| `treaty-base.ts` | Eden Treaty base path normalization (de-duplicates API prefix) |
| `api-response.ts` | Envelope unwrap, error detection, payload requirement |
| `errors.ts` | `getErrorMessage` — user-facing error extraction (re-exports shared) |
| `client-logger.ts` | `createClientLogger` — diagnostic `CustomEvent` dispatcher (no console) |
| `brand-overrides.ts` | `buildBrandedLocaleMessages` — deep-clone + dot-path override |
| `labels.ts` | Shared label formatters |
| `ai-control-plane.ts` | AI control plane helpers (+ spec) |
| `automation-capabilities.ts` | Automation capability metadata |
| `interview-navigation.ts` | Interview route navigation helpers |

Shared utilities are imported from `@bao/shared/utils/*` and `@bao/shared/constants/*`.

---

## 8. Types

| File | Role |
|---|---|
| `client-api.ts` | `ClientApi` interface (route group contracts) + `assertClientApi` runtime guard |
| `client-api-contracts.ts` | Per-domain API contract interfaces (`AuthApi`, `JobsApi`, etc.) |
| `automation-scraper.ts` | Automation scraper type definitions |
| `i18n.d.ts` | `vue-i18n` module augmentation binding `AppTranslationSchema` |

---

## 9. i18n

- **Locales:** en-US (schema source of truth), es-ES, fr-FR, ja-JP.
- **Schema typing:** `AppTranslationSchema` (from `locales/en-US`) → `vue-i18n` module
  augmentation in `types/i18n.d.ts` ensures `t()` calls are type-checked.
- **Brand overrides:** `buildBrandedLocaleMessages` deep-clones the base catalog and
  applies white-label copy overrides by dot-path key, applied reactively in `app.vue`.
- **Key registries:** Feature constants (e.g., `dashboard-copy.ts`, `skills.ts`) hold
  typed translation keys derived from the schema, satisfying `Record<…, KeyType>`.

---

## 10. Cross-Cutting Patterns

### API Access
- All API calls flow through `useApi()` → typed Eden Treaty `$api` (`ClientApi`).
- Direct fetch is isolated to `api-request.ts` (`requestApi<T>`, `downloadApiFile`).
- Responses are unwrapped via `api-response.ts` (`unwrapApiResponsePayload`,
  `requireApiResponsePayload`) and domain normalizers.

### Error Handling
- No bare `try/catch` — async errors are handled via `settlePromise` / `settle`
  (`@bao/shared/utils/promise`) returning typed `{ ok, value | error }` unions.
- `assertApiResponse` throws deterministic errors with i18n fallback messages.
- `getErrorMessage` extracts user-facing messages from `unknown` error values.
- Pages render `BootstrapErrorAlert` with retry actions in error UI states.

### State Management
- `useState` (Nuxt shared SSR state) keyed via `STATE_KEYS` constants.
- Composables return `readonly()` refs to prevent external mutation.
- Reference-counted loading via `withLoadingState` (WeakMap-tracked counters).
- `onScopeDispose` for cleanup (observers, subscriptions, listeners).

### Styling
- **daisyUI v5** semantic tokens via `data-theme` + CSS custom properties.
- **Tailwind** utility classes — no inline `style=` attributes (contract enforced).
- Token-based layout via `UI_WIDTH_CLASS_BY_TOKEN`, `UI_GRID_CLASS_BY_TOKEN`, etc.
- Brand palettes mapped to daisyUI semantic color vars in `useBrand`.
- Glass surface, hero, empty-state, and shell class contracts in `constants/layout.ts`.

### Type Safety
- Strict TypeScript — no `as any` or `: any` in application code.
- `satisfies` used pervasively for registry/type compliance checking.
- Runtime guards (`isRecord`, `assertClientApi`, `isAppLanguageCode`).
- `readonly` arrays/objects for immutable registries.

### Accessibility
- Focus trapping (`useFocusTrap`) on modals.
- `aria-live` regions for toasts (assertive for errors, polite otherwise).
- Skip-link, ARIA labels, `aria-hidden` decorative icons.
- Keyboard navigation shortcuts (`g+key`, `Cmd/Ctrl+K`).

### Routing
- File-based routing in `pages/`.
- `APP_ROUTES` constants (from `@bao/shared/constants/routes`) — no hardcoded paths.
- `navigateTo` only in `middleware/auth.ts`; programmatic nav via `useRouter().push`.
- Active-route matching via `isRouteActive` (segment-aware, dynamic-segment aware).
