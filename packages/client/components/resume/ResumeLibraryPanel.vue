<script setup lang="ts">
import {  ICON_SIZE_CLASS, SURFACE_GLASS_CARD_CLASS, FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS, FLEX_GAP_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
} from "~/constants/layout";
import type { ResumeData } from "@bao/shared/types/resume";
import {  ICON_SIZE_CLASS, SURFACE_GLASS_CARD_CLASS, FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS, FLEX_GAP_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, useI18n } from "vue-i18n";

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

defineProps<ResumeLibraryPanelProps>();

const searchQuery = defineModel<string>("searchQuery", { required: true });

const emit = defineEmits<{
  clearFilters: [];
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
    <section v-if="resumes.length > 0" :class="SURFACE_GLASS_CARD_CLASS">
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
          <button
            class="btn btn-sm btn-ghost"
            :aria-label="t('resumePage.filters.clearAria')"
            @click="emit('clearFilters')"
          >
            {{ t("resumePage.filters.clearButton") }}
          </button>
        </div>
      </div>
    </section>

    <div v-if="resumes.length === 0" class="alert alert-info alert-soft">
      <IconInfoCircle :class="ICON_SIZE_CLASS.md" />
      <span>{{ t("resumePage.emptyState") }}</span>
    </div>

    <FilteredEmptyAlert
      v-else-if="filteredResumes.length === 0"
      message-key="resumePage.filteredEmptyState"
    />
    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
      <SectionGrid grid-token="threeColumnLg">
        <div
          v-for="resume in paginatedResumes"
          :key="resume.id"
          class="relative overflow-hidden transition-colors"
          :class="
            (resume.experience?.length ?? 0) > 0
              ? 'card card-border bg-base-100 hover:bg-base-200'
              : 'card card-dash bg-base-100 hover:bg-base-200'
          "
        >
          <button
            type="button"
            class="absolute inset-0 rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            :aria-label="t('resumePage.editButtonAria', { name: resume.name })"
            @click="selectResume(resume.id)"
          />
          <div class="relative z-10 card-body">
            <h3 class="card-title">{{ resume.name }}</h3>
            <div class="flex" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt2]">
              <span class="badge badge-sm">{{ templateLabel(resume.template) }}</span>
              <span v-if="resume.isDefault" class="badge badge-primary badge-sm">
                {{ t("resumePage.defaultBadge") }}
              </span>
            </div>
            <div class="card-actions justify-end" :class="[MARGIN_TOKEN_CLASS.mt4]">
              <button
                class="relative z-20 btn btn-sm btn-outline"
                :aria-label="t('resumePage.editButtonAria', { name: resume.name })"
                @click.stop="selectResume(resume.id)"
              >
                {{ t("resumePage.editButton") }}
              </button>
              <button
                class="relative z-20 btn btn-sm btn-error btn-outline"
                :aria-label="t('resumePage.deleteButtonAria', { name: resume.name })"
                @click.stop="requestDelete(resume.id)"
              >
                {{ t("resumePage.deleteButton") }}
              </button>
            </div>
          </div>
        </div>
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
