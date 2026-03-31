<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("portfolioPage.title"),
    description: t("portfolioPage.subtitle"),
  });
}

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
  newTech,
  openAddModal,
  openEditModal,
  portfolio,
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
} = usePortfolioPage();

function updatePortfolioForm(value: typeof portfolioForm): void {
  Object.assign(portfolioForm, value);
}

function updateProjectForm(value: typeof projectForm): void {
  Object.assign(projectForm, value);
}
</script>

<template>
  <PageScaffold width-token="wide" spacing-token="comfortable">
    <PageHeroHeader
      title-id="portfolio-page-title"
      :title="t('portfolioPage.title')"
      :description="t('portfolioPage.subtitle')"
      description-class="max-w-2xl text-base-content/70"
    >
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.portfolioPreview"
          class="btn btn-outline"
          :aria-label="t('portfolioPage.actions.previewAria')"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {{ t("portfolioPage.actions.previewButton") }}
        </NuxtLink>

        <button
          class="btn btn-primary"
          :aria-label="t('portfolioPage.actions.exportAria')"
          @click="handleExport"
        >
          {{ t("portfolioPage.actions.exportButton") }}
        </button>
      </template>
      <template #aside>
        <StatsRow
          class="mt-4"
          :stats="[
            { titleKey: 'portfolioPage.stats.projectsTitle', value: projects.length, valueClass: 'text-primary', descKey: 'portfolioPage.stats.projectsDesc' },
            { titleKey: 'portfolioPage.stats.featuredTitle', value: featuredProjectCount, valueClass: 'text-secondary', descKey: 'portfolioPage.stats.featuredDesc' },
            { titleKey: 'portfolioPage.stats.profileTitle', value: hasMetadata ? t('portfolioPage.stats.profileReady') : t('portfolioPage.stats.profileMissing'), descKey: 'portfolioPage.stats.profileDesc' },
          ]"
        />
      </template>
    </PageHeroHeader>

    <section class="card card-border bg-base-100">
      <div class="card-body">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <fieldset class="fieldset lg:col-span-2">
            <legend class="fieldset-legend">{{ t("portfolioPage.filters.searchLegend") }}</legend>
            <input
              v-model="searchQuery"
              type="search"
              class="input w-full"
              :placeholder="t('portfolioPage.filters.searchPlaceholder')"
              :aria-label="t('portfolioPage.filters.searchAria')"
            />
          </fieldset>
        </div>

        <div v-if="hasFiltersApplied" class="card-actions justify-end">
          <button class="btn btn-sm btn-ghost" :aria-label="t('portfolioPage.filters.clearAria')" @click="clearFilters">
            {{ t("portfolioPage.filters.clearButton") }}
          </button>
        </div>
      </div>
    </section>

    <LoadingSkeleton v-if="loading && !portfolio" :lines="8" />

    <div v-else class="space-y-6">
      <PortfolioProfileCard
        :portfolio-form="portfolioForm"
        @update:portfolio-form="updatePortfolioForm"
        @save="handleSavePortfolio"
      />

      <PortfolioProjectsCard
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
