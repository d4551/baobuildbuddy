<script setup lang="ts">
import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { useCoverLetterListPage } from "~/composables/useCoverLetterListPage";
import { PAGE_HEADER_DESCRIPTION_MEASURE_CLASS } from "~/constants/layout";

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
      :description="t('coverLetterPage.subtitle')"
      :description-class="PAGE_HEADER_DESCRIPTION_MEASURE_CLASS"
    >
      <template #actions>
        <button
          class="btn btn-primary"
          :aria-label="t('coverLetterPage.generateButtonAria')"
          @click="showGenerateModal = true"
        >
          <IconBolt class="h-4 w-4" />
          {{ t("coverLetterPage.generateButton") }}
        </button>
      </template>
      <template #aside>
        <StatsRow
          class="mt-4"
          :stats="[
            { titleKey: 'coverLetterPage.stats.totalTitle', value: coverLetters.length, valueClass: 'text-primary', descKey: 'coverLetterPage.stats.totalDesc' },
            { titleKey: 'coverLetterPage.stats.filteredTitle', value: filteredCoverLetters.length, valueClass: 'text-secondary', descKey: 'coverLetterPage.stats.filteredDesc' },
            { titleKey: 'coverLetterPage.stats.templatesTitle', value: templateUsageCount, descKey: 'coverLetterPage.stats.templatesDesc' },
          ]"
        />
      </template>
    </PageHeroHeader>

    <section class="card card-border bg-base-100">
      <div class="card-body">
        <SectionGrid grid-token="fourColumnLgGap4">
          <fieldset class="fieldset lg:col-span-2">
            <legend class="fieldset-legend">{{ t("coverLetterPage.filters.searchLegend") }}</legend>
            <input
              v-model="searchQuery"
              type="search"
              class="input w-full"
              :placeholder="t('coverLetterPage.filters.searchPlaceholder')"
              :aria-label="t('coverLetterPage.filters.searchAria')"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("coverLetterPage.filters.templateLegend") }}</legend>
            <select
              v-model="templateFilter"
              class="select w-full"
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
              class="select w-full"
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
          <button class="btn btn-sm btn-ghost" :aria-label="t('coverLetterPage.filters.clearAria')" @click="clearFilters">
            {{ t("coverLetterPage.filters.clearButton") }}
          </button>
        </div>
      </div>
    </section>

    <LoadingSkeleton
      v-if="bootstrapPending || (loading && coverLetters.length === 0)"
      variant="cards"
      :lines="6"
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
    />

    <FilteredEmptyAlert
      v-else-if="coverLetterCards.length === 0"
      message-key="coverLetterPage.filteredEmptyState"
    />

    <SectionGrid v-else grid-token="threeColumnResponsive">
      <article
        v-for="letter in coverLetterCards"
        :key="letter.id"
        class="card card-border relative overflow-hidden bg-base-100 transition-colors hover:bg-base-200"
      >
        <NuxtLink
          :to="APP_ROUTE_BUILDERS.coverLetterDetail(letter.id)"
          class="absolute inset-0 rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          :aria-label="t('coverLetterPage.cards.openAria', { company: letter.company, position: letter.position })"
        />
        <div class="card-body relative z-10">
          <div class="flex items-start justify-between gap-2">
            <div>
              <h2 class="card-title text-lg">{{ letter.position }}</h2>
              <p class="text-sm text-secondary">{{ letter.company }}</p>
            </div>
            <span class="badge badge-outline badge-sm">
              {{ letter.templateLabel }}
            </span>
          </div>

          <p class="line-clamp-4 text-sm text-secondary">
            {{ letter.previewText }}
          </p>

          <div class="flex items-center justify-between text-xs text-muted">
            <span>{{ t("coverLetterPage.cards.updatedAtLabel") }}</span>
            <time>{{ letter.updatedAtLabel }}</time>
          </div>

          <div class="card-actions justify-end">
            <button
              class="btn btn-sm btn-outline relative z-20"
              :aria-label="t('coverLetterPage.cards.editAria', { company: letter.company, position: letter.position })"
              @click.stop="editLetter(letter.id)"
            >
              {{ t("coverLetterPage.cards.editButton") }}
            </button>
            <button
              class="btn btn-sm btn-error btn-outline relative z-20"
              :aria-label="t('coverLetterPage.cards.deleteAria', { company: letter.company, position: letter.position })"
              @click.stop="requestDeleteCoverLetter(letter.id)"
            >
              {{ t("coverLetterPage.cards.deleteButton") }}
            </button>
          </div>
        </div>
      </article>
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
