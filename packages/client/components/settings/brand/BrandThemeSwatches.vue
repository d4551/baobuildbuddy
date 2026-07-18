<script setup lang="ts">
import { SHADOW_TOKEN_CLASS } from "~/constants/layout";
import type { BrandSettings } from "@bao/shared/types/settings-contracts";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import { useBrandPreviewStyles } from "~/composables/useBrandPreviewStyles";

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
  <SectionGrid grid-token="twoColumn" extra-class="gap-3">
    <div class="rounded-box border border-base-300 bg-base-100 p-4" :class="[SHADOW_TOKEN_CLASS.sm]">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h4 class="font-medium">{{ brandLightSwatchLabel }}</h4>
        <span class="badge badge-ghost">{{ themeNames.light }}</span>
      </div>
      <div class="brand-swatch-light h-20 rounded-box border border-base-300" :class="[SHADOW_TOKEN_CLASS.inner]"></div>
    </div>
    <div class="rounded-box border border-base-300 bg-base-100 p-4" :class="[SHADOW_TOKEN_CLASS.sm]">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h4 class="font-medium">{{ brandDarkSwatchLabel }}</h4>
        <span class="badge badge-ghost">{{ themeNames.dark }}</span>
      </div>
      <div class="brand-swatch-dark h-20 rounded-box border border-base-300" :class="[SHADOW_TOKEN_CLASS.inner]"></div>
    </div>
  </SectionGrid>
</template>
