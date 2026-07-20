<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { getErrorMessage } from "~/utils/errors";

definePageMeta({
  middleware: ["auth"],
});

const { t } = useI18n();
useSeoMeta({
  title: t("resumePage.seoTitle"),
  description: t("resumePage.seoDescription"),
});

const {
  RESUME_CREATE_DIALOG_TITLE_ID,
  RESUME_TABS,
  activeTab,
  aiEnhancementStepIndex,
  aiEnhancementStepLabels,
  clearDeleteResumeState,
  clearResumeFilters,
  completedSectionCount,
  completionPercent,
  completionQuickActions,
  createResumeTemplateOptions,
  creating,
  enhancing,
  filteredResumes,
  formData,
  handleAIEnhance,
  handleAIScore,
  handleCompletionTabSelect,
  handleCreate,
  handleDeleteResume,
  handleExport,
  handleSave,
  hasResumeFiltersApplied,
  loading,
  newResumeName,
  newResumeTemplate,
  nextRecommendedTab,
  refreshResumeBootstrap,
  requestDeleteResume,
  resumeBootstrapError,
  resumeBootstrapStatus,
  resumePageAria,
  resumePagination,
  resumePaginationSummary,
  resumeSearchQuery,
  resumeSectionCompletion,
  resumeTabAriaLabel,
  resumeTabLabel,
  resumeTemplateLabel,
  resumes,
  scoring,
  selectedResumeId,
  showCreateModal,
  showDeleteResumeDialog,
  updateEducation,
  updateExperience,
  updateGaming,
  updatePersonalInfo,
  updateProjects,
  updateSkills,
} = useResumePage();
</script>

