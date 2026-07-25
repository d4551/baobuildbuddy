<script setup lang="ts">
import type { InterviewConversationStyle, InterviewMode } from "@bao/shared/types/interview";
import type { Job } from "@bao/shared/types/jobs";
import { useI18n } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import {
  BADGE_OUTLINE_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  GHOST_ACTION_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  INSET_PANEL_CLASS,
  MARGIN_TOKEN_CLASS,
  MAX_HEIGHT_TOKEN_CLASS,
  MAX_W_64_CLASS,
  OUTLINE_ACTION_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  PRIMARY_BUTTON_VARIANT_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
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

function updateTextValue(event: Event, emitEvent: "update:job-search-term"): void {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
    emit(emitEvent, target.value);
  }
}
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
      <div v-if="selectedMode === 'job'" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("interviewHub.config.searchJobsLegend") }}</legend>
          <input 
            :value="jobSearchTerm"
            type="text"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :placeholder="t('interviewHub.config.searchJobsPlaceholder')"
            :aria-label="t('interviewHub.config.searchJobsAria')"
            @input="updateTextValue($event, 'update:job-search-term')"
          />
        </fieldset>

        <EmptyState
          v-if="searchedJobs.length === 0"
          title-key="interviewHub.config.noJobsTitle"
          description-key="interviewHub.config.noJobsState"
          cta-label-key="interviewHub.config.clearJobSearchButton"
          cta-aria-key="interviewHub.config.clearJobSearchAria"
          @cta="emit('update:job-search-term', '')"
        />

        <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <div
            class="overflow-y-auto rounded-box border border-base-300"
            :class="[MAX_HEIGHT_TOKEN_CLASS.maxH72]"
          >
            <ResponsiveDataSurface>
              <template #cards>
                <ul
                  class="list-none"
                  :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3, PADDING_TOKEN_CLASS.p3]"
                  :aria-label="t('interviewHub.config.jobsTableAria')"
                >
                  <li
                    v-for="job in paginatedJobs"
                    :key="job.id"
 
 :class="[INSET_PANEL_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack2, PADDING_TOKEN_CLASS.p3]"
 >
                    <div>
                      <p class="font-semibold">{{ job.title }}</p>
                      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ job.company }}</p>
                    </div>
                    <button
                      type="button"
                      :class="[
                        GHOST_ACTION_DENSE_CLASS,
                        TOUCH_TARGET_MIN_CLASS,
                        FLUID_WIDTH_CLASS,
                        { [PRIMARY_BUTTON_VARIANT_CLASS]: job.id === selectedJobId },
                      ]"
                      :aria-label="t('interviewHub.config.selectJobAria', { title: job.title, company: job.company })"
                      @click="emit('selectJob', job.id)"
                    >
                      {{
                        job.id === selectedJobId
                          ? t("interviewHub.config.selectedButton")
                          : t("interviewHub.config.selectButton")
                      }}
                    </button>
                  </li>
                </ul>
              </template>
              <template #table>
                <table class="table table-sm table-zebra" :aria-label="t('interviewHub.config.jobsTableAria')">
                  <thead>
                    <tr>
                      <th scope="col">{{ t("interviewHub.config.jobsColumns.job") }}</th>
                      <th scope="col">{{ t("interviewHub.config.jobsColumns.company") }}</th>
                      <th scope="col">
                        <span class="sr-only">{{ t("interviewHub.config.selectButton") }}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="job in paginatedJobs" :key="job.id" class="hover:bg-base-200">
                      <td class="truncate" :class="[MAX_W_64_CLASS]">{{ job.title }}</td>
                      <td>{{ job.company }}</td>
                      <td class="text-end">
                        <button
                          type="button"
                          :class="[
                            GHOST_ACTION_DENSE_CLASS,
                            TOUCH_TARGET_MIN_CLASS,
                            { [PRIMARY_BUTTON_VARIANT_CLASS]: job.id === selectedJobId },
                          ]"
                          :aria-label="t('interviewHub.config.selectJobAria', { title: job.title, company: job.company })"
                          @click="emit('selectJob', job.id)"
                        >
                          {{
                            job.id === selectedJobId
                              ? t("interviewHub.config.selectedButton")
                              : t("interviewHub.config.selectButton")
                          }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </ResponsiveDataSurface>
          </div>

          <AppPagination
            :current-page="jobSelectionCurrentPage"
            :total-pages="jobSelectionTotalPages"
            :page-numbers="jobSelectionPageNumbers"
            :summary="jobSelectionSummary"
            :navigation-aria="t('interviewHub.config.pagination.navigationAria')"
            :previous-aria="t('interviewHub.config.pagination.previousAria')"
            :next-aria="t('interviewHub.config.pagination.nextAria')"
            :page-aria="pageAria"
            @update:current-page="emit('update:job-page', $event)"
          />
        </div>

        <div v-if="selectedJob" :class="SURFACE_GLASS_CARD_CLASS" role="status" aria-live="polite">
          <div class="card-body" :class="[PADDING_TOKEN_CLASS.p4]">
            <h4 class="font-semibold">{{ selectedJob.title }}</h4>
            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
              {{ selectedJob.company }} · {{ selectedJob.location }}
            </p>
            <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]">
              <span 
                v-for="tech in selectedJob.technologies?.slice(0, 6)"
                :key="tech"
                :class="BADGE_OUTLINE_SM_CLASS"
              >
                {{ tech }}
              </span>
            </div>
          </div>
        </div>
      </div>

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
