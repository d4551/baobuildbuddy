import type { DashboardStats } from "@bao/shared";
import { APP_ROUTES } from "@bao/shared";

/**
 * Profile completeness threshold used when deriving setup readiness from dashboard stats.
 */
export const FLOW_PROFILE_COMPLETENESS_THRESHOLD = 0.6;

/**
 * Canonical workflow stages for the cross-page UX decision engine.
 */
export type FlowStage =
  | "setup"
  | "resumeAssets"
  | "portfolioAssets"
  | "jobDiscovery"
  | "applicationAutomation"
  | "interviewPractice"
  | "optimize";

/**
 * Stable action identifiers returned by the flow engine.
 */
export type FlowActionId =
  | "setup"
  | "jobs"
  | "resume"
  | "coverLetter"
  | "portfolio"
  | "automationScraper"
  | "automationApply"
  | "automationRuns"
  | "interview"
  | "aiChat";

/**
 * Action metadata used by the UI to render deterministic recommendations.
 */
export interface FlowActionDefinition {
  /** Stable action identifier. */
  readonly id: FlowActionId;
  /** Route target for the action. */
  readonly to: string;
  /** Translation key used for the action label. */
  readonly labelKey: string;
  /** Icon path rendered in CTA contexts. */
  readonly iconPath: string;
}

/**
 * Recommendation model used by pages for CTA rendering.
 */
export interface FlowRecommendation extends FlowActionDefinition {
  /** Action emphasis weight for UI styling. */
  readonly emphasis: "primary" | "secondary";
}

/**
 * Readiness booleans consumed by the flow engine.
 */
export interface FlowReadinessState {
  /** Whether profile/setup identity data is complete. */
  readonly isProfileComplete: boolean;
  /** Whether the setup wizard can be considered complete. */
  readonly isSetupComplete: boolean;
  /** Whether at least one resume exists. */
  readonly hasResume: boolean;
  /** Whether at least one cover letter exists. */
  readonly hasCoverLetter: boolean;
  /** Whether the portfolio has at least one project. */
  readonly hasPortfolio: boolean;
}

/**
 * Input payload for the global flow engine.
 */
export interface FlowEngineInput {
  /** Dashboard stats snapshot when available. */
  readonly stats: DashboardStats | null;
  /** Optional readiness overrides from page-local bootstrap data. */
  readonly readiness?: Partial<FlowReadinessState>;
}

/**
 * Output payload for the global flow engine.
 */
export interface FlowResolution {
  /** Primary action to promote for the current user state. */
  readonly primaryAction: FlowRecommendation;
  /** Secondary recommendations ordered by relevance. */
  readonly recommendedActions: readonly FlowRecommendation[];
  /** Translation key for concise "next step" messaging. */
  readonly nextStepLabel: string;
  /** Current stage in the end-to-end flow. */
  readonly flowStage: FlowStage;
}

/**
 * Builds a flow-engine input payload with readiness normalized through the canonical threshold rules.
 *
 * @param stats Dashboard stats snapshot.
 * @param readinessOverrides Optional readiness overrides.
 * @returns Flow-engine input with normalized readiness.
 */
export function createFlowEngineInput(
  stats: DashboardStats | null,
  readinessOverrides: Partial<FlowReadinessState> = {},
): FlowEngineInput {
  return {
    stats,
    readiness: resolveFlowReadinessState(stats, readinessOverrides),
  };
}

/**
 * Canonical action registry consumed by the flow engine.
 */