<template>
  <PageScaffold labelled-by="resume-page-title">
    <PageHeroHeader
      title-id="resume-page-title"
      :title="t('resumePage.title')"
      :description="resumes.length > 0 || selectedResumeId ? t('resumePage.subtitle') : ''"
    >
      <template #actions>
        <!-- Empty library: EmptyState owns Create; hero keeps Guided only. -->
        <button
          v-if="resumes.length > 0 || selectedResumeId"
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('resumePage.createButtonAria')"
          @click="showCreateModal = true"
        >
          <IconPlus :class="ICON_SIZE_CLASS['4']" />
          {{ t("resumePage.createButton") }}
        </button>
        <NuxtLink
          :to="APP_ROUTES.resumeBuild"
          class="btn btn-outline"
          :class="[TOUCH_TARGET_MIN_CLASS]"
          :aria-label="t('resumePage.guidedButtonAria')"
        >
          {{ t("resumePage.guidedButton") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <BootstrapErrorAlert
      v-if="resumeBootstrapError"
      :message="getErrorMessage(resumeBootstrapError, t('resumePage.bootstrapError'))"
      :retry-label="t('resumePage.bootstrapRetry')"
      :retry-aria-label="t('resumePage.bootstrapRetryAria')"
      @retry="refreshResumeBootstrap()"
    />

    <LoadingSkeleton
      v-else-if="resumeBootstrapStatus === 'pending' || (loading && !resumes.length)"
      variant="cards"
      :lines="6"
    />

    <ResumeLibraryPanel
      v-else-if="!selectedResumeId"
      v-model:search-query="resumeSearchQuery"
      :resumes="resumes"
      :filtered-resumes="filteredResumes"
      :paginated-resumes="resumePagination.items.value"
      :has-filters-applied="hasResumeFiltersApplied"
      :summary="resumePaginationSummary"
      :current-page="resumePagination.currentPage.value"
      :total-pages="resumePagination.totalPages.value"
      :page-numbers="resumePagination.pageNumbers.value"
      :template-label="resumeTemplateLabel"
      :page-aria="resumePageAria"
      @clear-filters="clearResumeFilters"
      @create-resume="showCreateModal = true"
      @select-resume="selectedResumeId = $event"
      @request-delete="requestDeleteResume"
      @update:current-page="resumePagination.goToPage"
    />

    <!-- Resume Editor -->
    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <ResumeEditorToolbar
        :enhancing="enhancing"
        :scoring="scoring"
        @back="selectedResumeId = null"
        @enhance="handleAIEnhance"
        @score="handleAIScore"
        @export="handleExport"
        @save="handleSave"
      />

      <ResumeCompletionCard
        :completion-percent="completionPercent"
        :completed-section-count="completedSectionCount"
        :total-sections="resumeSectionCompletion.length"
        :sections="resumeSectionCompletion"
        :next-recommended-tab="nextRecommendedTab"
        :quick-actions="completionQuickActions"
        :tab-label="resumeTabLabel"
        @select-tab="handleCompletionTabSelect"
      />

      <ResumeEnhancementSteps
        v-if="enhancing"
        :step-labels="aiEnhancementStepLabels"
        :step-index="aiEnhancementStepIndex"
      />

      <ResumeTabList
        v-model:active-tab="activeTab"
        :tabs="RESUME_TABS"
        :navigation-aria="t('resumePage.tabs.tablistAria')"
        :tab-label="resumeTabLabel"
        :tab-aria-label="resumeTabAriaLabel"
      />

      <ResumeEditorPanels
        :active-tab="activeTab"
        :form-data="formData"
        @update-personal-info="updatePersonalInfo"
        @update-experience="updateExperience"
        @update-education="updateEducation"
        @update-skills="updateSkills"
        @update-projects="updateProjects"
        @update-gaming="updateGaming"
      />
    </div>

    <!-- Create Modal -->
    <AppModalFrame
      v-model:open="showCreateModal"
      :title-id="RESUME_CREATE_DIALOG_TITLE_ID"
      size-token="compact"
      :close-aria-label="t('resumePage.createModal.closeBackdropAria')"
      :close-backdrop-label="t('resumePage.createModal.closeBackdropButton')"
    >
      <h3 :id="RESUME_CREATE_DIALOG_TITLE_ID" :class="[FONT_WEIGHT_TOKEN_CLASS.bold, MARGIN_TOKEN_CLASS.mb4, TYPOGRAPHY_SCALE_CLASS.lg]">
        {{ t("resumePage.createModal.title") }}
      </h3>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.createModal.nameLegend") }}</legend>
        <input
          v-model="newResumeName"
          type="text"
          :placeholder="t('resumePage.createModal.namePlaceholder')"
          class="input" :class="[FLUID_WIDTH_CLASS]"
          :aria-label="t('resumePage.createModal.nameAria')"
        />
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.createModal.templateLegend") }}</legend>
        <select v-model="newResumeTemplate" class="select" :class="[FLUID_WIDTH_CLASS]" :aria-label="t('resumePage.createModal.templateAria')">
          <option
            v-for="templateOption in createResumeTemplateOptions"
            :key="templateOption.value"
            :value="templateOption.value"
          >
            {{ templateOption.label }}
          </option>
        </select>
      </fieldset>

      <div class="modal-action">
        <button
          class="btn btn-ghost"
          :aria-label="t('resumePage.createModal.cancelAria')"
          @click="showCreateModal = false"
        >
          {{ t("resumePage.createModal.cancelButton") }}
        </button>
        <button
          :class="[PRIMARY_ACTION_CLASS]"
          :disabled="creating || !newResumeName.trim()"
          :aria-label="t('resumePage.createModal.createAria')"
          @click="handleCreate"
        >
          <LoadingSpinner size="xs" label="Loading" v-if="creating" />
          {{ t("resumePage.createModal.createButton") }}
        </button>
      </div>
    </AppModalFrame>

    <ConfirmDialog
      id="resume-delete-dialog"
      v-model:open="showDeleteResumeDialog"
      :title="t('resumePage.deleteDialog.title')"
      :message="t('resumePage.deleteDialog.message')"
      :confirm-text="t('resumePage.deleteDialog.confirmButton')"
      :cancel-text="t('resumePage.deleteDialog.cancelButton')"
      variant="danger"
      focus-primary
      @confirm="handleDeleteResume"
      @cancel="clearDeleteResumeState"
    />
  </PageScaffold>
</template>
