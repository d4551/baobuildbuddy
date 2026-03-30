<script setup lang="ts">
import type { BrandSettings } from "@bao/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  brandDraft: BrandSettings;
}>();

const { t } = useI18n();

const brandPreviewInitial = computed(() => props.brandDraft.name.charAt(0).toUpperCase());

const brandPreviewShellStyle = computed(() => ({
  backgroundColor: props.brandDraft.lightTheme.base100,
  color: props.brandDraft.lightTheme.baseContent,
}));

const brandPreviewHeadingStyle = computed<Record<string, string>>(() => ({
  fontFamily: props.brandDraft.typography.displayFontFamily,
}));

const brandPreviewPrimaryBadgeStyle = computed<Record<string, string>>(() => ({
  backgroundColor: props.brandDraft.lightTheme.primary,
  color: props.brandDraft.lightTheme.primaryContent,
}));

const brandPreviewSecondaryBadgeStyle = computed<Record<string, string>>(() => ({
  borderColor: props.brandDraft.lightTheme.secondary,
  color: props.brandDraft.lightTheme.secondary,
}));

const brandPreviewPrimaryActionStyle = computed<Record<string, string>>(() => ({
  backgroundColor: props.brandDraft.lightTheme.accent,
  color: props.brandDraft.lightTheme.accentContent,
}));

const brandPreviewSecondaryActionStyle = computed<Record<string, string>>(() => ({
  borderColor: props.brandDraft.lightTheme.secondary,
  color: props.brandDraft.lightTheme.secondary,
}));
</script>

<template>
  <div class="card card-border bg-base-200/30 shadow-sm">
    <div class="card-body gap-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-base-content/45">
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

      <div
        class="rounded-box border border-base-300/60 p-5 shadow-sm"
        :style="brandPreviewShellStyle"
      >
        <div class="flex items-center gap-3">
          <img
            v-if="brandDraft.logoPath.length > 0"
            :src="brandDraft.logoPath"
            :alt="t('settings.brand.previewLogoAlt', { brand: brandDraft.name })"
            class="h-10 w-10 rounded-box border border-white/20 bg-white/80 object-contain p-1 shadow-sm"
          />
          <div
            v-else
            class="flex h-10 w-10 items-center justify-center rounded-box border border-white/20 bg-white/80 text-sm font-semibold shadow-sm"
          >
            {{ brandPreviewInitial }}
          </div>
          <div class="min-w-0">
            <p class="text-xs uppercase tracking-[0.2em] opacity-60">
              {{ t("settings.brand.previewEyebrow") }}
            </p>
            <p class="truncate text-sm font-medium opacity-80">
              {{ brandDraft.apiName }}
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-2">
          <h4 class="text-2xl font-semibold" :style="brandPreviewHeadingStyle">
            {{ brandDraft.name }}
          </h4>
          <p class="max-w-md text-sm opacity-80">{{ brandDraft.content.tagline }}</p>
          <p class="max-w-md text-xs text-base-content/60">
            {{ brandDraft.content.defaultDescription }}
          </p>
        </div>

        <div class="mt-5 flex flex-wrap gap-2">
          <span
            class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm"
            :style="brandPreviewPrimaryBadgeStyle"
          >
            {{ brandDraft.assistantName }}
          </span>
          <span
            class="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
            :style="brandPreviewSecondaryBadgeStyle"
          >
            {{ brandDraft.apiName }}
          </span>
        </div>

        <div class="mt-6 flex flex-wrap gap-3">
          <span
            class="inline-flex items-center rounded-field px-4 py-2 text-sm font-medium shadow-sm"
            :style="brandPreviewPrimaryActionStyle"
          >
            {{ t("settings.brand.previewPrimaryAction") }}
          </span>
          <span
            class="inline-flex items-center rounded-field border px-4 py-2 text-sm font-medium"
            :style="brandPreviewSecondaryActionStyle"
          >
            {{ t("settings.brand.previewSecondaryAction") }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
