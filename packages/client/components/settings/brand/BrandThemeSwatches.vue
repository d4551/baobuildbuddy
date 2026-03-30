<script setup lang="ts">
import type { BrandSettings } from "@bao/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";

const props = defineProps<{
  brandDraft: BrandSettings;
  themeNames: { light: string; dark: string };
}>();

const { t } = useI18n();

const brandLightSwatchStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.brandDraft.lightTheme.base100} 0%, ${props.brandDraft.lightTheme.base200} 50%, ${props.brandDraft.lightTheme.primary} 100%)`,
}));

const brandDarkSwatchStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.brandDraft.darkTheme.base100} 0%, ${props.brandDraft.darkTheme.base200} 50%, ${props.brandDraft.darkTheme.primary} 100%)`,
}));

const brandLightSwatchLabel = t("settings.brand.lightThemeLegend");
const brandDarkSwatchLabel = t("settings.brand.darkThemeLegend");
</script>

<template>
  <SectionGrid grid-token="twoColumn" extra-class="gap-3">
    <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h4 class="font-medium">{{ brandLightSwatchLabel }}</h4>
        <span class="badge badge-ghost">{{ themeNames.light }}</span>
      </div>
      <div
        class="h-20 rounded-box border border-base-300/70 shadow-inner"
        :style="brandLightSwatchStyle"
      ></div>
    </div>
    <div class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h4 class="font-medium">{{ brandDarkSwatchLabel }}</h4>
        <span class="badge badge-ghost">{{ themeNames.dark }}</span>
      </div>
      <div
        class="h-20 rounded-box border border-base-300/70 shadow-inner"
        :style="brandDarkSwatchStyle"
      ></div>
    </div>
  </SectionGrid>
</template>
