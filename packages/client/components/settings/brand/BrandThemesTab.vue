<script setup lang="ts">
import { RESPONSIVE_PADDING_MD_P6_CLASS } from "~/constants/ui-layout";
import { useI18n } from "vue-i18n";
import AppJsonField from "~/components/ui/AppJsonField.vue";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FIELDSET_PANEL_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const props = defineProps<{
  hintIds: {
    lightTheme: string;
    darkTheme: string;
  };
}>();

const brandFieldsetClass = `${FIELDSET_PANEL_CLASS} ${SHADOW_TOKEN_CLASS.sm} ${FLEX_GAP_TOKEN_CLASS.gap2} ${PADDING_TOKEN_CLASS.p4}`;

const { t } = useI18n();

const brandForm = defineModel<{
  lightThemeJson: string;
  darkThemeJson: string;
}>("brandForm", { required: true });
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4, RESPONSIVE_PADDING_MD_P6_CLASS]">
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ t("settings.brand.tabs.themesDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" :extra-class="FLEX_GAP_TOKEN_CLASS.gap4">
        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.lightThemeLegend") }}
          </legend>
          <AppJsonField
            v-model="brandForm.lightThemeJson"
            :label="t('settings.brand.lightThemeLegend')"
            :aria-label="t('settings.brand.lightThemeAria')"
          />
          <p :id="props.hintIds.lightTheme" class="label whitespace-normal">
            {{ t("settings.brand.themeJsonHint") }}
          </p>
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.darkThemeLegend") }}
          </legend>
          <AppJsonField
            v-model="brandForm.darkThemeJson"
            :label="t('settings.brand.darkThemeLegend')"
            :aria-label="t('settings.brand.darkThemeAria')"
          />
          <p :id="props.hintIds.darkTheme" class="label whitespace-normal">
            {{ t("settings.brand.themeJsonHint") }}
          </p>
        </fieldset>
      </SectionGrid>
    </div>
  </div>
</template>