export const FLOW_ACTION_DEFINITIONS: Record<FlowActionId, FlowActionDefinition> = {
  setup: {
    id: "setup",
    to: APP_ROUTES.setup,
    labelKey: "dashboard.setupCtaLabel",
    iconPath:
      "M12 4v16m8-8H4m13-7l-1.414 1.414M6.414 17.586 5 19m14-1.414L17.586 19M6.414 6.414 5 5",
  },
  jobs: {
    id: "jobs",
    to: APP_ROUTES.jobs,
    labelKey: "dashboard.pipeline.steps.search",
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  resume: {
    id: "resume",
    to: APP_ROUTES.resume,
    labelKey: "dashboard.pipeline.steps.customize",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  coverLetter: {
    id: "coverLetter",
    to: APP_ROUTES.coverLetter,
    labelKey: "resumePage.completion.quickActions.coverLetter",
    iconPath:
      "M7 8h10M7 12h8m-8 4h6m-5 4h8a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  portfolio: {
    id: "portfolio",
    to: APP_ROUTES.portfolio,
    labelKey: "resumePage.completion.quickActions.portfolio",
    iconPath:
      "M4 7h16M4 12h16M4 17h10M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  },
  automationScraper: {
    id: "automationScraper",
    to: APP_ROUTES.automationScraper,
    labelKey: "dashboard.pipeline.steps.scrape",
    iconPath: "M4 4h16v4H4V4zm0 6h16v10H4V10zm3 3h3v3H7v-3zm5 0h5v1h-5v-1zm0 2h5v1h-5v-1z",
  },
  automationApply: {
    id: "automationApply",
    to: APP_ROUTES.automationJobApply,
    labelKey: "dashboard.pipeline.steps.apply",
    iconPath: "M12 19l9-7-9-7v4.5C7 9.5 4 11.5 3 16c2-2 4.5-3 9-3V19z",
  },
  automationRuns: {
    id: "automationRuns",
    to: APP_ROUTES.automationRuns,
    labelKey: "automation.hub.viewRunsButton",
    iconPath: "M13 3v10h8m-8-10a9 9 0 100 18 9 9 0 000-18zM5 12h4m6 0h4M12 7v2m0 6v2",
  },
  interview: {
    id: "interview",
    to: APP_ROUTES.interview,
    labelKey: "dashboard.quickActions.actions.practiceInterview",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  aiChat: {
    id: "aiChat",
    to: APP_ROUTES.aiChat,
    labelKey: "dashboard.quickActions.actions.aiChat",
    iconPath:
      "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
};

/**
 * Computes readiness defaults from dashboard stats and optional page overrides.
 *
 * @param stats Dashboard stats snapshot.
 * @param readiness Optional page-level readiness overrides.
 * @returns Fully resolved readiness state.
 */
export function resolveFlowReadinessState(
  stats: DashboardStats | null,
  readiness: Partial<FlowReadinessState> = {},
): FlowReadinessState {
  const profileCompleteness = stats?.profile.completeness ?? 0;
  const defaultProfileComplete = profileCompleteness >= FLOW_PROFILE_COMPLETENESS_THRESHOLD;

  return {
    isProfileComplete: readiness.isProfileComplete ?? defaultProfileComplete,
    isSetupComplete: readiness.isSetupComplete ?? defaultProfileComplete,
    hasResume: readiness.hasResume ?? (stats?.resumes.count ?? 0) > 0,
    hasCoverLetter: readiness.hasCoverLetter ?? (stats?.coverLetters.count ?? 0) > 0,
    hasPortfolio: readiness.hasPortfolio ?? (stats?.portfolio.projectCount ?? 0) > 0,
  };
}

/**
 * Resolves global primary and recommended actions for the current user state.
 *
 * @param input Flow-engine inputs.
 * @returns Deterministic flow recommendations.
 */
export function resolveFlowRecommendations(input: FlowEngineInput): FlowResolution {
  const readiness = resolveFlowReadinessState(input.stats, input.readiness);
  return resolveRecommendationByReadiness(readiness, {
    savedJobs: input.stats?.jobs.saved ?? 0,
    appliedJobs: input.stats?.jobs.applied ?? 0,
    interviewSessions: input.stats?.interviews.totalSessions ?? 0,
  });
}

/**
 * Builds a typed flow resolution payload from a stage and action ordering.
 *
 * @param stage Current flow stage.
 * @param primaryId Primary action identifier.
 * @param secondaryIds Secondary action identifiers in priority order.
 * @returns Flow resolution payload for UI rendering.
 */
function buildFlowResolution(
  stage: FlowStage,
  primaryId: FlowActionId,
  secondaryIds: readonly FlowActionId[],
): FlowResolution {
  const orderedSecondary = dedupeActionIds(secondaryIds).filter(
    (actionId) => actionId !== primaryId,
  );
  const primaryAction = toRecommendation(primaryId, "primary");
  const recommendedActions = orderedSecondary.map((actionId) =>
    toRecommendation(actionId, "secondary"),
  );

  return {
    primaryAction,
    recommendedActions,
    nextStepLabel: primaryAction.labelKey,
    flowStage: stage,
  };
}

/**
 * Branches to a deterministic flow resolution from readiness and dashboard metrics.
 *
 * @param readiness Resolved readiness state.
 * @param metrics Dashboard pipeline counters.
 * @returns Flow resolution payload.
 */
function resolveRecommendationByReadiness(
  readiness: FlowReadinessState,
  metrics: {
    readonly savedJobs: number;
    readonly appliedJobs: number;
    readonly interviewSessions: number;
  },
): FlowResolution {
  const readinessResolution = resolveReadinessStage(readiness);
  if (readinessResolution) {
    return readinessResolution;
  }

  const metricsResolution = resolveMetricStage(metrics);
  if (metricsResolution) {
    return metricsResolution;
  }

  return buildFlowResolution("optimize", "interview", [
    "aiChat",
    "automationRuns",
    "jobs",
    "resume",
  ]);
}

/**
 * Resolves the first actionable stage from readiness flags alone.
 */
function resolveReadinessStage(readiness: FlowReadinessState): FlowResolution | null {
  if (!(readiness.isSetupComplete && readiness.isProfileComplete)) {
    return buildFlowResolution("setup", "setup", ["resume", "jobs", "aiChat"]);
  }

  if (!readiness.hasResume) {
    return buildFlowResolution("resumeAssets", "resume", [
      "coverLetter",
      "portfolio",
      "jobs",
      "automationScraper",
    ]);
  }

  if (!(readiness.hasCoverLetter && readiness.hasPortfolio)) {
    const primaryAssetAction: FlowActionId = !readiness.hasCoverLetter
      ? "coverLetter"
      : "portfolio";
    return buildFlowResolution("portfolioAssets", primaryAssetAction, [
      "resume",
      "coverLetter",
      "portfolio",
      "jobs",
      "automationApply",
    ]);
  }

  return null;
}

/**
 * Resolves the first actionable stage from job/interview metrics.
 */
function resolveMetricStage(metrics: {
  readonly savedJobs: number;
  readonly appliedJobs: number;
  readonly interviewSessions: number;
}): FlowResolution | null {
  if (metrics.savedJobs <= 0 && metrics.appliedJobs <= 0) {
    return buildFlowResolution("jobDiscovery", "jobs", [
      "automationScraper",
      "resume",
      "automationApply",
      "interview",
    ]);
  }

  if (metrics.appliedJobs <= 0) {
    return buildFlowResolution("applicationAutomation", "automationApply", [
      "automationScraper",
      "automationApply",
      "jobs",
      "interview",
      "aiChat",
    ]);
  }

  if (metrics.interviewSessions <= 0) {
    return buildFlowResolution("interviewPractice", "interview", [
      "aiChat",
      "automationRuns",
      "jobs",
      "resume",
    ]);
  }

  return null;
}

/**
 * Converts an action id into a recommendation model.
 *
 * @param actionId Action identifier.
 * @param emphasis UI emphasis weight.
 * @returns Flow recommendation model.
 */
function toRecommendation(
  actionId: FlowActionId,
  emphasis: FlowRecommendation["emphasis"],
): FlowRecommendation {
  return {
    ...FLOW_ACTION_DEFINITIONS[actionId],
    emphasis,
  };
}

/**
 * Removes duplicate action ids while preserving order.
 *
 * @param actionIds Candidate action ids.
 * @returns De-duplicated action list.
 */
function dedupeActionIds(actionIds: readonly FlowActionId[]): FlowActionId[] {
  const unique: FlowActionId[] = [];
  for (const actionId of actionIds) {
    if (unique.includes(actionId)) {
      continue;
    }
    unique.push(actionId);
  }
  return unique;
}
