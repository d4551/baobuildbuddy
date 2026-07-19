import type { DashboardStats } from "@bao/shared/types/search";
import type { Ref } from "vue";
import { computed } from "vue";
import {
  type AutomationHubCard,
  type AutomationHubCardId,
  type AutomationHubTranslate,
  BASE_AUTOMATION_CARDS,
  resolveOrderedCardIds,
} from "~/composables/automation-hub-page-contracts";
import { useFlowEngine } from "~/composables/useFlowEngine";
import type { DashboardPipelineStepViewModel } from "~/constants/dashboard-contracts";
import { resolveDashboardPipelineSteps } from "~/constants/dashboard-pipeline";
import { createFlowEngineInput } from "~/constants/flow-engine";
import type { FlowActionId } from "~/constants/flow-engine-types";

const createAutomationPipelineSteps = (stats: Readonly<Ref<DashboardStats | null>>) =>
  computed<readonly DashboardPipelineStepViewModel[]>(() => {
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

const createAutomationCardPresentation = (
  primaryAction: Readonly<Ref<{ id: string }>>,
  recommendedActions: Readonly<Ref<readonly { id: string }[]>>,
) => {
  const prioritizedCardIds = computed<readonly AutomationHubCardId[]>(() => {
    const actionPriority = [primaryAction.value, ...recommendedActions.value]
      .map((action) => action.id)
      .filter(
        (actionId): actionId is FlowActionId =>
          actionId === "automationScraper" ||
          actionId === "automationApply" ||
          actionId === "automationRuns",
      );

    return resolveOrderedCardIds(actionPriority);
  });

  const orderedCards = computed<readonly AutomationHubCard[]>(() => {
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
    const currentPrimaryAction = primaryAction.value.id;
    if (currentPrimaryAction === "automationScraper") return "scraper";
    if (currentPrimaryAction === "automationApply") return "jobApply";
    if (currentPrimaryAction === "automationRuns") return "runHistory";
    return null;
  });

  const primaryCard = computed<AutomationHubCard | null>(() => {
    const currentPrimaryCardId = primaryCardId.value;
    if (!currentPrimaryCardId) {
      return orderedCards.value[0] ?? null;
    }

    return orderedCards.value.find((card) => card.id === currentPrimaryCardId) ?? null;
  });

  return {
    orderedCards,
    primaryCardId,
    primaryCard,
  };
};

const createAutomationCapabilityStatusPresentation = (t: AutomationHubTranslate) => ({
  capabilityStatusClass(value: boolean, issueCount = 0): string {
    if (value) {
      return "badge badge-success badge-soft";
    }
    if (issueCount > 0) {
      return "badge badge-warning badge-soft";
    }
    return "badge badge-error badge-soft";
  },
  capabilityStatusLabel(value: boolean, issueCount = 0): string {
    if (value) {
      return t("automation.hub.audit.available");
    }
    if (issueCount > 0) {
      return t("automation.hub.audit.needsConfig");
    }
    return t("automation.hub.audit.unavailable");
  },
});

export const createAutomationHubPagePresentation = (options: {
  readonly stats: Readonly<Ref<DashboardStats | null>>;
  readonly t: AutomationHubTranslate;
}) => {
  const pipelineSteps = createAutomationPipelineSteps(options.stats);
  const flowInput = computed(() => createFlowEngineInput(options.stats.value));
  const { primaryAction, recommendedActions, nextStepLabel } = useFlowEngine(flowInput);
  const nextPipelineStepLabel = computed(() => options.t(nextStepLabel.value));

  return {
    pipelineSteps,
    nextPipelineStepLabel,
    ...createAutomationCardPresentation(primaryAction, recommendedActions),
    ...createAutomationCapabilityStatusPresentation(options.t),
  };
};
