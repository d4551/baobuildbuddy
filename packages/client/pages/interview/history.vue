<script setup lang="ts">
const {
  t,
  sessions,
  loading,
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
} = useInterviewHistoryPage();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("interviewHistory.title"),
    description: t("interviewHub.seoDescription"),
  });
}
</script>

<template>
  <PageScaffold tag="section" labelled-by="interview-history-title">
    <PageHeroHeader
      title-id="interview-history-title"
      :title="t('interviewHistory.title')"
      :description="t('interviewHistory.subtitle')"
    />

    <LoadingSkeleton v-if="loading && !sessions.length" :lines="8" />

    <div v-else class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-6">
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
    </div>
  </PageScaffold>
</template>
