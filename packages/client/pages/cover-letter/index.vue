<script setup lang="ts">
import {
  LOADING_SKELETON_LINES,
  UI_STAGGER_INDEX_MAX,
} from "~/constants/numeric-ui";
defineOptions({ name: "PagesCoverLetterIndexPage" });

import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { useCoverLetterListPage } from "~/composables/useCoverLetterListPage";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_DENSE_CLASS,
  OUTLINE_ACTION_ERROR_DENSE_CLASS,
  PAGE_HEADER_DESCRIPTION_MEASURE_CLASS,
  POINTER_EVENTS_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_OUTLINE_SM_CLASS,
} from "~/constants/layout-badges";
import { VISIBILITY_HIDE_BELOW_SM_CLASS } from "~/constants/ui-layout";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();
useSeoMeta({
  title: () => t("coverLetterPage.title"),
  description: () => t("coverLetterPage.subtitle"),
});

const {
  bootstrapPending,
  bootstrapError,
  refreshCoverLetterBootstrap,
  coverLetters,
  coverLetterCards,
  loading,
  resumes,
  COVER_LETTER_COMPANY_MIN_LENGTH,
  COVER_LETTER_GENERATE_DIALOG_TITLE_ID,
  COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH,
  COVER_LETTER_POSITION_MIN_LENGTH,
  COVER_LETTER_TEMPLATE_OPTIONS,
  showGenerateModal,
  generating,
  showDeleteDialog: showDeleteCoverLetterDialog,
  requestDelete: requestDeleteCoverLetter,
  clearDeleteState: clearDeleteCoverLetterState,
  searchQuery,
  templateFilter,
  sortOrder,
  generateForm,
  filteredCoverLetters,
  coverLetterPagination,
  coverLetterPaginationSummary,
  templateUsageCount,
  hasFiltersApplied,
  templateFilterOptions,
  sortOptions,
  clearFilters,
  coverLetterPageAria,
  editLetter,
  handleDeleteCoverLetter,
  handleGenerate,
  templateLabel,
} = useCoverLetterListPage();

const bootstrapErrorMessage = computed(() =>
  bootstrapError.value
    ? getErrorMessage(bootstrapError.value, t("coverLetterPage.toasts.fetchFailed"))
    : "",
);
const hasCoverLetters = computed(() => coverLetters.length > 0);
</script>

