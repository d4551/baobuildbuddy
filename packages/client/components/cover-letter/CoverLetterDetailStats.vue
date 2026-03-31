<script setup lang="ts">
defineProps<{
  contentCharacterCount: number;
  contentSectionCount: number;
  hasUnsavedChanges: boolean;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();
</script>

<template>
  <div class="stats stats-vertical w-full border border-base-300 bg-base-100 shadow-sm lg:stats-horizontal">
    <div class="stat">
      <div class="stat-title">{{ t("coverLetterDetailPage.stats.charactersTitle") }}</div>
      <div class="stat-value text-primary">{{ contentCharacterCount }}</div>
      <div class="stat-desc">{{ t("coverLetterDetailPage.stats.charactersDesc") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("coverLetterDetailPage.stats.sectionsTitle") }}</div>
      <div class="stat-value">{{ contentSectionCount }}</div>
      <div class="stat-desc">{{ t("coverLetterDetailPage.stats.sectionsDesc") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("coverLetterDetailPage.stats.statusTitle") }}</div>
      <div class="stat-value text-secondary">
        {{ hasUnsavedChanges ? t("coverLetterDetailPage.stats.statusUnsaved") : t("coverLetterDetailPage.stats.statusSaved") }}
      </div>
      <div class="stat-desc">{{ t("coverLetterDetailPage.stats.statusDesc") }}</div>
    </div>
  </div>
</template>
