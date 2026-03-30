import type {
  DashboardStats,
  RpaCapabilityAuditEntry,
  RpaCapabilityAuditReport,
} from "@bao/shared";
import { APP_ROUTES } from "@bao/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useAsyncData, useServerSeoMeta } from "#imports";
import { useAutomation } from "~/composables/useAutomation";
import { useFlowEngine } from "~/composables/useFlowEngine";
import type { DashboardPipelineStepViewModel } from "~/constants/dashboard-contracts";
import { resolveDashboardPipelineSteps } from "~/constants/dashboard-pipeline";
import { createFlowEngineInput, type FlowActionId } from "~/constants/flow-engine";
import { getErrorMessage } from "~/utils/errors";

const AUTOMATION_HUB_ASYNC_DATA_KEY = "automation-hub-stats";
const AUTOMATION_HUB_CAPABILITIES_ASYNC_DATA_KEY = "automation-hub-capabilities";

type AutomationHubUiState = "idle" | "loading" | "error" | "success";
type AutomationHubCardId = "scraper" | "jobApply" | "emailResponse" | "runHistory";

export interface AutomationHubCard {
  readonly id: AutomationHubCardId;
  readonly flowActionId: FlowActionId | null;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly buttonKey: string;
  readonly to: string;
}

const BASE_AUTOMATION_CARDS: readonly AutomationHubCard[] = [
  {
    id: "scraper",
    flowActionId: "automationScraper",
    titleKey: "automation.hub.cards.scraper.title",
    descriptionKey: "automation.hub.cards.scraper.description",
    buttonKey: "automation.hub.cards.scraper.button",
    to: APP_ROUTES.automationScraper,
  },
  {
    id: "jobApply",
    flowActionId: "automationApply",
    titleKey: "automation.hub.cards.jobApply.title",
    descriptionKey: "automation.hub.cards.jobApply.description",
    buttonKey: "automation.hub.cards.jobApply.button",
    to: APP_ROUTES.automationJobApply,
  },
  {
    id: "emailResponse",
    flowActionId: null,
    titleKey: "automation.hub.cards.emailResponse.title",
    descriptionKey: "automation.hub.cards.emailResponse.description",
    buttonKey: "automation.hub.cards.emailResponse.button",
    to: APP_ROUTES.automationEmail,
  },
  {
    id: "runHistory",
    flowActionId: "automationRuns",
    titleKey: "automation.hub.cards.runHistory.title",
    descriptionKey: "automation.hub.cards.runHistory.description",
    buttonKey: "automation.hub.cards.runHistory.button",
    to: APP_ROUTES.automationRuns,
  },
] as const;

const resolveOrderedCardIds = (actionIds: readonly FlowActionId[]): AutomationHubCardId[] => {
  const orderedCardIds: AutomationHubCardId[] = [];
  for (const actionId of actionIds) {
    const cardId =
      actionId === "automationScraper"
        ? "scraper"
        : actionId === "automationApply"
          ? "jobApply"
          : actionId === "automationRuns"
            ? "runHistory"
            : null;
    if (!cardId || orderedCardIds.includes(cardId)) {
      continue;
    }
    orderedCardIds.push(cardId);
  }

  return orderedCardIds;
};

