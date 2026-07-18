<script setup lang="ts">
import { SHADOW_TOKEN_CLASS } from "~/constants/layout";
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
    <div class="card-body gap-4 p-4 md:p-6">
      <p class="text-sm text-secondary">
        {{ t("settings.brand.tabs.identityDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" extra-class="gap-4">
        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.nameLegend") }}
          </legend>
          <input
            v-model="brandForm.name"
            class="input min-w-0 w-full"
            :aria-label="t('settings.brand.nameAria')"
          />
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.assistantNameLegend") }}
          </legend>
          <input
            v-model="brandForm.assistantName"
            class="input min-w-0 w-full"
            :aria-label="t('settings.brand.assistantNameAria')"
          />
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.apiNameLegend") }}
          </legend>
          <input
            v-model="brandForm.apiName"
            class="input min-w-0 w-full"
            :aria-label="t('settings.brand.apiNameAria')"
          />
        </fieldset>

        <fieldset :class="brandFieldsetClass">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.taglineLegend") }}
          </legend>
          <input
            v-model="brandForm.tagline"
            class="input min-w-0 w-full"
            :aria-label="t('settings.brand.taglineAria')"
          />
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.logoPathLegend") }}
          </legend>
          <input
            v-model="brandForm.logoPath"
            class="input min-w-0 w-full"
            :placeholder="t('settings.brand.assetPathPlaceholder')"
            :aria-describedby="BRAND_HINT_IDS.logoPath"
            :aria-label="t('settings.brand.logoPathAria')"
          />
          <p :id="BRAND_HINT_IDS.logoPath" class="label whitespace-normal">
            {{ t("settings.brand.assetPathHint") }}
          </p>
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.faviconPathLegend") }}
          </legend>
          <input
            v-model="brandForm.faviconPath"
            class="input min-w-0 w-full"
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
