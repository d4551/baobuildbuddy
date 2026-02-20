import { APP_ROUTES } from "@bao/shared";
import type { AppTranslationSchema } from "~/locales/en-US";

/**
 * Primary stat identifiers rendered on dashboard hero tiles.
 */
export type DashboardStatKey = "savedJobs" | "resumeCount" | "interviewSessionCount";

type DashboardRootSchema = AppTranslationSchema["dashboard"];
type DashboardTopLevelKey =
  | "pageTitle"
  | "seoDescription"
  | "welcomeDescription"
  | "emptyStateTitle"
  | "emptyStateDescription"
  | "recentActivityTitle"
  | "recentActivityEmptyLabel"
  | "dailyChallengeTitle"
  | "quickActionsTitle"
  | "levelLabel"
  | "streakLabel"
  | "retryButtonLabel"
  | "loadErrorFallback"
  | "setupCtaLabel"
  | "onboardingChecklistTitle"
  | "metricsSummaryLabel"
  | "pipelineTitle"
  | "pipelineDescription"
  | "pipelineAria"
  | "pipelineNextStepLabel";
type DashboardCopyKey = `dashboard.${DashboardTopLevelKey}`;
type DashboardHeroPhraseKey =
  `dashboard.heroPhrases.${keyof DashboardRootSchema["heroPhrases"] & string}`;
type DashboardOnboardingLabelKey =
  `dashboard.onboarding.${keyof DashboardRootSchema["onboarding"] & string}`;
type DashboardStatLabelKey = `dashboard.stats.${keyof DashboardRootSchema["stats"] & string}`;
type DashboardQuickActionLabelKey =
  `dashboard.quickActions.actions.${keyof DashboardRootSchema["quickActions"]["actions"] & string}`;
type DashboardPipelineStepLabelKey =
  `dashboard.pipeline.steps.${keyof DashboardRootSchema["pipeline"]["steps"] & string}`;
type DashboardPipelineStatusLabelKey =
  `dashboard.pipeline.status.${keyof DashboardRootSchema["pipeline"]["status"] & string}`;
type DashboardRelativeTimeLabelKey =
  `dashboard.relativeTime.${keyof DashboardRootSchema["relativeTime"] & string}`;
type DashboardWelcomeHeadingKey =
  `dashboard.welcomeHeading.${keyof DashboardRootSchema["welcomeHeading"] & string}`;
type DashboardErrorKey = `dashboard.errors.${keyof DashboardRootSchema["errors"] & string}`;
type DashboardActivityFallbackKey = "dashboard.activityFallback";
type DashboardDailyChallengeXpKey = "dashboard.dailyChallengeXpLabel";

/**
 * Dashboard quick-action configuration model.
 */
export interface DashboardQuickAction {
  /** Stable item identifier for keyed rendering and tracking. */
  readonly id: string;
  /** Translation key displayed in the action button. */
  readonly labelKey: DashboardQuickActionLabelKey;
  /** Route destination. */
  readonly to: string;
  /** SVG path for the icon. */
  readonly iconPath: string;
}

/**
 * Dashboard onboarding step configuration model.
 */
export interface DashboardOnboardingStep {
  /** Stable identifier for keyed rendering. */
  readonly id: string;
  /** Translation key shown in the onboarding progress checklist. */
  readonly labelKey: DashboardOnboardingLabelKey;
  /** Destination path for the onboarding action. */
  readonly to: string;
}

/**
 * Dashboard primary stat card metadata.
 */
export interface DashboardStatCard {
  /** Stable identifier for rendering and testing hooks. */
  readonly id: string;
  /** Translation key for stat title. */
  readonly titleKey: DashboardStatLabelKey;
  /** Destination route when card is clicked. */
  readonly to: string;
  /** Associated dashboard stat key. */
  readonly statKey: DashboardStatKey;
  /** SVG path for icon rendering. */
  readonly iconPath: string;
  /** Accent utility class for icon and CTA color. */
  readonly accentClass: string;
  /** Translation key for helper CTA text. */
  readonly ctaLabelKey: DashboardStatLabelKey;
}

/**
 * Dashboard end-to-end workflow pipeline metadata.
 */
