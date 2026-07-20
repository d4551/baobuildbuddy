<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  POINTER_EVENTS_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { VISIBILITY_HIDE_BELOW_SM_CLASS } from "~/constants/ui-layout";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();

useSeoMeta({
  title: t("interviewHub.seoTitle"),
  description: t("interviewHub.seoDescription"),
});

const {
  APP_ROUTES,
  INTERVIEW_CONFIG_DIALOG_DESCRIPTION_ID,
  INTERVIEW_CONFIG_DIALOG_TITLE_ID,
  INTERVIEW_ROLE_SUGGESTIONS_LIST_ID,
  averageScore,
  formatSessionDate,
  getScoreBadgeClass,
  handleStartInterview,
  improvementTrend,
  interviewConfigPageAria,
  interviewExperienceOptions,
  interviewHubError,
  interviewHubPending,
  interviewHubStatus,
  interviewQuestionCountOptions,
  interviewRoleOptions,
  jobSearchTerm,
  jobSelectionPagination,
  jobSelectionPaginationSummary,
  modeLabel,
  openConfig,
  pathwaysRecommendationError,
  prepChecklist,
  prepCompletionPercent,
  prepReadyCount,
  prepStatusBadgeClass,
  questionCountLabel,
  recentSessionPageAria,
  recentSessionPagination,
  recentSessions,
  recentSessionsPaginationSummary,
  refreshInterviewHub,
  retryPathwaysFromWarning,
  searchedJobs,
  selectedJob,
  selectedJobId,
  selectedMode,
  selectedStudioName,
  sessionConfig,
  showConfigModal,
  starting,
  studiosForSelector,
  totalSessions,
  ttsVoices,
  viewSession,
  experienceLabel,
  isStartDisabled,
  selectJobById,
} = useInterviewHubPage();
</script>

