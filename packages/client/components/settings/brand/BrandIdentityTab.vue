<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, FLUID_WIDTH_CLASS, PADDING_TOKEN_CLASS, SHADOW_TOKEN_CLASS, TRUNCATE_FLEX_CHILD_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";

const BRAND_HINT_IDS = {
  logoPath: "settings-brand-logo-path-hint",
  faviconPath: "settings-brand-favicon-path-hint",
} as const;

const brandFieldsetClass =
  "fieldset min-w-0 gap-2 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm";

const { t } = useI18n();

const brandForm = defineModel<{
  name: string;
  assistantName: string;
  apiName: string;
  tagline: string;
  logoPath: string;
  faviconPath: string;
}>("brandForm", { required: true });
</script>

<template>
  <div class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
    <div class="card-body md:p-6" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ t("settings.brand.tabs.identityDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" extra-:class="[FLEX_GAP_TOKEN_CLASS.gap4]">
        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.nameLegend") }}
          </legend>
          <input
            v-model="brandForm.name"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.brand.nameAria')"
          />
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.assistantNameLegend") }}
          </legend>
          <input
            v-model="brandForm.assistantName"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.brand.assistantNameAria')"
          />
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.apiNameLegend") }}
          </legend>
          <input
            v-model="brandForm.apiName"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.brand.apiNameAria')"
          />
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.taglineLegend") }}
          </legend>
          <input
            v-model="brandForm.tagline"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.brand.taglineAria')"
          />
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.logoPathLegend") }}
          </legend>
          <input
            v-model="brandForm.logoPath"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :placeholder="t('settings.brand.assetPathPlaceholder')"
            :aria-describedby="BRAND_HINT_IDS.logoPath"
            :aria-label="t('settings.brand.logoPathAria')"
          />
          <p :id="BRAND_HINT_IDS.logoPath" class="label whitespace-normal">
            {{ t("settings.brand.assetPathHint") }}
          </p>
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.faviconPathLegend") }}
          </legend>
          <input
            v-model="brandForm.faviconPath"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :placeholder="t('settings.brand.assetPathPlaceholder')"
            :aria-describedby="BRAND_HINT_IDS.faviconPath"
            :aria-label="t('settings.brand.faviconPathAria')"
          />
          <p :id="BRAND_HINT_IDS.faviconPath" class="label whitespace-normal">
            {{ t("settings.brand.assetPathHint") }}
          </p>
        </fieldset>
      </SectionGrid>
    </div>
  </div>
</template>