export interface DashboardPipelineStep {
  /** Stable item identifier for keyed rendering and status mapping. */
  readonly id: "search" | "scrape" | "customize" | "apply" | "gamify";
  /** Translation key for visible step label. */
  readonly labelKey: DashboardPipelineStepLabelKey;
  /** Route destination for this step. */
  readonly to: string;
}

/**
 * Workflow status for each pipeline step.
 */
export type DashboardPipelineStatus = "complete" | "inProgress" | "pending";

/**
 * Pipeline snapshot values used to compute workflow completion state.
 */
export interface DashboardPipelineSnapshot {
  /** Saved jobs count from dashboard statistics. */
  readonly savedJobs: number;
  /** Applied jobs count from dashboard statistics. */
  readonly appliedJobs: number;
  /** Resume count from dashboard statistics. */
  readonly resumeCount: number;
  /** Cover-letter count from dashboard statistics. */
  readonly coverLetterCount: number;
  /** Total automation runs from dashboard statistics. */
  readonly automationRuns: number;
  /** Successful automation runs from dashboard statistics. */
  readonly successfulAutomationRuns: number;
  /** Skill mappings count from dashboard statistics. */
  readonly mappedSkillsCount: number;
  /** Current XP value from dashboard statistics. */
  readonly gamificationXp: number;
}

/**
 * Pipeline step model with resolved status for UI rendering.
 */
export interface DashboardPipelineStepViewModel extends DashboardPipelineStep {
  /** Computed workflow status for this step. */
  readonly status: DashboardPipelineStatus;
}

/**
 * Translation keys used by the dashboard page.
 */
export const DASHBOARD_COPY_KEYS = {
  pageTitle: "dashboard.pageTitle",
  seoDescription: "dashboard.seoDescription",
  welcomeDescription: "dashboard.welcomeDescription",
  emptyStateTitle: "dashboard.emptyStateTitle",
  emptyStateDescription: "dashboard.emptyStateDescription",
  recentActivityTitle: "dashboard.recentActivityTitle",
  recentActivityEmptyLabel: "dashboard.recentActivityEmptyLabel",
  dailyChallengeTitle: "dashboard.dailyChallengeTitle",
  quickActionsTitle: "dashboard.quickActionsTitle",
  levelLabel: "dashboard.levelLabel",
  streakLabel: "dashboard.streakLabel",
  retryButtonLabel: "dashboard.retryButtonLabel",
  loadErrorFallback: "dashboard.loadErrorFallback",
  setupCtaLabel: "dashboard.setupCtaLabel",
  onboardingChecklistTitle: "dashboard.onboardingChecklistTitle",
  metricsSummaryLabel: "dashboard.metricsSummaryLabel",
  pipelineTitle: "dashboard.pipelineTitle",
  pipelineDescription: "dashboard.pipelineDescription",
  pipelineAria: "dashboard.pipelineAria",
  pipelineNextStepLabel: "dashboard.pipelineNextStepLabel",
} as const satisfies Record<DashboardTopLevelKey, DashboardCopyKey>;

/**
 * Translation keys used for personalized dashboard welcome headings.
 */
export const DASHBOARD_WELCOME_HEADING_KEYS = {
  named: "dashboard.welcomeHeading.named",
  fallback: "dashboard.welcomeHeading.fallback",
} as const satisfies {
  named: DashboardWelcomeHeadingKey;
  fallback: DashboardWelcomeHeadingKey;
};

/**
 * Rotating motivational phrase translation keys shown in the dashboard hero.
 */
export const DASHBOARD_MOTIVATIONAL_PHRASE_KEYS = [
  "dashboard.heroPhrases.findDreamRole",
  "dashboard.heroPhrases.buildPortfolio",
  "dashboard.heroPhrases.prepareInterviews",
  "dashboard.heroPhrases.levelUpSkills",
] as const satisfies readonly DashboardHeroPhraseKey[];

/**
 * Translation keys for relative activity timestamps.
 */
export const DASHBOARD_RELATIVE_TIME_KEYS = {
  minutesAgo: "dashboard.relativeTime.minutesAgo",
  hoursAgo: "dashboard.relativeTime.hoursAgo",
  daysAgo: "dashboard.relativeTime.daysAgo",
} as const satisfies Record<"minutesAgo" | "hoursAgo" | "daysAgo", DashboardRelativeTimeLabelKey>;

