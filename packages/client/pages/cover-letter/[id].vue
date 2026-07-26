<script setup lang="ts">
import {
  ICON_SIZE_CLASS,
  OUTLINE_ACTION_CLASS,
  PAGE_HEADER_DESCRIPTION_MEASURE_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
} from "~/constants/layout";

definePageMeta({
  middleware: ["auth"],
});

const {
  t,
  loading,
  formData,
  regenerating,
  showRegenerateDialog,
  breadcrumbs,
  heroTitle,
  heroDescription,
  contentCharacterCount,
  contentSectionCount,
  hasUnsavedChanges,
  templateLabel,
  requestRegenerate,
  handleSave,
  handleRegenerate,
  clearContent,
  handleExport,
  scheduleCoverLetterAutosave,
} = useCoverLetterDetailPage();

useSeoMeta({
  title: t("coverLetterDetailPage.details.title"),
  description: t("coverLetterPage.subtitle"),
});
</script>

<template>
  <PageScaffold width-token="wide" spacing-token="comfortable" labelled-by="cover-letter-detail-title">
    <PageHeroHeader
      title-id="cover-letter-detail-title"
      :title="heroTitle"
      :description="heroDescription"
      :description-class="PAGE_HEADER_DESCRIPTION_MEASURE_CLASS"
    >
      <template #breadcrumbs>
        <AppBreadcrumbs :crumbs="breadcrumbs" />
      </template>
      <template #actions>
        <button type="button"
          :class="[OUTLINE_ACTION_CLASS]"
          :disabled="regenerating"
          :aria-label="t('coverLetterDetailPage.actions.regenerateAria')"
          @click="requestRegenerate"
        >
          <LoadingSpinner size="xs" label="Loading" v-if="regenerating" />
          <IconRefresh v-else :class="ICON_SIZE_CLASS['4']" />
          {{ t("coverLetterDetailPage.actions.regenerateButton") }}
        </button>

        <AppExportMenu
          :button-label="t('coverLetterDetailPage.actions.exportButton')"
          :button-aria-label="t('coverLetterDetailPage.actions.exportAria')"
          :disabled="loading"
          :summary-class="OUTLINE_ACTION_CLASS"
          @export="handleExport"
        />

        <button type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :disabled="!hasUnsavedChanges"
          :aria-label="t('coverLetterDetailPage.actions.saveAria')"
          @click="handleSave"
        >
          {{ t("coverLetterDetailPage.actions.saveButton") }}
        </button>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="loading" :lines="10" />

    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <CoverLetterDetailStats
        :content-character-count="contentCharacterCount"
        :content-section-count="contentSectionCount"
        :has-unsaved-changes="hasUnsavedChanges"
        :t="t"
      />

      <CoverLetterDetailFormCard v-model:form-data="formData" :template-label="templateLabel" :t="t" />

      <CoverLetterEditorCard
        v-model:content-text="formData.contentText"
        :content-character-count="contentCharacterCount"
        :is-dirty="hasUnsavedChanges"
        :t="t"
        @clear="clearContent"
        @save="handleSave"
        @edited="scheduleCoverLetterAutosave"
      />
    </div>

    <ConfirmDialog
      id="cover-letter-regenerate-dialog"
      v-model:open="showRegenerateDialog"
      :title="t('coverLetterDetailPage.regenerateDialog.title')"
      :message="t('coverLetterDetailPage.regenerateDialog.message')"
      :confirm-text="t('coverLetterDetailPage.regenerateDialog.confirmButton')"
      :cancel-text="t('coverLetterDetailPage.regenerateDialog.cancelButton')"
      @confirm="handleRegenerate"
      @cancel="showRegenerateDialog = false"
    />
  </PageScaffold>
</template>
