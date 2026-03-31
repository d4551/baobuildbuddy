import type { AppTranslationSchema } from "~/locales/en-US";

/**
 * Primary stat identifiers rendered on dashboard hero tiles.
 */
export type DashboardStatKey = "savedJobs" | "resumeCount" | "interviewSessionCount";

type DashboardRootSchema = AppTranslationSchema["dashboard"];
type DashboardOnboardingLabelKey =
  `dashboard.onboarding.${keyof DashboardRootSchema["onboarding"]}`;
type DashboardStatLabelKey = `dashboard.stats.${keyof DashboardRootSchema["stats"]}`;
type DashboardQuickActionLabelKey =
  `dashboard.quickActions.actions.${keyof DashboardRootSchema["quickActions"]["actions"]}`;
type DashboardPipelineStepLabelKey =
  `dashboard.pipeline.steps.${keyof DashboardRootSchema["pipeline"]["steps"]}`;

/**
 * Dashboard quick-action configuration model.
 */
export interface DashboardQuickAction {
  readonly id: string;
  readonly labelKey: DashboardQuickActionLabelKey;
  readonly to: string;
  readonly iconPath: string;
}

/**
 * Dashboard onboarding step configuration model.
 */
export interface DashboardOnboardingStep {
  readonly id: string;
  readonly labelKey: DashboardOnboardingLabelKey;
  readonly to: string;
}

/**
 * Dashboard primary stat card metadata.
 */
export interface DashboardStatCard {
  readonly id: string;
  readonly titleKey: DashboardStatLabelKey;
  readonly to: string;
  readonly statKey: DashboardStatKey;
  readonly iconPath: string;
  readonly accentClass: string;
  readonly ctaLabelKey: DashboardStatLabelKey;
}

/**
 * Dashboard end-to-end workflow pipeline metadata.
 */
export interface DashboardPipelineStep {
  readonly id: "search" | "scrape" | "customize" | "apply" | "gamify";
  readonly labelKey: DashboardPipelineStepLabelKey;
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
  readonly savedJobs: number;
  readonly appliedJobs: number;
  readonly resumeCount: number;
  readonly coverLetterCount: number;
  readonly automationRuns: number;
  readonly successfulAutomationRuns: number;
  readonly mappedSkillsCount: number;
  readonly gamificationXp: number;
}

/**
 * Pipeline step model with resolved status for UI rendering.
 */
export interface DashboardPipelineStepViewModel extends DashboardPipelineStep {
  readonly status: DashboardPipelineStatus;
}
