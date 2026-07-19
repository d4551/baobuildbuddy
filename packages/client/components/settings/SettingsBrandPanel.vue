<script setup lang="ts">
import type { BrandSettings } from "@bao/shared/types/settings-contracts";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  ICON_SIZE_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import BrandContentTab from "./brand/BrandContentTab.vue";
import BrandIdentityTab from "./brand/BrandIdentityTab.vue";
import BrandPreviewCard from "./brand/BrandPreviewCard.vue";
import BrandStatsCard from "./brand/BrandStatsCard.vue";
import BrandThemeSwatches from "./brand/BrandThemeSwatches.vue";
import BrandThemesTab from "./brand/BrandThemesTab.vue";
import BrandTypographyTab from "./brand/BrandTypographyTab.vue";
import SettingsPanelHeader from "./SettingsPanelHeader.vue";
import { getSaveStateBadgeClass, getSaveStateLabelKey, type SaveState } from "./save-state";

type BrandEditorPanel = "identity" | "typography" | "themes" | "content";

const BRAND_EDITOR_PANELS = [
  { id: "identity", labelKey: "settings.brand.tabs.identity" },
  { id: "typography", labelKey: "settings.brand.tabs.typography" },
  { id: "themes", labelKey: "settings.brand.tabs.themes" },
  { id: "content", labelKey: "settings.brand.tabs.content" },
] as const;

const BRAND_HINT_IDS = {
  logoPath: "settings-brand-logo-path-hint",
  faviconPath: "settings-brand-favicon-path-hint",
  fontStylesheet: "settings-brand-font-stylesheet-hint",
  lightTheme: "settings-brand-light-theme-hint",
  darkTheme: "settings-brand-dark-theme-hint",
  contentOverrides: "settings-brand-content-overrides-hint",
} as const;

const props = defineProps<{
  brandSaveState: SaveState;
  brandDraft: BrandSettings;
  brandOverrideCount: number;
  languageOptionsCount: number;
  themeNames: { light: string; dark: string };
}>();

const emit = defineEmits<{
  save: [];
}>();

const { t } = useI18n();
const brandEditorPanel = defineModel<BrandEditorPanel>("activePanel", {
  default: "identity",
});
const brandForm = defineModel<{
  name: string;
  assistantName: string;
  apiName: string;
  logoPath: string;
  faviconPath: string;
  fontStylesheetUrl: string;
  displayFontFamily: string;
  bodyFontFamily: string;
  monoFontFamily: string;
  tagline: string;
  defaultTitle: string;
  defaultDescription: string;
  lightThemeJson: string;
  darkThemeJson: string;
  contentOverridesJson: string;
}>("brandForm", { required: true });
const brandSaveStateLabel = computed(() => {
  const key = getSaveStateLabelKey(props.brandSaveState);
  return key ? t(key) : "";
});

function focusBrandEditorTab(panel: BrandEditorPanel): void {
  if (!import.meta.client) return;

  requestAnimationFrame(() => {
    document.getElementById(`brand-tab-${panel}`)?.focus();
  });
}

function setBrandEditorPanel(panel: BrandEditorPanel, options?: { focusTab?: boolean }): void {
  brandEditorPanel.value = panel;
  if (options?.focusTab) {
    focusBrandEditorTab(panel);
  }
}

