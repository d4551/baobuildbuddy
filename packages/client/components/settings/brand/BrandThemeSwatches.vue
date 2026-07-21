<script setup lang="ts">
import type { BrandSettings } from "@bao/shared/types/settings-contracts";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import { useBrandPreviewStyles } from "~/composables/useBrandPreviewStyles";
import {
  BRAND_SWATCH_SURFACE_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  INSET_PANEL_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
} from "~/constants/layout";
import {
  BADGE_GHOST_CLASS,
} from "~/constants/layout-badges";

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
  <SectionGrid grid-token="twoColumn" :extra-class="FLEX_GAP_TOKEN_CLASS.gap3">
    <div :class="[INSET_PANEL_CLASS, PADDING_TOKEN_CLASS.p4, SHADOW_TOKEN_CLASS.sm]">
      <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3, MARGIN_TOKEN_CLASS.mb3]">
        <h4 class="font-medium">{{ brandLightSwatchLabel }}</h4>
        <span :class="[BADGE_GHOST_CLASS]">{{ themeNames.light }}</span>
      </div>
      <div class="brand-swatch-light rounded-box border border-base-300" :class="[BRAND_SWATCH_SURFACE_CLASS, SHADOW_TOKEN_CLASS.inner]"></div>
    </div>
    <div :class="[INSET_PANEL_CLASS, PADDING_TOKEN_CLASS.p4, SHADOW_TOKEN_CLASS.sm]">
      <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3, MARGIN_TOKEN_CLASS.mb3]">
        <h4 class="font-medium">{{ brandDarkSwatchLabel }}</h4>
        <span :class="[BADGE_GHOST_CLASS]">{{ themeNames.dark }}</span>
      </div>
      <div class="brand-swatch-dark rounded-box border border-base-300" :class="[BRAND_SWATCH_SURFACE_CLASS, SHADOW_TOKEN_CLASS.inner]"></div>
    </div>
  </SectionGrid>
</template>
