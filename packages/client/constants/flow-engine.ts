import type { DashboardStats } from "@bao/shared/types/search";
import { FLOW_ACTION_DEFINITIONS } from "./flow-engine-actions";
import {
  FLOW_PROFILE_COMPLETENESS_THRESHOLD,
  type FlowActionId,
  type FlowEngineInput,
  type FlowReadinessState,
  type FlowRecommendation,
  type FlowResolution,
  type FlowStage,
} from "./flow-engine-types";

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
