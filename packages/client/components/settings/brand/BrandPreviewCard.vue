<script setup lang="ts">
import type { BrandSettings } from "@bao/shared/types/settings-contracts";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

type BrandPreviewTheme = "light" | "dark";
type BrandPreviewPalette = BrandSettings["lightTheme"];

const props = defineProps<{
  brandDraft: BrandSettings;
  themeNames: { light: string; dark: string };
}>();

const { t } = useI18n();

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
    palette: BrandPreviewPalette;
  }>
>(() => [
  {
    id: "light",
    label: props.themeNames.light,
    palette: props.brandDraft.lightTheme,
  },
  {
    id: "dark",
    label: props.themeNames.dark,
    palette: props.brandDraft.darkTheme,
  },
]);

const createPreviewSurfaceStyle = (palette: BrandPreviewPalette) => ({
  "--color-base-100": palette.base100,
  "--color-base-200": palette.base200,
  "--color-base-300": palette.base300,
  "--color-base-content": palette.baseContent,
  "--color-primary": palette.primary,
  "--color-primary-content": palette.primaryContent,
  "--color-secondary": palette.secondary,
  "--color-secondary-content": palette.secondaryContent,
  "--color-accent": palette.accent,
  "--color-accent-content": palette.accentContent,
  "--color-neutral": palette.neutral,
  "--color-neutral-content": palette.neutralContent,
  "--color-info": palette.info,
  "--color-info-content": palette.infoContent,
  "--color-success": palette.success,
  "--color-success-content": palette.successContent,
  "--color-warning": palette.warning,
  "--color-warning-content": palette.warningContent,
  "--color-error": palette.error,
  "--color-error-content": palette.errorContent,
  "--radius-selector": palette.radiusSelector,
  "--radius-field": palette.radiusField,
  "--radius-box": palette.radiusBox,
  "--size-selector": palette.sizeSelector,
  "--size-field": palette.sizeField,
  "--border": palette.border,
  "--depth": palette.depth,
  "--noise": palette.noise,
  "--brand-font-display": props.brandDraft.typography.displayFontFamily,
  "--brand-font-body": props.brandDraft.typography.bodyFontFamily,
  "--brand-font-mono": props.brandDraft.typography.monoFontFamily,
  backgroundColor: palette.base100,
  borderColor: `color-mix(in srgb, ${palette.secondary} 24%, ${palette.base100})`,
  color: palette.baseContent,
  fontFamily: "var(--brand-font-body)",
});
</script>

<template>
  <div class="card card-border bg-base-200/30 shadow-sm">
    <div class="card-body gap-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-base-content/45">
            {{ t("settings.brand.previewEyebrow") }}
          </p>
          <h3 class="card-title mt-2">
            {{ t("settings.brand.previewTitle") }}
          </h3>
          <p class="text-sm text-base-content/70">
            {{ t("settings.brand.previewSubtitle") }}
          </p>
        </div>
        <span class="badge badge-outline">{{ brandDraft.assistantName }}</span>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <section
          v-for="themeSurface in brandPreviewThemes"
          :key="themeSurface.id"
          class="rounded-box border p-5 shadow-sm"
          :style="createPreviewSurfaceStyle(themeSurface.palette)"
          :aria-label="t('settings.brand.previewTitle')"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <img
                v-if="brandDraft.logoPath.length > 0"
                :src="brandDraft.logoPath"
                :alt="t('settings.brand.previewLogoAlt', { brand: brandDraft.name })"
                class="h-10 w-10 rounded-box border border-base-300/40 bg-base-100/80 object-contain p-1 shadow-sm"
              />
              <div
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-box border border-base-300/40 bg-base-100/80 text-sm font-semibold shadow-sm"
              >
                {{ brandPreviewInitial }}
              </div>
              <div class="min-w-0">
                <p class="text-xs uppercase tracking-widest text-base-content/60">
                  {{ t("settings.brand.previewEyebrow") }}
                </p>
                <p class="truncate text-sm font-medium text-base-content/80">
                  {{ brandDraft.apiName }}
                </p>
              </div>
            </div>
            <span class="badge badge-outline border-current/20 text-current/80">
              {{ themeSurface.label }}
            </span>
          </div>

          <div class="mt-5 space-y-2">
            <h4 class="brand-display text-2xl font-semibold text-base-content">
              {{ brandDraft.name }}
            </h4>
            <p class="max-w-md text-sm text-base-content/80">{{ brandDraft.content.tagline }}</p>
            <p class="max-w-md text-xs text-base-content/60">
              {{ brandDraft.content.defaultDescription }}
            </p>
          </div>

          <div class="mt-5 flex flex-wrap gap-2">
            <span class="badge badge-accent badge-lg border-0 shadow-sm">
              {{ brandDraft.assistantName }}
            </span>
            <span class="badge badge-secondary badge-outline">
              {{ brandDraft.apiName }}
            </span>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <span class="btn btn-accent border-0 shadow-sm">
              {{ t("settings.brand.previewPrimaryAction") }}
            </span>
            <span class="btn btn-secondary btn-outline">
              {{ t("settings.brand.previewSecondaryAction") }}
            </span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
