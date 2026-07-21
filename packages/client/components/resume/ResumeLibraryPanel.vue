<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import type { ResumeData } from "@bao/shared/types/resume";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_DENSE_CLASS,
  OUTLINE_ACTION_ERROR_DENSE_CLASS,
  POINTER_EVENTS_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
} from "~/constants/layout";
import {
  BADGE_PRIMARY_SM_CLASS,
  BADGE_SM_CLASS,
} from "~/constants/layout-badges";

interface ResumeLibraryPanelProps {
  readonly resumes: readonly ResumeData[];
  readonly filteredResumes: readonly ResumeData[];
  readonly paginatedResumes: readonly ResumeData[];
  readonly hasFiltersApplied: boolean;
  readonly summary: string;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly pageNumbers: readonly number[];
  readonly templateLabel: (template?: string) => string;
  readonly pageAria: (page: number) => string;
}

const searchQuery = defineModel<string>("searchQuery", { required: true });

defineProps<ResumeLibraryPanelProps>();

const emit = defineEmits<{
  clearFilters: [];
  createResume: [];
  selectResume: [resumeId: string];
  requestDelete: [resumeId: string];
  "update:currentPage": [page: number];
}>();

const { t } = useI18n();

function selectResume(resumeId?: string): void {
  if (resumeId) {
    emit("selectResume", resumeId);
  }
}

function requestDelete(resumeId?: string): void {
  if (resumeId) {
    emit("requestDelete", resumeId);
  }
}
</script>

<template>
  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
    <UiGlassCard v-if="resumes.length > 0">
      <div class="card-body">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("resumePage.filters.searchLegend") }}</legend>
          <input 
            v-model="searchQuery"
            type="search"
            class="input" :class="[FLUID_WIDTH_CLASS]"
            :placeholder="t('resumePage.filters.searchPlaceholder')"
            :aria-label="t('resumePage.filters.searchAria')"
          />
        </fieldset>

        <div v-if="hasFiltersApplied" class="card-actions justify-end">
          <button type="button" 
            :class="[GHOST_ACTION_DENSE_CLASS]"
            :aria-label="t('resumePage.filters.clearAria')"
            @click="emit('clearFilters')"
          >
            {{ t("resumePage.filters.clearButton") }}
          </button>
        </div>
      </div>
    </UiGlassCard>

    <EmptyState
      v-if="resumes.length === 0"
      title-key="resumePage.emptyStateTitle"
      description-key="resumePage.emptyState"
      cta-label-key="resumePage.createButton"
      cta-aria-key="resumePage.createButtonAria"
      @cta="emit('createResume')"
    />

    <EmptyState
      v-else-if="filteredResumes.length === 0"
      title-key="resumePage.filteredEmptyTitle"
      description-key="resumePage.filteredEmptyState"
      cta-label-key="resumePage.filters.clearButton"
      cta-aria-key="resumePage.filters.clearAria"
      @cta="emit('clearFilters')"
    />
    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <SectionGrid grid-token="threeColumnLg">
        <UiGlassCard
          v-for="(resume, index) in paginatedResumes"
          :key="resume.id"
          :stagger-index="Math.min(index, 11)"
          :extra-class="
            (resume.experience?.length ?? 0) > 0 ? '' : 'card-dash border-dashed'
          "
        >
          <button
            type="button"
            class="absolute inset-0 z-0 rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            :aria-label="t('resumePage.editButtonAria', { name: resume.name })"
            @click="selectResume(resume.id)"
          />
          <div class="relative z-10 card-body" :class="[POINTER_EVENTS_TOKEN_CLASS.none]">
            <h3 class="card-title">{{ resume.name }}</h3>
            <div class="flex" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]">
              <span :class="[BADGE_SM_CLASS]">{{ templateLabel(resume.template) }}</span>
              <span v-if="resume.isDefault" :class="[BADGE_PRIMARY_SM_CLASS]">
                {{ t("resumePage.defaultBadge") }}
              </span>
            </div>
            <div
              class="card-actions justify-end"
              :class="[MARGIN_TOKEN_CLASS.mt4, POINTER_EVENTS_TOKEN_CLASS.auto, FLEX_GAP_TOKEN_CLASS.gap2]"
            >
              <NuxtLink
                :to="APP_ROUTE_BUILDERS.resumePreview(resume.id)"
                :class="[GHOST_ACTION_DENSE_CLASS]"
                :aria-label="t('resumePage.previewButtonAria', { name: resume.name })"
                @click.stop
              >
                {{ t("resumePage.previewButton") }}
              </NuxtLink>
              <button type="button" 
                :class="[OUTLINE_ACTION_DENSE_CLASS]"
                :aria-label="t('resumePage.editButtonAria', { name: resume.name })"
                @click.stop="selectResume(resume.id)"
              >
                {{ t("resumePage.editButton") }}
              </button>
              <button type="button" 
                :class="[TOUCH_TARGET_MIN_CLASS, OUTLINE_ACTION_ERROR_DENSE_CLASS]"
                :aria-label="t('resumePage.deleteButtonAria', { name: resume.name })"
                @click.stop="requestDelete(resume.id)"
              >
                {{ t("resumePage.deleteButton") }}
              </button>
            </div>
          </div>
        </UiGlassCard>
      </SectionGrid>

      <AppPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :page-numbers="pageNumbers"
        :summary="summary"
        :navigation-aria="t('resumePage.pagination.navigationAria')"
        :previous-aria="t('resumePage.pagination.previousAria')"
        :next-aria="t('resumePage.pagination.nextAria')"
        :page-aria="pageAria"
        @update:current-page="emit('update:currentPage', $event)"
      />
    </div>
  </div>
</template>
