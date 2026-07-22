<script setup lang="ts">
import {
  LOADING_SKELETON_LINES,
} from "~/constants/numeric-ui";

defineOptions({ name: "PagesPortfolioIndexPage" });

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  GHOST_ACTION_DENSE_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  PAGE_HEADER_DESCRIPTION_MEASURE_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
} from "~/constants/layout";
import { VISIBILITY_HIDE_BELOW_SM_CLASS } from "~/constants/ui-layout";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();
const page = usePortfolioPage();
const {
  pending: bootstrapPending,
  error: bootstrapError,
  refresh: refreshPortfolio,
} = await useAsyncData("portfolio-page-bootstrap", async () => {
  await page.loadPortfolio();
  return true;
});
// Client hydrate skips the loader when payload exists; form is local reactive and
// would stay empty while SSR HTML already has metadata — sync from shared useState.
page.syncPortfolioMetadata(page.portfolio.value?.metadata);

useSeoMeta({
  title: t("portfolioPage.title"),
  description: t("portfolioPage.subtitle"),
});

const {
  PORTFOLIO_PROJECT_DIALOG_TITLE_ID,
  addTechnology,
  canMove,
  clearDeleteProjectState,
  clearFilters,
  featuredProjectCount,
  filteredProjects,
  handleDeleteProject,
  handleExport,
  handleSavePortfolio,
  handleSaveProject,
  hasFiltersApplied,
  hasMetadata,
  loading,
  portfolio,
  newTech,
  openAddModal,
  openEditModal,
  portfolioForm,
  projectForm,
  projectPageAria,
  projectPagination,
  projectPaginationSummary,
  projectTechnologySuggestions,
  projects,
  removeTechnology,
  reorderingProjectId,
  requestDeleteProject,
  searchQuery,
  showAddModal,
  showDeleteProjectDialog,
  moveProject,
  editingProject,
} = page;

const bootstrapErrorMessage = computed(() =>
  bootstrapError.value
    ? getErrorMessage(bootstrapError.value, t("portfolioPage.bootstrap.loadError"))
    : "",
);

const hasPortfolioContent = computed(() => hasMetadata.value || projects.value.length > 0);
const isPortfolioEmpty = computed(() => !hasPortfolioContent.value);
const showEmptyProfileEditor = ref(false);

function updatePortfolioForm(value: typeof portfolioForm): void {
  Object.assign(portfolioForm, value);
}

function updateProjectForm(value: typeof projectForm): void {
  Object.assign(projectForm, value);
}
</script>

