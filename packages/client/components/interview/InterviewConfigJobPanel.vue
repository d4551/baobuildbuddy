<script setup lang="ts">
import type { Job } from "@bao/shared/types/jobs";
import { useI18n } from "vue-i18n";
import ResponsiveDataSurface from "~/components/ui/ResponsiveDataSurface.vue";
import {
  BADGE_OUTLINE_SM_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  INSET_PANEL_CLASS,
  MARGIN_TOKEN_CLASS,
  MAX_HEIGHT_TOKEN_CLASS,
  MAX_W_64_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_BUTTON_VARIANT_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { UI_CHIP_PREVIEW_LIMIT } from "~/constants/numeric-ui";

defineProps<{
  jobSearchTerm: string;
  selectedJobId: string;
  searchedJobs: readonly Job[];
  paginatedJobs: readonly Job[];
  selectedJob: Job | null;
  jobSelectionCurrentPage: number;
  jobSelectionTotalPages: number;
  jobSelectionPageNumbers: readonly number[];
  jobSelectionSummary: string;
  pageAria: (page: number) => string;
}>();

const emit = defineEmits<{
  "update:job-search-term": [value: string];
  "update:job-page": [value: number];
  selectJob: [jobId: string];
}>();

const { t } = useI18n();

function updateJobSearchTerm(event: Event): void {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("update:job-search-term", target.value);
  }
}
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("interviewHub.config.searchJobsLegend") }}</legend>
      <input
        :value="jobSearchTerm"
        type="text"
        class="input"
        :class="[FLUID_WIDTH_CLASS]"
        :placeholder="t('interviewHub.config.searchJobsPlaceholder')"
        :aria-label="t('interviewHub.config.searchJobsAria')"
        @input="updateJobSearchTerm"
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
            v-for="tech in selectedJob.technologies?.slice(0, UI_CHIP_PREVIEW_LIMIT)"
            :key="tech"
            :class="BADGE_OUTLINE_SM_CLASS"
          >
            {{ tech }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
