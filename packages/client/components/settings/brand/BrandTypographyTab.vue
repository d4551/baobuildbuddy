<script setup lang="ts">
import {
  RESPONSIVE_PADDING_MD_P6_CLASS,
} from "~/constants/ui-layout";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const brandForm = defineModel<{
  fontStylesheetUrl: string;
  displayFontFamily: string;
  bodyFontFamily: string;
  monoFontFamily: string;
}>("brandForm", { required: true });


const BRAND_HINT_IDS = {
  fontStylesheet: "settings-brand-font-stylesheet-hint",
} as const;

const brandFieldsetClass = `fieldset min-w-0 rounded-box border border-base-300 bg-base-100 ${SHADOW_TOKEN_CLASS.sm} ${FLEX_GAP_TOKEN_CLASS.gap2} ${PADDING_TOKEN_CLASS.p4}`;

const { t } = useI18n();
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4, RESPONSIVE_PADDING_MD_P6_CLASS]">
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ t("settings.brand.tabs.typographyDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" :extra-class="FLEX_GAP_TOKEN_CLASS.gap4">
        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.fontStylesheetLegend") }}
          </legend>
          <input 
            v-model="brandForm.fontStylesheetUrl"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-describedby="BRAND_HINT_IDS.fontStylesheet"
            :placeholder="t('settings.brand.fontStylesheetPlaceholder')"
            :aria-label="t('settings.brand.fontStylesheetAria')"
          />
          <p :id="BRAND_HINT_IDS.fontStylesheet" class="label whitespace-normal">
            {{ t("settings.brand.fontStylesheetHint") }}
          </p>
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.displayFontLegend") }}
          </legend>
          <input 
            v-model="brandForm.displayFontFamily"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.brand.displayFontAria')"
          />
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.bodyFontLegend") }}
          </legend>
          <input 
            v-model="brandForm.bodyFontFamily"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.brand.bodyFontAria')"
          />
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.monoFontLegend") }}
          </legend>
          <input 
            v-model="brandForm.monoFontFamily"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.brand.monoFontAria')"
          />
        </fieldset>
      </SectionGrid>
    </div>
  </div>
</template>
