<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, MARGIN_TOKEN_CLASS, SHADOW_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TRUNCATE_FLEX_CHILD_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import type { BrandSettings } from "@bao/shared/types/settings-contracts";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useBrandPreviewStyles } from "~/composables/useBrandPreviewStyles";
import SectionGrid from "~/components/ui/SectionGrid.vue";

type BrandPreviewTheme = "light" | "dark";

const props = defineProps<{
  brandDraft: BrandSettings;
  themeNames: { light: string; dark: string };
}>();

const { t } = useI18n();
useBrandPreviewStyles(() => props.brandDraft);

const brandPreviewInitial = computed(() => props.brandDraft.name.charAt(0).toUpperCase());
const previewFontStylesheetUrl = computed(() =>
  props.brandDraft.typography.fontStylesheetUrl.trim(),
);

useHead(() => ({
  link: previewFontStylesheetUrl.value
    ? [{ key: "brand-preview-fonts", rel: "stylesheet", href: previewFontStylesheetUrl.value }]
    : [],
}));

const brandPreviewThemes = computed<
  ReadonlyArray<{
    id: BrandPreviewTheme;
    label: string;
    surfaceClass: string;
  }>
>(() => [
  {
    id: "light",
    label: props.themeNames.light,
    surfaceClass: "brand-preview-surface-light",
  },
  {
    id: "dark",
    label: props.themeNames.dark,
    surfaceClass: "brand-preview-surface-dark",
  },
]);
</script>

<template>
  <div class="card card-border card-glass">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <div>
          <p class="font-semibold uppercase tracking-widest text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
            {{ t("settings.brand.previewEyebrow") }}
          </p>
          <h3 class="card-title" :class="[MARGIN_TOKEN_CLASS.mt2]">
            {{ t("settings.brand.previewTitle") }}
          </h3>
          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.previewSubtitle") }}
          </p>
        </div>
        <span class="badge badge-outline">{{ brandDraft.assistantName }}</span>
      </div>

      <SectionGrid grid-token="twoColumnXlGap4">
        <section
          v-for="themeSurface in brandPreviewThemes"
          :key="themeSurface.id"
          class="rounded-box border p-5" :class="[SHADOW_TOKEN_CLASS.sm, themeSurface.surfaceClass]"
          :aria-label="t('settings.brand.previewTitle')"
        >
          <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
              <img
                v-if="brandDraft.logoPath.length > 0"
                :src="brandDraft.logoPath"
                :alt="t('settings.brand.previewLogoAlt', { brand: brandDraft.name })"
                class="h-10 w-10 rounded-box border border-base-300 bg-base-100 object-contain p-1" :class="[SHADOW_TOKEN_CLASS.sm]"
              />
              <div
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-box border border-base-300 bg-base-100 font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm, SHADOW_TOKEN_CLASS.sm]"
              >
                {{ brandPreviewInitial }}
              </div>
              <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
                <p class="uppercase tracking-widest text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
                  {{ t("settings.brand.previewEyebrow") }}
                </p>
                <p class="truncate font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{ brandDraft.apiName }}
                </p>
              </div>
            </div>
            <span class="badge badge-outline border-current/20 text-current/80">
              {{ themeSurface.label }}
            </span>
          </div>

          <div class="mt-5" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2]">
            <h4 class="brand-display font-semibold text-base-content" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">
              {{ brandDraft.name }}
            </h4>
            <p class="max-w-md text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ brandDraft.content.tagline }}</p>
            <p class="max-w-md text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">
              {{ brandDraft.content.defaultDescription }}
            </p>
          </div>

          <div class="mt-5 flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
            <span class="badge badge-accent badge-lg border-0" :class="[SHADOW_TOKEN_CLASS.sm]">
              {{ brandDraft.assistantName }}
            </span>
            <span class="badge badge-secondary badge-outline">
              {{ brandDraft.apiName }}
            </span>
          </div>

          <div class="mt-6 flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <span class="btn btn-accent border-0" :class="[SHADOW_TOKEN_CLASS.sm]">
              {{ t("settings.brand.previewPrimaryAction") }}
            </span>
            <span class="btn btn-secondary btn-outline">
              {{ t("settings.brand.previewSecondaryAction") }}
            </span>
          </div>
        </section>
      </SectionGrid>
    </div>
  </div>
</template>
