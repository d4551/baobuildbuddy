<script setup lang="ts">
import type { DashboardStats } from "@bao/shared";
import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import {
  type DashboardPipelineStepViewModel,
  resolveDashboardPipelineSteps,
} from "~/constants/dashboard";
import {
  createFlowEngineInput,
  type FlowActionId,
} from "~/constants/flow-engine";
import { getErrorMessage } from "~/utils/errors";

const AUTOMATION_HUB_ASYNC_DATA_KEY = "automation-hub-stats";

type AutomationHubUiState = "idle" | "loading" | "error" | "success";

type AutomationHubCardId = "scraper" | "jobApply" | "emailResponse" | "runHistory";

interface AutomationHubCard {
  readonly id: AutomationHubCardId;
  readonly flowActionId: FlowActionId | null;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly buttonKey: string;
  readonly to: string;
}

const api = useApi();
const { t } = useI18n();

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

const baseAutomationCards: readonly AutomationHubCard[] = [
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

const prioritizedCardIds = computed<readonly AutomationHubCardId[]>(() => {
  const actionPriority = [flowPrimaryAction.value, ...flowRecommendedActions.value]
    .map((action) => action.id)
    .filter((actionId) => actionId === "automationScraper" || actionId === "automationApply" || actionId === "automationRuns");

  const orderedCardIds: AutomationHubCardId[] = [];
  for (const actionId of actionPriority) {
    const cardId =
      actionId === "automationScraper"
        ? "scraper"
        : actionId === "automationApply"
          ? "jobApply"
          : "runHistory";
    if (orderedCardIds.includes(cardId)) {
      continue;
    }
    orderedCardIds.push(cardId);
  }

  return orderedCardIds;
});

const orderedCards = computed(() => {
  const remainingCards = [...baseAutomationCards];
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

async function retryLoad(): Promise<void> {
  await refresh();
}
</script>

<template>
  <PageScaffold tag="section" labelled-by="automation-hub-title">
    <PageHeaderBlock title-id="automation-hub-title" :title="t('automation.hub.title')">
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.automationRuns"
          class="btn btn-outline"
          :aria-label="t('automation.hub.viewRunsButton')"
        >
          {{ t("automation.hub.viewRunsButton") }}
        </NuxtLink>
      </template>
    </PageHeaderBlock>

    <LoadingSkeleton v-if="uiState === 'loading' || uiState === 'idle'" variant="stats" :lines="4" />

    <div v-else-if="uiState === 'error'" class="alert alert-error" role="alert">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ getErrorMessage(error, t("automation.hub.loadErrorFallback")) }}</span>
      <button
        type="button"
        class="btn btn-sm"
        :aria-label="t('automation.hub.retryAria')"
        @click="retryLoad"
      >
        {{ t("automation.hub.retryButtonLabel") }}
      </button>
    </div>

    <template v-else>
      <div class="stats stats-vertical md:stats-horizontal w-full bg-base-100 shadow">
        <div class="stat">
          <div class="stat-title">{{ t("automation.hub.stats.totalRunsTitle") }}</div>
          <div class="stat-value">{{ totalRuns }}</div>
          <div class="stat-desc">{{ t("automation.hub.stats.totalRunsDescription") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.hub.stats.todayRunsTitle") }}</div>
          <div class="stat-value">{{ todayRuns }}</div>
          <div class="stat-desc">{{ t("automation.hub.stats.todayRunsDescription") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("automation.hub.stats.successRateTitle") }}</div>
          <div class="stat-value">{{ successRate }}%</div>
          <div class="stat-desc">{{ t("automation.hub.stats.successRateDescription") }}</div>
        </div>
      </div>

      <WorkPipeline
        :title="t('automation.hub.pipelineTitle')"
        :description="t('automation.hub.pipelineDescription')"
        :aria-label="t('automation.hub.pipelineAria')"
        :steps="pipelineSteps"
        :next-step-label="nextPipelineStepLabel"
      />

      <SectionGrid grid-token="twoToFour">
        <div
          v-for="card in orderedCards"
          :key="card.id"
          class="card card-border bg-base-100 transition-colors hover:bg-base-200"
          :class="primaryCardId === card.id ? 'ring-2 ring-primary/40' : ''"
        >
          <div class="card-body">
            <div class="flex items-center justify-between gap-2">
              <h2 class="card-title">{{ t(card.titleKey) }}</h2>
              <span v-if="primaryCardId === card.id" class="badge badge-primary badge-outline">
                {{ t("automation.hub.pipelineTitle") }}
              </span>
            </div>
            <p class="text-sm">{{ t(card.descriptionKey) }}</p>
            <div class="card-actions justify-end mt-4">
              <NuxtLink
                :to="card.to"
                class="btn"
                :class="primaryCardId === card.id ? 'btn-primary' : 'btn-outline'"
                :aria-label="t(card.buttonKey)"
              >
                {{ t(card.buttonKey) }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </SectionGrid>
    </template>
  </PageScaffold>
</template>
