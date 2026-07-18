import type { DashboardStats } from "@bao/shared/types/search";

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
