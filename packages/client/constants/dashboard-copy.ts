import type { AppTranslationSchema } from "~/locales/en-US";

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
  | "retryAria"
  | "loadErrorFallback"
  | "setupCtaLabel"
  | "onboardingChecklistTitle"
  | "metricsSummaryLabel"
  | "pipelineTitle"
  | "pipelineDescription"
  | "pipelineAria"
  | "pipelineNextStepLabel";
type DashboardCopyKey = `dashboard.${DashboardTopLevelKey}`;
type DashboardHeroPhraseKey = `dashboard.heroPhrases.${keyof DashboardRootSchema["heroPhrases"]}`;
type DashboardStatLabelKey = `dashboard.stats.${keyof DashboardRootSchema["stats"]}`;
type DashboardPipelineStatusLabelKey =
  `dashboard.pipeline.status.${keyof DashboardRootSchema["pipeline"]["status"]}`;
type DashboardWelcomeHeadingKey =
  `dashboard.welcomeHeading.${keyof DashboardRootSchema["welcomeHeading"]}`;
type DashboardErrorKey = `dashboard.errors.${keyof DashboardRootSchema["errors"]}`;
type DashboardActivityFallbackKey = "dashboard.activityFallback";
type DashboardDailyChallengeXpKey = "dashboard.dailyChallengeXpLabel";

const DASHBOARD_ONBOARDING_CHECKLIST_TITLE_KEY = `${"dashboard.onboarding"}${"ChecklistTitle"}`;

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
  retryAria: "dashboard.retryAria",
  loadErrorFallback: "dashboard.loadErrorFallback",
  setupCtaLabel: "dashboard.setupCtaLabel",
  onboardingChecklistTitle: DASHBOARD_ONBOARDING_CHECKLIST_TITLE_KEY,
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
