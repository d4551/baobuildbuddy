<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { DASHBOARD_COPY_KEYS } from "~/constants/dashboard-copy";

const {
  resolvedBrand,
  dashboard,
  error,
  uiState,
  welcomeHeading,
  activeHeroPhrase,
  levelProgress,
  xpTarget,
  pipelineSteps,
  nextPipelineStepLabel,
  primaryFlowRoute,
  primaryFlowLabel,
  dashboardQuickActions,
  statCards,
  retryDashboardLoad,
  formatTimeAgo,
} = await useDashboardPage();

const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t(DASHBOARD_COPY_KEYS.pageTitle),
    description: t(DASHBOARD_COPY_KEYS.seoDescription),
  });
}
</script>

<template>
  <PageScaffold tag="section" labelled-by="dashboard-title">
    <PageHeaderBlock
      title-id="dashboard-title"
      :title="t(DASHBOARD_COPY_KEYS.pageTitle)"
      :description="t(DASHBOARD_COPY_KEYS.metricsSummaryLabel, { brand: resolvedBrand.name })"
      description-class="text-sm text-base-content/60"
    />

    <LoadingSkeleton
      v-if="uiState === 'loading' || uiState === 'idle'"
      variant="stats"
      :lines="6"
    />

    <BootstrapErrorAlert
      v-else-if="uiState === 'error'"
      :title="t(DASHBOARD_COPY_KEYS.pageTitle)"
      :message="getErrorMessage(error, t(DASHBOARD_COPY_KEYS.loadErrorFallback))"
      :retry-label="t(DASHBOARD_COPY_KEYS.retryButtonLabel)"
      :retry-aria-label="t(DASHBOARD_COPY_KEYS.retryAria)"
      @retry="retryDashboardLoad"
    />

    <DashboardOnboardingCard
      v-else-if="uiState === 'empty'"
      :primary-route="primaryFlowRoute"
      :primary-label="primaryFlowLabel"
    />

    <div v-else class="space-y-6">
      <DashboardWelcomeBanner
        :welcome-heading="welcomeHeading"
        :active-hero-phrase="activeHeroPhrase"
        :primary-route="primaryFlowRoute"
        :primary-label="primaryFlowLabel"
        :show-setup-action="!dashboard?.profile?.name"
      />

      <DashboardGamificationCard
        v-if="dashboard?.gamification"
        :gamification="dashboard.gamification"
        :level-progress="levelProgress"
        :xp-target="xpTarget"
      />

      <DashboardStatCardsGrid :stat-cards="statCards" />

      <DashboardChallengeActivityGrid
        :daily-challenge="dashboard?.dailyChallenge ?? null"
        :recent-activity="dashboard?.recentActivity ?? []"
        :format-time-ago="formatTimeAgo"
      />

      <DashboardQuickActionsCard :actions="dashboardQuickActions" />

      <WorkPipeline
        v-bind="{
          title: t(DASHBOARD_COPY_KEYS.pipelineTitle),
          description: t(DASHBOARD_COPY_KEYS.pipelineDescription),
          ariaLabel: t(DASHBOARD_COPY_KEYS.pipelineAria),
          steps: pipelineSteps,
          nextStepLabel: nextPipelineStepLabel,
        }"
      />
    </div>
  </PageScaffold>
</template>
