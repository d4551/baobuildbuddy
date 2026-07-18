<script setup lang="ts">
import { FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS } from "~/constants/layout";

defineProps<{
  contentCharacterCount: number;
  contentSectionCount: number;
  hasUnsavedChanges: boolean;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();
</script>

<template>
  <div class="stats stats-vertical border border-base-300 bg-base-100 lg:stats-horizontal" :class="[FLUID_WIDTH_CLASS, SHADOW_TOKEN_CLASS.sm]">
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