/**
 * Translation keys for shared accessibility labels on dashboard cards and progress indicators.
 */
export const DASHBOARD_A11Y_KEYS = {
  statCardAria: "dashboard.stats.cardAria",
  levelProgressAria: "dashboard.stats.levelProgressAria",
  challengeProgressAria: "dashboard.stats.challengeProgressAria",
} as const satisfies Record<
  "statCardAria" | "levelProgressAria" | "challengeProgressAria",
  DashboardStatLabelKey
>;

/**
 * Translation keys for pipeline status badges.
 */
export const DASHBOARD_PIPELINE_STATUS_KEYS = {
  complete: "dashboard.pipeline.status.complete",
  inProgress: "dashboard.pipeline.status.inProgress",
  pending: "dashboard.pipeline.status.pending",
} as const satisfies Record<"complete" | "inProgress" | "pending", DashboardPipelineStatusLabelKey>;

/**
 * Translation key for formatting challenge XP reward labels.
 */
export const DASHBOARD_DAILY_CHALLENGE_XP_LABEL_KEY =
  "dashboard.dailyChallengeXpLabel" as const satisfies DashboardDailyChallengeXpKey;

/**
 * Translation keys for dashboard data-load fallback errors.
 */
export const DASHBOARD_ERROR_KEYS = {
  profileLoadFallback: "dashboard.errors.profileLoadFallback",
  metricsLoadFallback: "dashboard.errors.metricsLoadFallback",
  gamificationLoadFallback: "dashboard.errors.gamificationLoadFallback",
  challengesLoadFallback: "dashboard.errors.challengesLoadFallback",
} as const satisfies Record<
  | "profileLoadFallback"
  | "metricsLoadFallback"
  | "gamificationLoadFallback"
  | "challengesLoadFallback",
  DashboardErrorKey
>;

/**
 * Translation key for fallback activity labels when no action text is available.
 */
export const DASHBOARD_ACTIVITY_FALLBACK_KEY =
  "dashboard.activityFallback" as const satisfies DashboardActivityFallbackKey;

/**
 * useAsyncData key for SSR dashboard bootstrap.
 */
export const DASHBOARD_ASYNC_DATA_KEY = "dashboard-bootstrap";

/**
 * Maximum number of recent activity entries shown on dashboard.
 */
export const DASHBOARD_RECENT_ACTIVITY_LIMIT = 5;

/**
 * Time conversion constants for relative timestamps.
 */
export const DASHBOARD_TIME_CONSTANTS = {
  millisecondsPerMinute: 60_000,
  millisecondsPerHour: 3_600_000,
  millisecondsPerDay: 86_400_000,
  heroTextRotateIntervalMs: 3_200,
} as const;

/**
 * Suggested onboarding path for first-time dashboard users.
 */
export const DASHBOARD_ONBOARDING_STEPS: readonly DashboardOnboardingStep[] = [
  { id: "profile", labelKey: "dashboard.onboarding.profile", to: APP_ROUTES.settings },
  { id: "aiProvider", labelKey: "dashboard.onboarding.aiProvider", to: APP_ROUTES.settings },
  { id: "resume", labelKey: "dashboard.onboarding.resume", to: APP_ROUTES.resume },
  { id: "jobs", labelKey: "dashboard.onboarding.jobs", to: APP_ROUTES.jobs },
] as const;

/**
 * End-to-end career workflow sequence shown on dashboard.
 */
export const DASHBOARD_PIPELINE_STEPS: readonly DashboardPipelineStep[] = [
  { id: "search", labelKey: "dashboard.pipeline.steps.search", to: APP_ROUTES.jobs },
  { id: "scrape", labelKey: "dashboard.pipeline.steps.scrape", to: APP_ROUTES.automationScraper },
  { id: "customize", labelKey: "dashboard.pipeline.steps.customize", to: APP_ROUTES.resume },
  { id: "apply", labelKey: "dashboard.pipeline.steps.apply", to: APP_ROUTES.automationJobApply },
  { id: "gamify", labelKey: "dashboard.pipeline.steps.gamify", to: APP_ROUTES.gamification },
] as const;