function handleBrandTabKeydown(event: KeyboardEvent, panel: BrandEditorPanel): void {
  const panels = BRAND_EDITOR_PANELS.map((p) => p.id);
  const idx = panels.indexOf(panel);
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    const next = panels[(idx + 1) % panels.length];
    setBrandEditorPanel(next, { focusTab: true });
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    const prev = panels[(idx - 1 + panels.length) % panels.length];
    setBrandEditorPanel(prev, { focusTab: true });
  } else if (event.key === "Home") {
    event.preventDefault();
    const first = panels[0];
    if (first) {
      setBrandEditorPanel(first, { focusTab: true });
    }
  } else if (event.key === "End") {
    event.preventDefault();
    const last = panels[panels.length - 1];
    if (last) {
      setBrandEditorPanel(last, { focusTab: true });
    }
  }
}
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap6]">
      <SettingsPanelHeader
        :title="t('settings.brand.title')"
        :description="t('settings.brand.subtitle')"
      >
        <template #meta>
          <span
            class="badge"
            :class="getSaveStateBadgeClass(brandSaveState)"
            role="status"
            aria-live="polite"
          >
            {{ brandSaveStateLabel }}
          </span>
        </template>
      </SettingsPanelHeader>

      <div role="alert" class="alert alert-info alert-soft">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="shrink-0 stroke-current" :class="[ICON_SIZE_CLASS['6']]"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            :stroke-width="SVG_STROKE_WIDTH_DEFAULT"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <h3 class="font-semibold">{{ t("settings.brand.infoTitle") }}</h3>
          <p :class="[TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("settings.brand.infoDescription") }}</p>
        </div>
      </div>

      <SectionGrid grid-token="twoColumnWide" extra-class="items-start" :class="[FLEX_GAP_TOKEN_CLASS.gap6]">
        <div class="xl:sticky xl:top-24" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <BrandPreviewCard :brand-draft="brandDraft" :theme-names="themeNames" />
          <BrandStatsCard
            :brand-draft="brandDraft"
            :language-options-count="languageOptionsCount"
            :brand-override-count="brandOverrideCount"
          />
          <BrandThemeSwatches :brand-draft="brandDraft" :theme-names="themeNames" />
        </div>

        <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
          <div
            role="tablist"
            class="tabs tabs-border tabs-sm overflow-x-auto whitespace-nowrap md:tabs-md" :class="[FLEX_GAP_TOKEN_CLASS.gap2]"
            :aria-label="t('settings.brand.editorTabsAria')"
          >
            <button
              v-for="panel in BRAND_EDITOR_PANELS"
              :id="`brand-tab-${panel.id}`"
              :key="panel.id"
              type="button"
              role="tab"
              class="tab"
              :class="{ 'tab-active': brandEditorPanel === panel.id }"
              :aria-label="t(panel.labelKey)"
              :aria-selected="brandEditorPanel === panel.id"
              :aria-controls="`brand-panel-${panel.id}`"
              :tabindex="brandEditorPanel === panel.id ? 0 : -1"
              @click="setBrandEditorPanel(panel.id)"
              @keydown="handleBrandTabKeydown($event, panel.id)"
            >
              {{ t(panel.labelKey) }}
            </button>
          </div>

          <div
            v-show="brandEditorPanel === 'identity'"
            id="brand-panel-identity"
            role="tabpanel"
            aria-labelledby="brand-tab-identity"
            :aria-hidden="brandEditorPanel !== 'identity'"
          >
            <BrandIdentityTab v-model:brand-form="brandForm" />
          </div>

          <div
            v-show="brandEditorPanel === 'typography'"
            id="brand-panel-typography"
            role="tabpanel"
            aria-labelledby="brand-tab-typography"
            :aria-hidden="brandEditorPanel !== 'typography'"
          >
            <BrandTypographyTab v-model:brand-form="brandForm" />
          </div>

          <div
            v-show="brandEditorPanel === 'themes'"
            id="brand-panel-themes"
            role="tabpanel"
            aria-labelledby="brand-tab-themes"
            :aria-hidden="brandEditorPanel !== 'themes'"
          >
            <BrandThemesTab
              v-model:brand-form="brandForm"
              :hint-ids="{ lightTheme: BRAND_HINT_IDS.lightTheme, darkTheme: BRAND_HINT_IDS.darkTheme }"
            />
          </div>

          <div
            v-show="brandEditorPanel === 'content'"
            id="brand-panel-content"
            role="tabpanel"
            aria-labelledby="brand-tab-content"
            :aria-hidden="brandEditorPanel !== 'content'"
          >
            <BrandContentTab
              v-model:brand-form="brandForm"
              :hint-ids="{ contentOverrides: BRAND_HINT_IDS.contentOverrides }"
            />
          </div>

          <div class="card-actions justify-end" :class="[PADDING_TOKEN_CLASS.pt2]">
            <button
              class="btn btn-primary"
              :aria-label="t('settings.brand.saveAria')"
              :disabled="brandSaveState === 'saving'"
              @click="emit('save')"
            >
              <LoadingSpinner
                v-if="brandSaveState === 'saving'"
                size="xs"
                :label="t('settings.brand.saveButton')"
              />
              {{ t("settings.brand.saveButton") }}
            </button>
          </div>
        </div>
      </SectionGrid>
    </div>
  </div>
</template>
