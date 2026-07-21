<script setup lang="ts">
defineOptions({ name: "PagesIndexPage" });

import { STACK_SPACE_Y_TOKEN_CLASS } from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

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
  xpIntoLevel,
  xpTarget,
  pipelineSteps,
  nextPipelineStepLabel,
  primaryFlowRoute,
  primaryFlowLabel,
  dashboardQuickActions,
  statCards,
  retryDashboardLoad,
  formatTimeAgo,
  claimingChallengeId,
  claimDailyChallenge,
} = useDashboardPage();

const { t } = useI18n();

useSeoMeta({
  title: t(DASHBOARD_COPY_KEYS.pageTitle),
  description: t(DASHBOARD_COPY_KEYS.seoDescription),
});
</script>

<template>
  <PageScaffold tag="section" labelled-by="dashboard-title">
    <PageHeroHeader
      title-id="dashboard-title"
      :title="t(DASHBOARD_COPY_KEYS.pageTitle)"
      :description="t(DASHBOARD_COPY_KEYS.metricsSummaryLabel, { brand: resolvedBrand.name })"
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

    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <DashboardWelcomeBanner
        :welcome-heading="welcomeHeading"
        :active-hero-phrase="activeHeroPhrase"
        :primary-route="primaryFlowRoute"
        :primary-label="primaryFlowLabel"
        :show-setup-action="!dashboard?.profile?.name"
      />

      <!-- XP celebration after profile identity exists — avoids Setup CTA vs Level 10 contradiction. -->
      <DashboardGamificationCard
        v-if="dashboard?.gamification && dashboard.profile?.name"
        :gamification="dashboard.gamification"
        :level-progress="levelProgress"
        :xp-into-level="xpIntoLevel"
        :xp-target="xpTarget"
      />

      <DashboardStatCardsGrid :stat-cards="statCards" />

      <DashboardChallengeActivityGrid
        :daily-challenge="dashboard?.dailyChallenge ?? null"
        :recent-activity="dashboard?.recentActivity ?? []"
        :claiming-challenge-id="claimingChallengeId"
        :format-time-ago="formatTimeAgo"
        @claim="claimDailyChallenge"
      />

      <DashboardQuickActionsCard :actions="dashboardQuickActions" />

      <WorkPipeline
        :title="t(DASHBOARD_COPY_KEYS.pipelineTitle)"
        :description="t(DASHBOARD_COPY_KEYS.pipelineDescription)"
        :aria-label="t(DASHBOARD_COPY_KEYS.pipelineAria)"
        :steps="pipelineSteps"
        :next-step-label="nextPipelineStepLabel"
      />
    </div>
  </PageScaffold>
</template>
