import { APP_ROUTES } from "@bao/shared/constants/routes";
import type {
  DashboardPipelineSnapshot,
  DashboardPipelineStep,
  DashboardPipelineStepViewModel,
  DashboardQuickAction,
} from "./dashboard-contracts";

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
  return DASHBOARD_PIPELINE_STEPS.map((step) => ({
    ...step,
    status: resolvePipelineStepStatus(step.id, firstIncompleteStep, completion),
  }));
}

function resolvePipelineStepStatus(
  stepId: DashboardPipelineStep["id"],
  firstIncompleteStep: DashboardPipelineStep["id"] | null,
  completion: Record<DashboardPipelineStep["id"], boolean>,
): DashboardPipelineStepViewModel["status"] {
  if (completion[stepId]) {
    return "complete";
  }
  return stepId === firstIncompleteStep ? "inProgress" : "pending";
}

type DashboardFlowActionId = DashboardPipelineStep["id"] | "interview" | "aiChat";

const DASHBOARD_FLOW_ACTIONS = {
  search: {
    id: "search",
    labelKey: "dashboard.pipeline.steps.search",
    to: APP_ROUTES.jobs,
    iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  scrape: {
    id: "scrape",
    labelKey: "dashboard.pipeline.steps.scrape",
    to: APP_ROUTES.automationScraper,
    iconPath: "M4 4h16v4H4V4zm0 6h16v10H4V10zm3 3h3v3H7v-3zm5 0h5v1h-5v-1zm0 2h5v1h-5v-1z",
  },
  customize: {
    id: "customize",
    labelKey: "dashboard.pipeline.steps.customize",
    to: APP_ROUTES.resume,
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  apply: {
    id: "apply",
    labelKey: "dashboard.pipeline.steps.apply",
    to: APP_ROUTES.automationJobApply,
    iconPath: "M12 19l9-7-9-7v4.5C7 9.5 4 11.5 3 16c2-2 4.5-3 9-3V19z",
  },
  gamify: {
    id: "gamify",
    labelKey: "dashboard.pipeline.steps.gamify",
    to: APP_ROUTES.gamification,
    iconPath:
      "M12 17l-5.878 3.09 1.122-6.545L2.488 8.91l6.573-.955L12 2l2.939 5.955 6.573.955-4.756 4.635 1.122 6.545z",
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
} as const satisfies Record<DashboardFlowActionId, DashboardQuickAction>;

const DASHBOARD_FLOW_ACTION_FALLBACK_ORDER: readonly DashboardFlowActionId[] = [
  "search",
  "scrape",
  "customize",
  "apply",
  "gamify",
  "interview",
  "aiChat",
] as const;

/**
 * Resolves prioritized dashboard actions from the current end-to-end pipeline state.
 */
export function resolveDashboardFlowActions(
  pipelineSteps: readonly DashboardPipelineStepViewModel[],
): readonly DashboardQuickAction[] {
  const hasIncompleteStep = pipelineSteps.some((step) => step.status !== "complete");
  const actionPriorityQueue: DashboardFlowActionId[] = hasIncompleteStep
    ? [
        ...pipelineSteps.filter((step) => step.status !== "complete").map((step) => step.id),
        ...pipelineSteps.map((step) => step.id),
        ...DASHBOARD_FLOW_ACTION_FALLBACK_ORDER,
      ]
    : ["interview", "aiChat", ...DASHBOARD_FLOW_ACTION_FALLBACK_ORDER];
  return [...new Set(actionPriorityQueue)]
    .slice(0, 4)
    .map((actionId) => DASHBOARD_FLOW_ACTIONS[actionId]);
}

/**
 * Quick actions rendered in the dashboard footer section.
 */
export const DASHBOARD_QUICK_ACTIONS: readonly DashboardQuickAction[] = [
  DASHBOARD_FLOW_ACTIONS.search,
  DASHBOARD_FLOW_ACTIONS.customize,
  DASHBOARD_FLOW_ACTIONS.apply,
  DASHBOARD_FLOW_ACTIONS.aiChat,
] as const;

/**
 * Quick actions rendered in the floating action button speed dial.
 */
export const FAB_QUICK_ACTIONS: readonly DashboardQuickAction[] = [
  DASHBOARD_FLOW_ACTIONS.customize,
  DASHBOARD_FLOW_ACTIONS.aiChat,
  DASHBOARD_FLOW_ACTIONS.search,
] as const;

/**
 * Maps activity categories to emoji glyphs for quick scanning.
 */
export function getDashboardActivityEmoji(activityType: string): string {
  return DASHBOARD_ACTIVITY_EMOJIS.find(([pattern]) => activityType.includes(pattern))?.[1] ?? "⚡";
}

const DASHBOARD_ACTIVITY_EMOJIS = [
  ["job", "📝"],
  ["resume", "📄"],
  ["interview", "🎤"],
  ["portfolio", "🧩"],
] as const;