export async function useAutomationHubPage() {
  const api = useApi();
  const { t } = useI18n();
  const { getRpaCapabilities } = useAutomation();

  if (import.meta.server) {
    useServerSeoMeta({
      title: t("automation.hub.pageTitle"),
      description: t("automation.hub.pageDescription"),
    });
  }

  const { data, status, error, refresh } = await useAsyncData<DashboardStats>(
    AUTOMATION_HUB_ASYNC_DATA_KEY,
    async () => {
      const response = await api.stats.dashboard.get();
      if (response.error) {
        throw new Error(getErrorMessage(response.error, t("automation.hub.loadErrorFallback")));
      }
      return response.data;
    },
    {
      lazy: false,
      server: true,
    },
  );

  const {
    data: capabilityAuditData,
    status: capabilityAuditStatus,
    error: capabilityAuditError,
    refresh: refreshCapabilityAudit,
  } = await useAsyncData<RpaCapabilityAuditReport>(
    AUTOMATION_HUB_CAPABILITIES_ASYNC_DATA_KEY,
    () => getRpaCapabilities(),
    {
      lazy: false,
      server: true,
    },
  );

  const stats = computed(() => data.value ?? null);
  const uiState = computed<AutomationHubUiState>(() => {
    if (status.value === "pending") return "loading";
    if (status.value === "error") return "error";
    if (status.value === "idle") return "idle";
    return "success";
  });
  const totalRuns = computed(() => stats.value?.automation.totalRuns ?? 0);
  const todayRuns = computed(() => stats.value?.automation.todayRuns ?? 0);
  const successRate = computed(() => stats.value?.automation.successRate ?? 0);
  const capabilityAudit = computed(() => capabilityAuditData.value ?? null);
  const capabilitySummary = computed(() => capabilityAudit.value?.summary ?? null);
  const capabilityEntries = computed<readonly RpaCapabilityAuditEntry[]>(
    () => capabilityAudit.value?.capabilities ?? [],
  );

  const pipelineSteps = computed<readonly DashboardPipelineStepViewModel[]>(() => {
    const resolvedStats = stats.value;
    if (!resolvedStats) {
      return resolveDashboardPipelineSteps({
        savedJobs: 0,
        appliedJobs: 0,
        resumeCount: 0,
        coverLetterCount: 0,
        automationRuns: 0,
        successfulAutomationRuns: 0,
        mappedSkillsCount: 0,
        gamificationXp: 0,
      });
    }

    return resolveDashboardPipelineSteps({
      savedJobs: resolvedStats.jobs.saved,
      appliedJobs: resolvedStats.jobs.applied,
      resumeCount: resolvedStats.resumes.count,
      coverLetterCount: resolvedStats.coverLetters.count,
      automationRuns: resolvedStats.automation.totalRuns,
      successfulAutomationRuns: resolvedStats.automation.successfulRuns,
      mappedSkillsCount: resolvedStats.skills.mappedCount,
      gamificationXp: resolvedStats.gamification.xp,
    });
  });

  const flowInput = computed(() => createFlowEngineInput(stats.value));
  const {
    primaryAction: flowPrimaryAction,
    recommendedActions: flowRecommendedActions,
    nextStepLabel: flowNextStepLabel,
  } = useFlowEngine(flowInput);
  const nextPipelineStepLabel = computed(() => t(flowNextStepLabel.value));

  const prioritizedCardIds = computed<readonly AutomationHubCardId[]>(() => {
    const actionPriority = [flowPrimaryAction.value, ...flowRecommendedActions.value]
      .map((action) => action.id)
      .filter(
        (actionId): actionId is FlowActionId =>
          actionId === "automationScraper" ||
          actionId === "automationApply" ||
          actionId === "automationRuns",
      );

    return resolveOrderedCardIds(actionPriority);
  });

  const orderedCards = computed(() => {
    const remainingCards = [...BASE_AUTOMATION_CARDS];
    const prioritizedCards: AutomationHubCard[] = [];

    for (const cardId of prioritizedCardIds.value) {
      const index = remainingCards.findIndex((card) => card.id === cardId);
      if (index === -1) {
        continue;
      }
      const [card] = remainingCards.splice(index, 1);
      if (card) {
        prioritizedCards.push(card);
      }
    }

    return [...prioritizedCards, ...remainingCards];
  });

  const primaryCardId = computed<AutomationHubCardId | null>(() => {
    const primaryAction = flowPrimaryAction.value.id;
    if (primaryAction === "automationScraper") return "scraper";
    if (primaryAction === "automationApply") return "jobApply";
    if (primaryAction === "automationRuns") return "runHistory";
    return null;
  });

  const retryLoad = async (): Promise<void> => {
    await Promise.all([refresh(), refreshCapabilityAudit()]);
  };

  const capabilityStatusClass = (value: boolean, issueCount = 0): string => {
    if (value) {
      return "badge badge-success badge-soft";
    }
    if (issueCount > 0) {
      return "badge badge-warning badge-soft";
    }
    return "badge badge-error badge-soft";
  };

  const capabilityStatusLabel = (value: boolean, issueCount = 0): string => {
    if (value) {
      return t("automation.hub.audit.available");
    }
    if (issueCount > 0) {
      return t("automation.hub.audit.needsConfig");
    }
    return t("automation.hub.audit.unavailable");
  };

  return {
    t,
    error,
    uiState,
    totalRuns,
    todayRuns,
    successRate,
    pipelineSteps,
    nextPipelineStepLabel,
    capabilityAuditStatus,
    capabilityAuditError,
    capabilitySummary,
    capabilityEntries,
    orderedCards,
    primaryCardId,
    retryLoad,
    refreshCapabilityAudit,
    capabilityStatusClass,
    capabilityStatusLabel,
  };
}
