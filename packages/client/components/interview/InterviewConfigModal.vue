<script setup lang="ts">
import type { InterviewConversationStyle, InterviewMode } from "@bao/shared/types/interview";
import type { Job } from "@bao/shared/types/jobs";
import { useI18n } from "vue-i18n";
import {
  FONT_WEIGHT_TOKEN_CLASS,
  GHOST_ACTION_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PRIMARY_ACTION_CLASS,
  PRIMARY_BUTTON_VARIANT_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import type { InterviewHubSessionConfig, StudioSelectorOption } from "~/types/interview";

defineProps<{
  open: boolean;
  titleId: string;
  descriptionId: string;
  roleSuggestionsListId: string;
  selectedMode: InterviewMode;
  jobSearchTerm: string;
  selectedJobId: string;
  searchedJobs: readonly Job[];
  paginatedJobs: readonly Job[];
  selectedJob: Job | null;
  jobSelectionCurrentPage: number;
  jobSelectionTotalPages: number;
  jobSelectionPageNumbers: readonly number[];
  jobSelectionSummary: string;
  studiosForSelector: readonly StudioSelectorOption[];
  sessionConfig: InterviewHubSessionConfig;
  interviewRoleOptions: readonly string[];
  interviewExperienceOptions: readonly string[];
  interviewQuestionCountOptions: readonly number[];
  ttsVoices: readonly SpeechSynthesisVoice[];
  starting: boolean;
  isStartDisabled: boolean;
  experienceLabel: (level: string) => string;
  questionCountLabel: (count: number) => string;
  pageAria: (page: number) => string;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "update:selected-mode": [value: InterviewMode];
  "update:job-search-term": [value: string];
  "update:studio-id": [value: string];
  "update:role": [value: string];
  "update:experience-level": [value: string];
  "update:question-count": [value: number];
  "update:conversation-style": [value: InterviewConversationStyle];
  "update:enable-voice-mode": [value: boolean];
  "update:voice-id": [value: string];
  "update:job-page": [value: number];
  selectJob: [jobId: string];
  start: [];
}>();

const { t } = useI18n();
</script>

<template>
  <AppModalFrame
    :open="open"
    :title-id="titleId"
    :described-by-id="descriptionId"
    size-token="standard"
    :close-aria-label="t('interviewHub.config.closeDialogAria')"
    :close-backdrop-label="t('interviewHub.config.closeBackdropButton')"
    @update:open="emit('update:open', $event)"
  >
    <h3 :id="titleId" :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.lg]">
      {{ t("interviewHub.config.title") }}
    </h3>
    <p :id="descriptionId" class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mt1, TYPOGRAPHY_SCALE_CLASS.sm]">
      {{ t("interviewHub.config.subtitle") }}
    </p>

    <div class="join" :class="[MARGIN_TOKEN_CLASS.mt4]">
      <button
        type="button"
        :class="[OUTLINE_ACTION_CLASS, 'join-item', { [PRIMARY_BUTTON_VARIANT_CLASS]: selectedMode === 'job' }]"
        :aria-label="t('interviewHub.config.switchToJobAria')"
        @click="emit('update:selected-mode', 'job')"
      >
        {{ t("interviewHub.config.modeJobButton") }}
      </button>
      <button
        type="button"
        :class="[OUTLINE_ACTION_CLASS, 'join-item', { [PRIMARY_BUTTON_VARIANT_CLASS]: selectedMode === 'studio' }]"
        :aria-label="t('interviewHub.config.switchToStudioAria')"
        @click="emit('update:selected-mode', 'studio')"
      >
        {{ t("interviewHub.config.modeStudioButton") }}
      </button>
    </div>

    <SectionGrid :class="[MARGIN_TOKEN_CLASS.mt6]" grid-token="twoColumnWide">
      <InterviewConfigJobPanel
        v-if="selectedMode === 'job'"
        :job-search-term="jobSearchTerm"
        :selected-job-id="selectedJobId"
        :searched-jobs="searchedJobs"
        :paginated-jobs="paginatedJobs"
        :selected-job="selectedJob"
        :job-selection-current-page="jobSelectionCurrentPage"
        :job-selection-total-pages="jobSelectionTotalPages"
        :job-selection-page-numbers="jobSelectionPageNumbers"
        :job-selection-summary="jobSelectionSummary"
        :page-aria="pageAria"
        @update:job-search-term="emit('update:job-search-term', $event)"
        @update:job-page="emit('update:job-page', $event)"
        @select-job="emit('selectJob', $event)"
      />

      <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("interviewHub.config.studioLegend") }}</legend>
          <StudioSelector
            :model-value="sessionConfig.studioId"
            :studios="[...studiosForSelector]"
            @update:model-value="emit('update:studio-id', $event)"
          />
          <p v-if="studiosForSelector.length === 0" class="text-muted" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.xs]">
            {{ t("interviewHub.config.noStudiosHint") }}
          </p>
        </fieldset>
      </div>

      <InterviewConfigSessionFields
        :selected-mode="selectedMode"
        :role-suggestions-list-id="roleSuggestionsListId"
        :session-config="sessionConfig"
        :interview-role-options="interviewRoleOptions"
        :interview-experience-options="interviewExperienceOptions"
        :interview-question-count-options="interviewQuestionCountOptions"
        :tts-voices="ttsVoices"
        :experience-label="experienceLabel"
        :question-count-label="questionCountLabel"
        @update:role="emit('update:role', $event)"
        @update:experience-level="emit('update:experience-level', $event)"
        @update:question-count="emit('update:question-count', $event)"
        @update:conversation-style="emit('update:conversation-style', $event)"
        @update:enable-voice-mode="emit('update:enable-voice-mode', $event)"
        @update:voice-id="emit('update:voice-id', $event)"
      />

      <div class="modal-action">
        <button
          type="button"
          :class="GHOST_ACTION_CLASS"
          :aria-label="t('interviewHub.config.cancelAria')"
          @click="emit('update:open', false)"
        >
          {{ t("interviewHub.config.cancelButton") }}
        </button>
        <button
          type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('interviewHub.config.startAria')"
          :disabled="isStartDisabled"
          @click="emit('start')"
        >
          <LoadingSpinner size="xs" label="Loading" v-if="starting" />
          {{ t("interviewHub.config.startButton") }}
        </button>
      </div>
    </SectionGrid>
  </AppModalFrame>
</template>