<template>
  <PageScaffold
    width-token="wide"
    spacing-token="comfortable"
    labelled-by="cover-letter-page-title"
  >
    <PageHeroHeader
      title-id="cover-letter-page-title"
      :title="t('coverLetterPage.title')"
      :description="hasCoverLetters ? t('coverLetterPage.subtitle') : ''"
      :description-class="PAGE_HEADER_DESCRIPTION_MEASURE_CLASS"
    >
      <template #actions>
        <!-- Empty catalog: EmptyState owns Generate. -->
        <button
          v-if="hasCoverLetters"
          type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('coverLetterPage.generateButtonAria')"
          @click="showGenerateModal = true"
        >
          <IconBolt :class="ICON_SIZE_CLASS['4']" />
          {{ t("coverLetterPage.generateButton") }}
        </button>
      </template>
      <template v-if="hasCoverLetters" #aside>
        <div :class="[VISIBILITY_HIDE_BELOW_SM_CLASS]">
          <StatsRow
            :class="[MARGIN_TOKEN_CLASS.mt4]"
            :stats="[
              { titleKey: 'coverLetterPage.stats.totalTitle', value: coverLetters.length, valueClass: 'text-primary', descKey: 'coverLetterPage.stats.totalDesc' },
              { titleKey: 'coverLetterPage.stats.filteredTitle', value: filteredCoverLetters.length, valueClass: 'text-secondary', descKey: 'coverLetterPage.stats.filteredDesc' },
              { titleKey: 'coverLetterPage.stats.templatesTitle', value: templateUsageCount, descKey: 'coverLetterPage.stats.templatesDesc' },
            ]"
          />
        </div>
      </template>
    </PageHeroHeader>

    <UiGlassCard v-if="hasCoverLetters || hasFiltersApplied" extra-class="glass-card-enter glass-card-enter-0">
      <div class="card-body">
        <SectionGrid grid-token="fourColumnLgGap4">
          <fieldset class="fieldset lg:col-span-2">
            <legend class="fieldset-legend">{{ t("coverLetterPage.filters.searchLegend") }}</legend>
            <input
              v-model="searchQuery"
              type="search"
              class="input" :class="[FLUID_WIDTH_CLASS]"
              :placeholder="t('coverLetterPage.filters.searchPlaceholder')"
              :aria-label="t('coverLetterPage.filters.searchAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.filters.templateLegend") }}</legend>
            <select
              v-model="templateFilter"
              class="select" :class="[FLUID_WIDTH_CLASS]"
              :aria-label="t('coverLetterPage.filters.templateAria')"
            >
              <option
                v-for="option in templateFilterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.filters.sortLegend") }}</legend>
            <select
              v-model="sortOrder"
              class="select" :class="[FLUID_WIDTH_CLASS]"
              :aria-label="t('coverLetterPage.filters.sortAria')"
            >
              <option
                v-for="option in sortOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </fieldset>
        </SectionGrid>

        <div class="card-actions justify-end" v-if="hasFiltersApplied">
          <button type="button" :class="[GHOST_ACTION_DENSE_CLASS]" :aria-label="t('coverLetterPage.filters.clearAria')" @click="clearFilters">
            {{ t("coverLetterPage.filters.clearButton") }}
          </button>
        </div>
      </div>
    </UiGlassCard>

    <LoadingSkeleton
      v-if="bootstrapPending || (loading && coverLetters.length === 0)"
      variant="cards"
      :lines="LOADING_SKELETON_LINES.long"
    />

    <BootstrapErrorAlert
      v-else-if="bootstrapErrorMessage"
      :message="bootstrapErrorMessage"
      @retry="refreshCoverLetterBootstrap"
    />

    <EmptyState
      v-else-if="coverLetters.length === 0"
      title-key="coverLetterPage.emptyStateTitle"
      description-key="coverLetterPage.emptyStateDescription"
      cta-label-key="coverLetterPage.generateButton"
      cta-aria-key="coverLetterPage.generateButtonAria"
      @cta="showGenerateModal = true"
    />

    <EmptyState
      v-else-if="coverLetterCards.length === 0"
      title-key="coverLetterPage.filteredEmptyTitle"
      description-key="coverLetterPage.filteredEmptyState"
      cta-label-key="coverLetterPage.filters.clearButton"
      cta-aria-key="coverLetterPage.filters.clearAria"
      @cta="clearFilters"
    />

    <SectionGrid v-else grid-token="threeColumnResponsive">
      <UiGlassCard
        v-for="(letter, index) in coverLetterCards"
        :key="letter.id"
        :to="APP_ROUTE_BUILDERS.coverLetterDetail(letter.id)"
        :link-aria-label="t('coverLetterPage.cards.openAria', { company: letter.company, position: letter.position })"
        :stagger-index="Math.min(index, UI_STAGGER_INDEX_MAX)"
      >
        <div class="card-body relative z-10">
          <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <div>
              <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ letter.position }}</h2>
              <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ letter.company }}</p>
            </div>
            <span :class="[BADGE_OUTLINE_SM_CLASS]">
              {{ letter.templateLabel }}
            </span>
          </div>

          <p class="line-clamp-4 text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ letter.previewText }}
          </p>

          <div class="flex items-center justify-between text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
            <span>{{ t("coverLetterPage.cards.updatedAtLabel") }}</span>
            <time>{{ letter.updatedAtLabel }}</time>
          </div>

          <div class="card-actions justify-end" :class="[POINTER_EVENTS_TOKEN_CLASS.auto]">
            <button type="button"
              :class="[OUTLINE_ACTION_DENSE_CLASS]"
              :aria-label="t('coverLetterPage.cards.editAria', { company: letter.company, position: letter.position })"
              @click.stop="editLetter(letter.id)"
            >
              {{ t("coverLetterPage.cards.editButton") }}
            </button>
            <button type="button"
              :class="[TOUCH_TARGET_MIN_CLASS, OUTLINE_ACTION_ERROR_DENSE_CLASS]"
              :aria-label="t('coverLetterPage.cards.deleteAria', { company: letter.company, position: letter.position })"
              @click.stop="requestDeleteCoverLetter(letter.id)"
            >
              {{ t("coverLetterPage.cards.deleteButton") }}
            </button>
          </div>
        </div>
      </UiGlassCard>
    </SectionGrid>

    <AppPagination
      :current-page="coverLetterPagination.currentPage.value"
      :total-pages="coverLetterPagination.totalPages.value"
      :page-numbers="coverLetterPagination.pageNumbers.value"
      :summary="coverLetterPaginationSummary"
      :navigation-aria="t('coverLetterPage.pagination.navigationAria')"
      :previous-aria="t('coverLetterPage.pagination.previousAria')"
      :next-aria="t('coverLetterPage.pagination.nextAria')"
      :page-aria="coverLetterPageAria"
      @update:current-page="coverLetterPagination.goToPage"
    />

    <CoverLetterGenerateDialog
      v-model:open="showGenerateModal"
      v-model:form="generateForm"
      :generating="generating"
      :title-id="COVER_LETTER_GENERATE_DIALOG_TITLE_ID"
      :company-min-length="COVER_LETTER_COMPANY_MIN_LENGTH"
      :position-min-length="COVER_LETTER_POSITION_MIN_LENGTH"
      :job-description-min-length="COVER_LETTER_JOB_DESCRIPTION_MIN_LENGTH"
      :resumes="resumes"
      :template-options="COVER_LETTER_TEMPLATE_OPTIONS"
      :template-label="templateLabel"
      @generate="handleGenerate"
    />

    <ConfirmDialog
      id="cover-letter-delete-dialog"
      v-model:open="showDeleteCoverLetterDialog"
      :title="t('coverLetterPage.deleteDialog.title')"
      :message="t('coverLetterPage.deleteDialog.message')"
      :confirm-text="t('coverLetterPage.deleteDialog.confirmButton')"
      :cancel-text="t('coverLetterPage.deleteDialog.cancelButton')"
      variant="danger"
      focus-primary
      @confirm="handleDeleteCoverLetter"
      @cancel="clearDeleteCoverLetterState"
    />
  </PageScaffold>
</template>
