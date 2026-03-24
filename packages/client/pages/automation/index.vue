<script setup lang="ts">
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
import {
  type DashboardPipelineStepViewModel,
  resolveDashboardPipelineSteps,
} from "~/constants/dashboard";
import { createFlowEngineInput, type FlowActionId } from "~/constants/flow-engine";
import { getErrorMessage } from "~/utils/errors";

const AUTOMATION_HUB_ASYNC_DATA_KEY = "automation-hub-stats";
const AUTOMATION_HUB_CAPABILITIES_ASYNC_DATA_KEY = "automation-hub-capabilities";

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
    .filter(
      (actionId) =>
        actionId === "automationScraper" ||
        actionId === "automationApply" ||
        actionId === "automationRuns",
    );

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
  await Promise.all([refresh(), refreshCapabilityAudit()]);
}

function capabilityStatusClass(value: boolean, issueCount = 0): string {
  if (value) {
    return "badge badge-success badge-soft";
  }
  if (issueCount > 0) {
    return "badge badge-warning badge-soft";
  }
  return "badge badge-error badge-soft";
}

function capabilityStatusLabel(value: boolean, issueCount = 0): string {
  if (value) {
    return t("automation.hub.audit.available");
  }
  if (issueCount > 0) {
    return t("automation.hub.audit.needsConfig");
  }
  return t("automation.hub.audit.unavailable");
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
        class="btn btn-sm btn-ghost"
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
        v-bind="{
          title: t('automation.hub.pipelineTitle'),
          description: t('automation.hub.pipelineDescription'),
          ariaLabel: t('automation.hub.pipelineAria'),
          steps: pipelineSteps,
          nextStepLabel: nextPipelineStepLabel,
        }"
      />

      <section class="card card-border bg-base-100" :aria-label="t('automation.hub.audit.aria')">
        <div class="card-body gap-4">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="card-title">{{ t("automation.hub.audit.title") }}</h2>
              <p class="text-sm text-base-content/70">
                {{ t("automation.hub.audit.description") }}
              </p>
            </div>
            <NuxtLink
              :to="APP_ROUTES.automationScraper"
              class="btn btn-outline btn-sm"
              :aria-label="t('automation.hub.audit.openScraperAria')"
            >
              {{ t("automation.hub.audit.openScraperButton") }}
            </NuxtLink>
          </div>

          <LoadingSkeleton v-if="capabilityAuditStatus === 'pending' || capabilityAuditStatus === 'idle'" variant="stats" :lines="3" />

          <div
            v-else-if="capabilityAuditStatus === 'error'"
            role="alert"
            class="alert alert-warning alert-soft"
          >
            <span>{{ getErrorMessage(capabilityAuditError, t("automation.hub.audit.loadErrorFallback")) }}</span>
          </div>

          <template v-else-if="capabilitySummary">
            <div class="stats stats-vertical lg:stats-horizontal border border-base-300 bg-base-100 shadow-sm">
              <div class="stat">
                <div class="stat-title">{{ t("automation.hub.audit.summary.total") }}</div>
                <div class="stat-value text-primary">{{ capabilitySummary.total }}</div>
                <div class="stat-desc">{{ t("automation.hub.audit.summary.totalDesc") }}</div>
              </div>
              <div class="stat">
                <div class="stat-title">{{ t("automation.hub.audit.summary.configured") }}</div>
                <div class="stat-value text-success">{{ capabilitySummary.configured }}</div>
                <div class="stat-desc">{{ t("automation.hub.audit.summary.configuredDesc") }}</div>
              </div>
              <div class="stat">
                <div class="stat-title">{{ t("automation.hub.audit.summary.live") }}</div>
                <div class="stat-value text-secondary">{{ capabilitySummary.liveUpdatesAvailable }}</div>
                <div class="stat-desc">{{ t("automation.hub.audit.summary.liveDesc") }}</div>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table
                class="table table-zebra table-sm md:table-md"
                :aria-label="t('automation.hub.audit.tableAria')"
              >
                <thead>
                  <tr>
                    <th>{{ t("automation.hub.audit.columns.name") }}</th>
                    <th>{{ t("automation.hub.audit.columns.category") }}</th>
                    <th>{{ t("automation.hub.audit.columns.configured") }}</th>
                    <th>{{ t("automation.hub.audit.columns.manual") }}</th>
                    <th>{{ t("automation.hub.audit.columns.scheduled") }}</th>
                    <th>{{ t("automation.hub.audit.columns.history") }}</th>
                    <th>{{ t("automation.hub.audit.columns.live") }}</th>
                    <th>{{ t("automation.hub.audit.columns.notes") }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="capability in capabilityEntries"
                    :key="capability.id"
                    class="align-top"
                  >
                    <td class="min-w-40 whitespace-normal font-medium">
                      {{ capability.name }}
                    </td>
                    <td class="min-w-32">
                      <span
                        class="badge badge-outline h-auto whitespace-normal px-3 py-2 text-center leading-tight"
                      >
                        {{ t(`automation.hub.audit.category.${capability.category}`) }}
                      </span>
                    </td>
                    <td>
                      <span
                        :class="[
                          capabilityStatusClass(capability.configured, capability.issues.length),
                          'whitespace-nowrap',
                        ]"
                      >
                        {{ capabilityStatusLabel(capability.configured, capability.issues.length) }}
                      </span>
                    </td>
                    <td>
                      <span
                        :class="[
                          capabilityStatusClass(capability.manualRunAvailable),
                          'whitespace-nowrap',
                        ]"
                      >
                        {{ capabilityStatusLabel(capability.manualRunAvailable) }}
                      </span>
                    </td>
                    <td>
                      <span
                        :class="[
                          capabilityStatusClass(capability.scheduledRunAvailable),
                          'whitespace-nowrap',
                        ]"
                      >
                        {{ capabilityStatusLabel(capability.scheduledRunAvailable) }}
                      </span>
                    </td>
                    <td>
                      <span
                        :class="[
                          capabilityStatusClass(capability.runHistoryAvailable),
                          'whitespace-nowrap',
                        ]"
                      >
                        {{ capabilityStatusLabel(capability.runHistoryAvailable) }}
                      </span>
                    </td>
                    <td>
                      <span
                        :class="[
                          capabilityStatusClass(capability.liveUpdatesAvailable),
                          'whitespace-nowrap',
                        ]"
                      >
                        {{ capabilityStatusLabel(capability.liveUpdatesAvailable) }}
                      </span>
                    </td>
                    <td class="max-w-xs whitespace-normal break-words text-sm text-base-content/70">
                      {{ capability.issues[0] || t("automation.hub.audit.noIssues") }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </section>

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
                class="btn btn-outline"
                :class="{ 'btn-primary': primaryCardId === card.id }"
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
