<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";

const BRAND_HINT_IDS = {
  fontStylesheet: "settings-brand-font-stylesheet-hint",
} as const;

const brandFieldsetClass =
  "fieldset min-w-0 gap-2 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm";

const { t } = useI18n();

const brandForm = defineModel<{
  fontStylesheetUrl: string;
  displayFontFamily: string;
  bodyFontFamily: string;
  monoFontFamily: string;
}>("brandForm", { required: true });
</script>

<template>
  <div class="card card-border bg-base-100 shadow-sm">
    <div class="card-body gap-4 p-4 md:p-6">
      <p class="text-sm text-secondary">
        {{ t("settings.brand.tabs.typographyDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" extra-class="gap-4">
        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.fontStylesheetLegend") }}
          </legend>
          <input
            v-model="brandForm.fontStylesheetUrl"
            class="input min-w-0 w-full"
            :aria-describedby="BRAND_HINT_IDS.fontStylesheet"
            :placeholder="t('settings.brand.fontStylesheetPlaceholder')"
            :aria-label="t('settings.brand.fontStylesheetAria')"
          />
          <p :id="BRAND_HINT_IDS.fontStylesheet" class="label whitespace-normal">
            {{ t("settings.brand.fontStylesheetHint") }}
          </p>
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.displayFontLegend") }}
          </legend>
          <input
            v-model="brandForm.displayFontFamily"
            class="input min-w-0 w-full"
            :aria-label="t('settings.brand.displayFontAria')"
          />
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.bodyFontLegend") }}
          </legend>
          <input
            v-model="brandForm.bodyFontFamily"
            class="input min-w-0 w-full"
            :aria-label="t('settings.brand.bodyFontAria')"
          />
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.monoFontLegend") }}
          </legend>
          <input
            v-model="brandForm.monoFontFamily"
            class="input min-w-0 w-full"
            :aria-label="t('settings.brand.monoFontAria')"
          />
        </fieldset>
      </SectionGrid>
    </div>
  </div>
</template>
