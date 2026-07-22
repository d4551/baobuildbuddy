<script setup lang="ts">
import {
  LOADING_SKELETON_LINES,
} from "~/constants/numeric-ui";

defineOptions({ name: "PagesInterviewHistoryPage" });

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { STACK_SPACE_Y_TOKEN_CLASS } from "~/constants/layout";

definePageMeta({
  path: APP_ROUTES.interviewHistory,
  middleware: ["auth"],
});

const {
  t,
  sessions,
  sessionsError,
  filteredSessions,
  studios,
  historyView,
  studioFilter,
  selectedSession,
  detailLoading,
  detailError,
  viewSessionDetail,
  closeDetail,
  retryDetail,
  formatDate,
  formatDuration,
  formatScore,
  questionScoreText,
  scoreBadgeClass,
  getScoreColorClass,
  getTimelineLineClass,
  loadSessions,
} = useInterviewHistoryPage();
const { pending: bootstrapPending, refresh: refreshSessions } = await useAsyncData(
  "interview-history-bootstrap",
  async () => {
    await loadSessions();
    return true;
  },
);

useSeoMeta({
  title: t("interviewHistory.title"),
  description: t("interviewHub.seoDescription"),
});
</script>

<template>
  <PageScaffold tag="section" labelled-by="interview-history-title">
    <PageHeroHeader
      title-id="interview-history-title"
      :title="t('interviewHistory.title')"
      :description="t('interviewHistory.subtitle')"
    />

    <LoadingSkeleton v-if="bootstrapPending && sessions.length === 0" :lines="LOADING_SKELETON_LINES.form" />

    <BootstrapErrorAlert
      v-else-if="sessionsError"
      :title="t('interviewHistory.fetchErrorTitle')"
      :message="sessionsError"
      :retry-label="t('interviewHistory.retryButtonLabel')"
      :retry-aria-label="t('interviewHistory.retryAria')"
      @retry="refreshSessions"
    />

    <EmptyState
      v-else-if="sessions.length === 0"
      title-key="interviewHistory.emptyStateTitle"
      description-key="interviewHistory.emptyStateDescription"
      cta-label-key="interviewHistory.emptyStateCta"
      cta-aria-key="interviewHistory.emptyStateCtaAria"
      :cta-to="APP_ROUTES.interview"
    />

    <SectionGrid v-else grid-token="threeColumnLg">
      <div class="lg:col-span-2" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
        <InterviewHistorySessionsCard
          :filtered-sessions="filteredSessions"
          :studios="studios"
          :history-view="historyView"
          :studio-filter="studioFilter"
          :format-date="formatDate"
          :format-duration="formatDuration"
          :format-score="formatScore"
          :score-badge-class="scoreBadgeClass"
          :get-score-color-class="getScoreColorClass"
          :get-timeline-line-class="getTimelineLineClass"
          @update:history-view="historyView = $event"
          @update:studio-filter="studioFilter = $event"
          @view="viewSessionDetail"
        />
      </div>

      <div class="lg:col-span-1">
        <InterviewHistoryDetailCard
          :detail-error="detailError"
          :detail-loading="detailLoading"
          :selected-session="selectedSession"
          :format-score="formatScore"
          :question-score-text="questionScoreText"
          :get-score-color-class="getScoreColorClass"
          @retry="retryDetail"
          @close="closeDetail"
        />
      </div>
    </SectionGrid>
  </PageScaffold>
</template>