/**
 * Resolves pipeline step completion using cross-feature dashboard statistics.
 *
 * @param snapshot Dashboard metrics snapshot.
 * @returns Pipeline steps with computed status values.
 */
export function resolveDashboardPipelineSteps(
  snapshot: DashboardPipelineSnapshot,
): readonly DashboardPipelineStepViewModel[] {
  const completion = {
    search: snapshot.savedJobs > 0 || snapshot.appliedJobs > 0,
    scrape: snapshot.automationRuns > 0,
    customize:
      snapshot.resumeCount > 0 && (snapshot.coverLetterCount > 0 || snapshot.mappedSkillsCount > 0),
    apply: snapshot.appliedJobs > 0 || snapshot.successfulAutomationRuns > 0,
    gamify: snapshot.gamificationXp > 0,
  } as const;

  const firstIncompleteStep =
    DASHBOARD_PIPELINE_STEPS.find((step) => !completion[step.id])?.id ?? null;

  return DASHBOARD_PIPELINE_STEPS.map((step) => {
    if (completion[step.id]) {
      return {
        ...step,
        status: "complete",
      };
    }

    if (step.id === firstIncompleteStep) {
      return {
        ...step,
        status: "inProgress",
      };
    }

    return {
      ...step,
      status: "pending",
    };
  });
}

const QUICK_ACTION_REGISTRY = {
  jobs: {
    id: "jobs",
    labelKey: "dashboard.quickActions.actions.browseJobs",
    to: APP_ROUTES.jobs,
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  resume: {
    id: "resume",
    labelKey: "dashboard.quickActions.actions.buildResume",
    to: APP_ROUTES.resume,
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  interview: {
    id: "interview",
    labelKey: "dashboard.quickActions.actions.practiceInterview",
    to: APP_ROUTES.interview,
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  aiChat: {
    id: "ai-chat",
    labelKey: "dashboard.quickActions.actions.aiChat",
    to: APP_ROUTES.aiChat,
    iconPath:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
} as const satisfies Record<string, DashboardQuickAction>;

/**
 * Shared card configuration for top-level dashboard metrics.
 */
export const DASHBOARD_STAT_CARDS: readonly DashboardStatCard[] = [
  {
    id: "saved-jobs",
    titleKey: "dashboard.stats.savedJobsTitle",
    to: APP_ROUTES.jobs,
    statKey: "savedJobs",
    iconPath:
      "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    accentClass: "text-primary",
    ctaLabelKey: "dashboard.stats.savedJobsCta",
  },
  {
    id: "resumes",
    titleKey: "dashboard.stats.resumesTitle",
    to: APP_ROUTES.resume,
    statKey: "resumeCount",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    accentClass: "text-secondary",
    ctaLabelKey: "dashboard.stats.resumesCta",
  },
  {
    id: "interview-sessions",
    titleKey: "dashboard.stats.interviewSessionsTitle",
    to: APP_ROUTES.interview,
    statKey: "interviewSessionCount",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    accentClass: "text-accent",
    ctaLabelKey: "dashboard.stats.interviewSessionsCta",
  },
] as const;

/**
 * Quick actions rendered in the dashboard footer section.
 */
export const DASHBOARD_QUICK_ACTIONS: readonly DashboardQuickAction[] = [
  QUICK_ACTION_REGISTRY.jobs,
  QUICK_ACTION_REGISTRY.resume,
  QUICK_ACTION_REGISTRY.interview,
  QUICK_ACTION_REGISTRY.aiChat,
] as const;

/**
 * Quick actions rendered in the floating action button speed dial.
 */
export const FAB_QUICK_ACTIONS: readonly DashboardQuickAction[] = [
  QUICK_ACTION_REGISTRY.resume,
  QUICK_ACTION_REGISTRY.aiChat,
  QUICK_ACTION_REGISTRY.jobs,
] as const;

/**
 * Maps activity categories to emoji glyphs for quick scanning.
 *
 * @param activityType Activity category value.
 * @returns Emoji icon text.
 */
export function getDashboardActivityEmoji(activityType: string): string {
  if (activityType.includes("job")) return "📝";
  if (activityType.includes("resume")) return "📄";
  if (activityType.includes("interview")) return "🎤";
  if (activityType.includes("portfolio")) return "🧩";
  return "⚡";
}
