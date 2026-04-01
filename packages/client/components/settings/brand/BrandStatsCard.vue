<script setup lang="ts">
import { useI18n } from "vue-i18n";

defineProps<{
  brandDraft: BrandSettings;
  languageOptionsCount: number;
  brandOverrideCount: number;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="stats stats-vertical border border-base-300 bg-base-100 shadow-sm sm:stats-horizontal xl:stats-vertical">
    <div class="stat">
      <div class="stat-title">{{ t("settings.brand.stats.product") }}</div>
      <div class="stat-value text-lg">{{ brandDraft.name }}</div>
      <div class="stat-desc">{{ t("settings.brand.stats.productDescription") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("settings.brand.stats.assistant") }}</div>
      <div class="stat-value text-lg">{{ brandDraft.assistantName }}</div>
      <div class="stat-desc">{{ t("settings.brand.stats.assistantDescription") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("settings.brand.stats.locales") }}</div>
      <div class="stat-value text-lg">{{ languageOptionsCount }}</div>
      <div class="stat-desc">{{ t("settings.brand.stats.localesDescription") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("settings.brand.stats.overrides") }}</div>
      <div class="stat-value text-lg">{{ brandOverrideCount }}</div>
      <div class="stat-desc">{{ t("settings.brand.stats.overridesDescription") }}</div>
    </div>
  </div>
</template>
