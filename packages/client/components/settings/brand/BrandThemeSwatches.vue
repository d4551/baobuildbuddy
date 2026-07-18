<script setup lang="ts">
import {  ICON_SIZE_CLASS, FLEX_GAP_TOKEN_CLASS, PADDING_TOKEN_CLASS, SHADOW_TOKEN_CLASS } from "~/constants/layout";
import type { BrandSettings } from "@bao/shared/types/settings-contracts";
import {  ICON_SIZE_CLASS, useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {  ICON_SIZE_CLASS, useBrandPreviewStyles } from "~/composables/useBrandPreviewStyles";

const props = defineProps<{
  brandDraft: BrandSettings;
  themeNames: { light: string; dark: string };
}>();

const { t } = useI18n();
useBrandPreviewStyles(() => props.brandDraft);

const brandLightSwatchLabel = t("settings.brand.lightThemeLegend");
const brandDarkSwatchLabel = t("settings.brand.darkThemeLegend");
</script>

<template>
  <SectionGrid grid-token="twoColumn" :extra-class="[FLEX_GAP_TOKEN_CLASS.gap3]">
    <div class="rounded-box border border-base-300 bg-base-100" :class="[PADDING_TOKEN_CLASS.p4, SHADOW_TOKEN_CLASS.sm]">
      <div class="mb-3 flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <h4 class="font-medium">{{ brandLightSwatchLabel }}</h4>
        <span class="badge badge-ghost">{{ themeNames.light }}</span>
      </div>
      <div class="brand-swatch-light overflow-hidden rounded-box border border-base-300" :class="[ICON_SIZE_CLASS['20'], SHADOW_TOKEN_CLASS.inner]"></div>
    </div>
    <div class="rounded-box border border-base-300 bg-base-100" :class="[PADDING_TOKEN_CLASS.p4, SHADOW_TOKEN_CLASS.sm]">
      <div class="mb-3 flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <h4 class="font-medium">{{ brandDarkSwatchLabel }}</h4>
        <span class="badge badge-ghost">{{ themeNames.dark }}</span>
      </div>
      <div class="brand-swatch-dark overflow-hidden rounded-box border border-base-300" :class="[ICON_SIZE_CLASS['20'], SHADOW_TOKEN_CLASS.inner]"></div>
    </div>
  </SectionGrid>
</template>
