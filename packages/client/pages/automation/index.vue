<script setup lang="ts">
import type { DashboardStats } from "@bao/shared";
import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import {
  DASHBOARD_PIPELINE_STATUS_KEYS,
  resolveDashboardPipelineSteps,
  type DashboardPipelineStepViewModel,
} from "~/constants/dashboard";
import { getErrorMessage } from "~/utils/errors";

const AUTOMATION_HUB_ASYNC_DATA_KEY = "automation-hub-stats";

type AutomationHubUiState = "idle" | "loading" | "error" | "success";

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
      throw new Error(response.error.value?.message ?? t("automation.hub.loadErrorFallback"));
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

const nextPipelineStepLabel = computed(() => {
  const nextStep = pipelineSteps.value.find((step) => step.status !== "complete");
  if (!nextStep) {
    return t(DASHBOARD_PIPELINE_STATUS_KEYS.complete);
  }

  return t("automation.hub.pipelineNextStepLabel", { step: t(nextStep.labelKey) });
});

async function retryLoad(): Promise<void> {
  await refresh();
}
</script>

<template>
  <section class="space-y-6" aria-labelledby="automation-hub-title">
    <header class="flex items-center justify-between gap-3">
      <h1 id="automation-hub-title" class="text-3xl font-bold">{{ t("automation.hub.title") }}</h1>
      <NuxtLink :to="APP_ROUTES.automationRuns" class="btn btn-outline">
        {{ t("automation.hub.viewRunsButton") }}
      </NuxtLink>
    </header>

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
      <button type="button" class="btn btn-sm" @click="retryLoad">
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

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="card card-border bg-base-100 hover:bg-base-200 transition-colors">
          <div class="card-body">
            <h2 class="card-title">{{ t("automation.hub.cards.scraper.title") }}</h2>
            <p class="text-sm">{{ t("automation.hub.cards.scraper.description") }}</p>
            <div class="card-actions justify-end mt-4">
              <NuxtLink :to="APP_ROUTES.automationScraper" class="btn btn-primary">
                {{ t("automation.hub.cards.scraper.button") }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="card card-border bg-base-100 hover:bg-base-200 transition-colors">
          <div class="card-body">
            <h2 class="card-title">{{ t("automation.hub.cards.jobApply.title") }}</h2>
            <p class="text-sm">{{ t("automation.hub.cards.jobApply.description") }}</p>
            <div class="card-actions justify-end mt-4">
              <NuxtLink :to="APP_ROUTES.automationJobApply" class="btn btn-primary">
                {{ t("automation.hub.cards.jobApply.button") }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="card card-border bg-base-100 hover:bg-base-200 transition-colors">
          <div class="card-body">
            <h2 class="card-title">{{ t("automation.hub.cards.emailResponse.title") }}</h2>
            <p class="text-sm">{{ t("automation.hub.cards.emailResponse.description") }}</p>
            <div class="card-actions justify-end mt-4">
              <NuxtLink :to="APP_ROUTES.automationEmail" class="btn btn-primary">
                {{ t("automation.hub.cards.emailResponse.button") }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="card card-border bg-base-100 hover:bg-base-200 transition-colors">
          <div class="card-body">
            <h2 class="card-title">{{ t("automation.hub.cards.runHistory.title") }}</h2>
            <p class="text-sm">{{ t("automation.hub.cards.runHistory.description") }}</p>
            <div class="card-actions justify-end mt-4">
              <NuxtLink :to="APP_ROUTES.automationRuns" class="btn btn-primary">
                {{ t("automation.hub.cards.runHistory.button") }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