<template>
  <PageScaffold
    width-token="wide"
    spacing-token="comfortable"
    labelled-by="portfolio-page-title"
  >
    <PageHeroHeader
      title-id="portfolio-page-title"
      :title="t('portfolioPage.title')"
      :description="isPortfolioEmpty ? '' : t('portfolioPage.subtitle')"
      :description-class="PAGE_HEADER_DESCRIPTION_MEASURE_CLASS"
    >
      <template v-if="!isPortfolioEmpty" #actions>
        <NuxtLink
          :to="APP_ROUTES.portfolioPreview"
          :class="[OUTLINE_ACTION_CLASS]"
          :aria-label="t('portfolioPage.actions.previewAria')"
        >
          <svg :class="ICON_SIZE_CLASS['4']" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {{ t("portfolioPage.actions.previewButton") }}
        </NuxtLink>

        <AppExportMenu
          :button-label="t('portfolioPage.actions.exportButton')"
          :button-aria-label="t('portfolioPage.actions.exportAria')"
          :disabled="loading"
          :summary-class="PRIMARY_ACTION_CLASS"
          @export="handleExport"
        />
      </template>
      <template v-if="!isPortfolioEmpty" #aside>
        <div :class="[VISIBILITY_HIDE_BELOW_SM_CLASS]">
          <StatsRow
            :class="[MARGIN_TOKEN_CLASS.mt4]"
            :stats="[
              { titleKey: 'portfolioPage.stats.projectsTitle', value: projects.length, valueClass: 'text-primary', descKey: 'portfolioPage.stats.projectsDesc' },
              { titleKey: 'portfolioPage.stats.featuredTitle', value: featuredProjectCount, valueClass: 'text-secondary', descKey: 'portfolioPage.stats.featuredDesc' },
              { titleKey: 'portfolioPage.stats.profileTitle', value: hasMetadata ? t('portfolioPage.stats.profileReady') : t('portfolioPage.stats.profileMissing'), descKey: 'portfolioPage.stats.profileDesc' },
            ]"
          />
        </div>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="bootstrapPending || (loading && !portfolio)" :lines="LOADING_SKELETON_LINES.form" />

    <BootstrapErrorAlert
      v-else-if="bootstrapErrorMessage"
      :message="bootstrapErrorMessage"
      :retry-label="t('portfolioPage.bootstrap.retryButton')"
      :retry-aria-label="t('portfolioPage.bootstrap.retryAria')"
      @retry="refreshPortfolio"
    />

    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <div v-if="isPortfolioEmpty" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <EmptyState
          title-key="portfolioPage.emptyState.title"
          description-key="portfolioPage.emptyState.description"
          cta-label-key="portfolioPage.projects.addButton"
          cta-aria-key="portfolioPage.projects.addAria"
          @cta="openAddModal"
        >
          <template #actions>
            <button
              type="button"
              :class="[OUTLINE_ACTION_CLASS, FLUID_WIDTH_CLASS]"
              :aria-label="t('portfolioPage.emptyState.profileButton')"
              @click="showEmptyProfileEditor = !showEmptyProfileEditor"
            >
              {{ t("portfolioPage.emptyState.profileButton") }}
            </button>
          </template>
        </EmptyState>
        <PortfolioProfileCard
          v-if="showEmptyProfileEditor"
          :portfolio-form="portfolioForm"
          @update:portfolio-form="updatePortfolioForm"
          @save="handleSavePortfolio"
        />
      </div>

      <UiGlassCard v-if="!isPortfolioEmpty" extra-class="glass-card-enter glass-card-enter-0">
        <div class="card-body">
          <SectionGrid grid-token="threeColumnLgGap4">
            <fieldset class="fieldset lg:col-span-2">
              <legend class="fieldset-legend">{{ t("portfolioPage.filters.searchLegend") }}</legend>
              <input
                v-model="searchQuery"
                type="search"
                class="input" :class="[FLUID_WIDTH_CLASS]"
                :placeholder="t('portfolioPage.filters.searchPlaceholder')"
                :aria-label="t('portfolioPage.filters.searchAria')"
              />
            </fieldset>
          </SectionGrid>

          <div v-if="hasFiltersApplied" class="card-actions justify-end">
            <button type="button" :class="[GHOST_ACTION_DENSE_CLASS]" :aria-label="t('portfolioPage.filters.clearAria')" @click="clearFilters">
              {{ t("portfolioPage.filters.clearButton") }}
            </button>
          </div>
        </div>
      </UiGlassCard>

      <PortfolioProfileCard
        v-if="!isPortfolioEmpty"
        :portfolio-form="portfolioForm"
        @update:portfolio-form="updatePortfolioForm"
        @save="handleSavePortfolio"
      />

      <PortfolioProjectsCard
        v-if="!isPortfolioEmpty"
        :all-projects-length="projects.length"
        :filtered-projects-length="filteredProjects.length"
        :paginated-projects="projectPagination.items.value"
        :reordering-project-id="reorderingProjectId"
        :current-page="projectPagination.currentPage.value"
        :page-numbers="projectPagination.pageNumbers.value"
        :summary="projectPaginationSummary"
        :total-pages="projectPagination.totalPages.value"
        :project-page-aria="projectPageAria"
        :can-move="canMove"
        @open-add="openAddModal"
        @clear-filters="clearFilters"
        @edit="openEditModal"
        @delete="requestDeleteProject"
        @move="moveProject"
        @update:current-page="projectPagination.goToPage"
      />
    </div>

    <PortfolioProjectModal
      :open="showAddModal"
      :title-id="PORTFOLIO_PROJECT_DIALOG_TITLE_ID"
      :editing="Boolean(editingProject)"
      :project-form="projectForm"
      :new-tech="newTech"
      :technology-suggestions="projectTechnologySuggestions"
      @update:open="showAddModal = $event"
      @update:new-tech="newTech = $event"
      @update:project-form="updateProjectForm"
      @add-technology="addTechnology"
      @remove-technology="removeTechnology"
      @save="handleSaveProject"
    />

    <ConfirmDialog
      id="portfolio-delete-project-dialog"
      v-model:open="showDeleteProjectDialog"
      :title="t('portfolioPage.deleteDialog.title')"
      :message="t('portfolioPage.deleteDialog.message')"
      :confirm-text="t('portfolioPage.deleteDialog.confirmButton')"
      :cancel-text="t('portfolioPage.deleteDialog.cancelButton')"
      variant="danger"
      focus-primary
      @confirm="handleDeleteProject"
      @cancel="clearDeleteProjectState"
    />
  </PageScaffold>
</template>