<template>
  <PageScaffold labelled-by="interview-hub-title">
    <PageHeroHeader
      title-id="interview-hub-title"
      :title="t('interviewHub.title')"
      :description="t('interviewHub.subtitle')"
      description-class="text-secondary"
      density="comfortable"
    >
      <template #actions>
        <button
          class="btn btn-primary"
          :aria-label="t('interviewHub.hero.openJobAria')"
          @click="openConfig('job')"
        >
          {{ t("interviewHub.hero.openJobButton") }}
        </button>
        <button
          class="btn btn-outline"
          :aria-label="t('interviewHub.hero.openStudioAria')"
          @click="openConfig('studio')"
        >
          {{ t("interviewHub.hero.openStudioButton") }}
        </button>
      </template>
      <template #aside>
        <div :class="[VISIBILITY_HIDE_BELOW_SM_CLASS]">
          <ul class="steps steps-vertical lg:steps-horizontal" :class="[FLUID_WIDTH_CLASS]" :aria-label="t('interviewHub.hero.stepsAria')">
            <li class="step step-primary">{{ t("interviewHub.hero.steps.chooseContext") }}</li>
            <li class="step" :class="showConfigModal ? 'step-primary' : ''">{{ t("interviewHub.hero.steps.configureSession") }}</li>
            <li class="step">{{ t("interviewHub.hero.steps.practiceAndScore") }}</li>
          </ul>
        </div>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="interviewHubPending" :lines="6" />

    <BootstrapErrorAlert
      v-else-if="interviewHubStatus === 'error'"
      :message="getErrorMessage(interviewHubError, t('interviewHub.errors.bootstrapLoadFailed'))"
      :retry-label="t('interviewHub.bootstrapRetry')"
      :retry-aria-label="t('interviewHub.bootstrapRetryAria')"
      @retry="() => refreshInterviewHub()"
    />

    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <BootstrapErrorAlert
        v-if="pathwaysRecommendationError"
        severity="warning"
        :message="pathwaysRecommendationError"
        :retry-label="t('interviewHub.pathwaysRetry')"
        :retry-aria-label="t('interviewHub.pathwaysRetryAria')"
        @retry="retryPathwaysFromWarning"
      />
      <StatsRow
        :stats="[
          { titleKey: 'interviewHub.stats.totalSessionsTitle', value: totalSessions, valueClass: 'text-primary', descKey: 'interviewHub.stats.totalSessionsDesc' },
          { titleKey: 'interviewHub.stats.averageScoreTitle', value: `${averageScore}%`, valueClass: 'text-secondary', descKey: 'interviewHub.stats.averageScoreDesc' },
          { titleKey: 'interviewHub.stats.improvementTitle', value: `${improvementTrend >= 0 ? '+' : ''}${improvementTrend}%`, valueClass: improvementTrend >= 0 ? 'text-success' : 'text-error', descKey: 'interviewHub.stats.improvementDesc' },
        ]"
      />

      <div :class="[SURFACE_GLASS_CARD_CLASS, 'glass-card-enter glass-card-enter-0']">
        <div class="card-body">
          <div class="flex flex-wrap items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <div>
              <h2 class="card-title">{{ t("interviewHub.prep.title") }}</h2>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("interviewHub.prep.subtitle") }}</p>
            </div>
            <span class="badge badge-primary badge-outline">
              {{ t("interviewHub.prep.progressLabel", { done: prepReadyCount, total: prepChecklist.length }) }}
            </span>
          </div>

          <progress
            class="progress progress-primary" :class="[FLUID_WIDTH_CLASS]"
            :value="prepCompletionPercent"
            max="100"
            :aria-label="t('interviewHub.prep.progressAria')"
          ></progress>

          <SectionGrid grid-token="threeColumnWide">
            <UiGlassCard
              v-for="(item, index) in prepChecklist"
              :key="item.id"
              :stagger-index="Math.min(index + 1, 11)"
              variant="subtle"
            >
              <div :class="[PADDING_TOKEN_CLASS.p4, STACK_SPACE_Y_TOKEN_CLASS.stack3]">
                <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
                  <h3 class="font-semibold">{{ item.title }}</h3>
                  <span class="badge badge-sm" :class="prepStatusBadgeClass(item.ready)">
                    {{ item.ready ? t("interviewHub.prep.readyBadge") : t("interviewHub.prep.pendingBadge") }}
                  </span>
                </div>
                <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ item.description }}</p>
                <div class="flex justify-end">
                  <NuxtLink
                    :to="item.route"
                    class="btn btn-outline"
                    :class="[TOUCH_TARGET_MIN_CLASS]"
                    :aria-label="t('interviewHub.prep.openAria', { title: item.title })"
                  >
                    {{ item.ctaLabel }}
                  </NuxtLink>
                </div>
              </div>
            </UiGlassCard>
          </SectionGrid>
        </div>
      </div>

      <SectionGrid grid-token="twoColumnWide">
        <UiGlassCard variant="standard" :stagger-index="1">
          <div class="card-body">
            <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
              <h2 class="card-title">{{ t("interviewHub.cards.jobPracticeTitle") }}</h2>
              <span class="badge badge-primary badge-outline">{{ t("interviewHub.cards.recommendedBadge") }}</span>
            </div>
            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("interviewHub.cards.jobPracticeDescription") }}
            </p>
            <div v-if="selectedJob" class="alert alert-info alert-vertical sm:alert-horizontal" :class="[MARGIN_TOKEN_CLASS.mt2]">
              <div>
                <h3 class="font-semibold">{{ t("interviewHub.cards.selectedJobTitle") }}</h3>
                <div :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("interviewHub.cards.selectedJobValue", { title: selectedJob.title, company: selectedJob.company }) }}</div>
              </div>
              <button
                :class="[TOUCH_TARGET_MIN_CLASS, 'btn btn-sm btn-ghost', POINTER_EVENTS_TOKEN_CLASS.auto]"
                :aria-label="t('interviewHub.cards.changeJobAria')"
                @click="openConfig('job')"
              >
                {{ t("interviewHub.cards.changeButton") }}
              </button>
            </div>
            <div class="card-actions justify-end" :class="[POINTER_EVENTS_TOKEN_CLASS.auto]">
              <button
                class="btn btn-primary"
                :aria-label="t('interviewHub.cards.configureJobAria')"
                @click="openConfig('job')"
              >
                {{ t("interviewHub.cards.configureJobButton") }}
              </button>
            </div>
          </div>
        </UiGlassCard>

        <UiGlassCard variant="standard" :stagger-index="2">
          <div class="card-body">
            <h2 class="card-title">{{ t("interviewHub.cards.studioDrillTitle") }}</h2>
            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ t("interviewHub.cards.studioDrillDescription") }}
            </p>
            <div v-if="selectedStudioName" class="alert alert-soft" :class="[MARGIN_TOKEN_CLASS.mt2]">
              <span>{{ t("interviewHub.cards.currentStudio", { studio: selectedStudioName }) }}</span>
            </div>
            <div class="card-actions justify-end" :class="[POINTER_EVENTS_TOKEN_CLASS.auto]">
              <button
                class="btn btn-outline"
                :aria-label="t('interviewHub.cards.configureStudioAria')"
                @click="openConfig('studio')"
              >
                {{ t("interviewHub.cards.configureStudioButton") }}
              </button>
            </div>
          </div>
        </UiGlassCard>
      </SectionGrid>

      <InterviewRecentSessionsCard
        :recent-sessions="recentSessions"
        :current-page="recentSessionPagination.currentPage.value"
        :total-pages="recentSessionPagination.totalPages.value"
        :page-numbers="recentSessionPagination.pageNumbers.value"
        :summary="recentSessionsPaginationSummary"
        :page-aria="recentSessionPageAria"
        :format-session-date="formatSessionDate"
        :mode-label="modeLabel"
        :get-score-badge-class="getScoreBadgeClass"
        :view-all-to="APP_ROUTES.interviewHistory"
        @view-session="viewSession"
        @update-page="recentSessionPagination.goToPage"
      />
    </div>

    <InterviewConfigModal
      :open="showConfigModal"
      :title-id="INTERVIEW_CONFIG_DIALOG_TITLE_ID"
      :description-id="INTERVIEW_CONFIG_DIALOG_DESCRIPTION_ID"
      :role-suggestions-list-id="INTERVIEW_ROLE_SUGGESTIONS_LIST_ID"
      :selected-mode="selectedMode"
      :job-search-term="jobSearchTerm"
      :selected-job-id="selectedJobId"
      :searched-jobs="searchedJobs"
      :paginated-jobs="jobSelectionPagination.items.value"
      :selected-job="selectedJob"
      :job-selection-current-page="jobSelectionPagination.currentPage.value"
      :job-selection-total-pages="jobSelectionPagination.totalPages.value"
      :job-selection-page-numbers="jobSelectionPagination.pageNumbers.value"
      :job-selection-summary="jobSelectionPaginationSummary"
      :studios-for-selector="studiosForSelector"
      :session-config="sessionConfig"
      :interview-role-options="interviewRoleOptions"
      :interview-experience-options="interviewExperienceOptions"
      :interview-question-count-options="interviewQuestionCountOptions"
      :tts-voices="ttsVoices"
      :starting="starting"
      :is-start-disabled="isStartDisabled"
      :experience-label="experienceLabel"
      :question-count-label="questionCountLabel"
      :page-aria="interviewConfigPageAria"
      @update:open="showConfigModal = $event"
      @update:selected-mode="selectedMode = $event"
      @update:job-search-term="jobSearchTerm = $event"
      @update:job-page="jobSelectionPagination.goToPage"
      @update:studio-id="sessionConfig.studioId = $event"
      @update:role="sessionConfig.role = $event"
      @update:experience-level="sessionConfig.experienceLevel = $event"
      @update:question-count="sessionConfig.questionCount = $event"
      @update:conversation-style="sessionConfig.conversationStyle = $event"
      @update:enable-voice-mode="sessionConfig.enableVoiceMode = $event"
      @update:voice-id="sessionConfig.voiceSettings.voiceId = $event"
      @select-job="selectJobById"
      @start="handleStartInterview"
    />
  </PageScaffold>
</template>
