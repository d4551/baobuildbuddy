<script setup lang="ts">
import { useI18n } from "vue-i18n";

const STUDIOS_PREVIEW_DIALOG_TITLE_ID = "studios-index-preview-dialog-title";
const { t } = useI18n();
const page = useStudiosIndexPage();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("studiosIndex.seoTitle"),
    description: t("studiosIndex.seoDescription"),
  });
}
</script>

<template>
  <PageScaffold labelled-by="studios-index-title">
    <PageHeroHeader
      title-id="studios-index-title"
      :title="t('studiosIndex.title')"
      :description="t('studiosIndex.subtitle')"
      description-class="text-base-content/70"
      density="comfortable"
    />

    <StatsRow
      background-class="border border-base-300 bg-base-100"
      :stats="[
        { titleKey: 'studiosIndex.stats.totalTitle', value: page.totalStudios.value, valueClass: 'text-primary', descKey: 'studiosIndex.stats.totalDesc' },
        { titleKey: 'studiosIndex.stats.filteredTitle', value: page.filteredStudios.value.length, valueClass: 'text-secondary', descKey: 'studiosIndex.stats.filteredDesc' },
        { titleKey: 'studiosIndex.stats.remoteTitle', value: page.remoteFriendlyStudios.value, valueClass: 'text-accent', descKey: 'studiosIndex.stats.remoteDesc' },
      ]"
    />

    <BootstrapErrorAlert
      v-if="page.pageError.value"
      :title="t('studiosIndex.errorTitle')"
      :message="page.pageError.value"
      :retry-label="t('studiosIndex.retryButton')"
      :retry-aria-label="t('studiosIndex.retryAria')"
      @retry="() => page.refreshStudios()"
    />

    <StudiosIndexFiltersCard
      v-model:search-query="page.searchQuery.value"
      v-model:selected-type="page.filters.type"
      v-model:selected-size="page.filters.size"
      v-model:remote-work="page.filters.remoteWork"
      :studio-type-options="page.studioTypeOptions.value"
      :studio-size-options="page.studioSizeOptions.value"
      @clear="page.clearFilters"
    />

    <LoadingSkeleton v-if="page.loading.value && page.filteredStudios.value.length === 0" :lines="6" />

    <EmptyState
      v-else-if="page.filteredStudios.value.length === 0"
      title-key="studiosIndex.emptyTitle"
      description-key="studiosIndex.emptyDescription"
    />

    <StudiosIndexGrid
      v-else
      :studios="page.visibleStudios.value"
      :has-additional-studios="page.hasAdditionalStudios.value"
      @load-more="page.showMoreStudios"
      @preview="page.openStudioPreview"
      @view="page.viewStudio"
    />

    <StudiosPreviewModal
      v-model:open="page.showPreviewModal.value"
      :studio="page.previewStudio.value"
      :title-id="STUDIOS_PREVIEW_DIALOG_TITLE_ID"
      @close="page.closeStudioPreview"
      @start-interview="page.startInterview"
      @open-detail="page.viewStudio"
    />
  </PageScaffold>
</template>
