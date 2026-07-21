<script setup lang="ts">
import type { BrandSettings } from "@bao/shared/types/settings-contracts";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import { useBrandPreviewStyles } from "~/composables/useBrandPreviewStyles";
import {
  AUTH_CARD_MAX_WIDTH_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  INSET_PANEL_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_SECONDARY_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TRACKING_TOKEN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_ACCENT_LG_CLASS,
  BADGE_OUTLINE_CLASS,
  BADGE_OUTLINE_MUTED_CLASS,
  BADGE_SECONDARY_OUTLINE_CLASS,
} from "~/constants/layout-badges";
import {
  ACCENT_ACTION_CLASS,
} from "~/constants/layout-action-soft";

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
  <UiGlassCard>
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
      <div class="flex items-start justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
        <div>
          <p class="font-semibold uppercase text-muted" :class="[TRACKING_TOKEN_CLASS.widest, TYPOGRAPHY_SCALE_CLASS.xs]">
            {{ t("settings.brand.previewEyebrow") }}
          </p>
          <h3 class="card-title" :class="[MARGIN_TOKEN_CLASS.mt2]">
            {{ t("settings.brand.previewTitle") }}
          </h3>
          <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.previewSubtitle") }}
          </p>
        </div>
        <span :class="[BADGE_OUTLINE_CLASS]">{{ brandDraft.assistantName }}</span>
      </div>

      <SectionGrid grid-token="twoColumnXlGap4">
        <section class="rounded-box border" v-for="themeSurface in brandPreviewThemes" :key="themeSurface.id" :class="[SHADOW_TOKEN_CLASS.sm, themeSurface.surfaceClass, PADDING_TOKEN_CLASS.p5]" :aria-label="t('settings.brand.previewTitle')">
          <div class="flex items-center justify-between" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
            <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]">
              <img
                v-if="brandDraft.logoPath.length > 0"
                :src="brandDraft.logoPath"
                :alt="t('settings.brand.previewLogoAlt', { brand: brandDraft.name })"
                class="object-contain"
                :class="[INSET_PANEL_CLASS, SHADOW_TOKEN_CLASS.sm, ICON_SIZE_CLASS[10], PADDING_TOKEN_CLASS.p1]"
              />
              <div
                v-else
                class="flex items-center justify-center font-semibold"
                :class="[INSET_PANEL_CLASS, TYPOGRAPHY_SCALE_CLASS.sm, SHADOW_TOKEN_CLASS.sm, ICON_SIZE_CLASS[10]]"
              >
                {{ brandPreviewInitial }}
              </div>
              <div :class="[TRUNCATE_FLEX_CHILD_CLASS]">
                <p class="uppercase text-muted" :class="[TRACKING_TOKEN_CLASS.widest, TYPOGRAPHY_SCALE_CLASS.xs]">
                  {{ t("settings.brand.previewEyebrow") }}
                </p>
                <p class="truncate font-medium text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
                  {{ brandDraft.apiName }}
                </p>
              </div>
            </div>
            <span :class="[BADGE_OUTLINE_MUTED_CLASS]">
              {{ themeSurface.label }}
            </span>
          </div>

          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, MARGIN_TOKEN_CLASS.mt5]">
            <h4 class="brand-display font-semibold text-base-content" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">
              {{ brandDraft.name }}
            </h4>
            <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm, AUTH_CARD_MAX_WIDTH_CLASS]">{{ brandDraft.content.tagline }}</p>
            <p class="text-muted" :class="[TYPOGRAPHY_SCALE_CLASS.xs, AUTH_CARD_MAX_WIDTH_CLASS]">
              {{ brandDraft.content.defaultDescription }}
            </p>
          </div>

          <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap2, MARGIN_TOKEN_CLASS.mt5]">
            <span :class="[BADGE_ACCENT_LG_CLASS, SHADOW_TOKEN_CLASS.sm]">
              {{ brandDraft.assistantName }}
            </span>
            <span :class="[BADGE_SECONDARY_OUTLINE_CLASS]">
              {{ brandDraft.apiName }}
            </span>
          </div>

          <div class="flex flex-wrap" :class="[FLEX_GAP_TOKEN_CLASS.gap3, MARGIN_TOKEN_CLASS.mt6]">
            <span
              :class="[ACCENT_ACTION_CLASS, SHADOW_TOKEN_CLASS.sm]"
              aria-hidden="true"
            >
              {{ t("settings.brand.previewPrimaryAction") }}
            </span>
            <span :class="[OUTLINE_ACTION_SECONDARY_CLASS]" aria-hidden="true">
              {{ t("settings.brand.previewSecondaryAction") }}
            </span>
          </div>
        </section>
      </SectionGrid>
    </div>
  </UiGlassCard>
</template>
