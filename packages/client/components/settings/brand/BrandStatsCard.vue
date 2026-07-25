<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  SHADOW_TOKEN_CLASS,
  STATS_SHELL_VARIANT_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

defineProps<{
  brandDraft: BrandSettings;
  languageOptionsCount: number;
  brandOverrideCount: number;
}>();

const { t } = useI18n();
</script>

<template>
  <div :class="[STATS_SHELL_VARIANT_CLASS.brandResponsive, SHADOW_TOKEN_CLASS.sm]">
    <div class="stat">
      <div class="stat-title">{{ t("settings.brand.stats.product") }}</div>
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ brandDraft.name }}</div>
      <div class="stat-desc">{{ t("settings.brand.stats.productDescription") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("settings.brand.stats.assistant") }}</div>
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ brandDraft.assistantName }}</div>
      <div class="stat-desc">{{ t("settings.brand.stats.assistantDescription") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("settings.brand.stats.locales") }}</div>
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ languageOptionsCount }}</div>
      <div class="stat-desc">{{ t("settings.brand.stats.localesDescription") }}</div>
    </div>
    <div class="stat">
      <div class="stat-title">{{ t("settings.brand.stats.overrides") }}</div>
      <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ brandOverrideCount }}</div>
      <div class="stat-desc">{{ t("settings.brand.stats.overridesDescription") }}</div>
    </div>
  </div>
</template>
