<script setup lang="ts">
import { RESPONSIVE_PADDING_MD_P6_CLASS } from "~/constants/ui-layout";
import { useI18n } from "vue-i18n";
import AppJsonField from "~/components/ui/AppJsonField.vue";
import AppProseField from "~/components/ui/AppProseField.vue";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FIELDSET_PANEL_CLASS,
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const props = defineProps<{
  hintIds: {
    contentOverrides: string;
  };
}>();

const brandFieldsetClass = `${FIELDSET_PANEL_CLASS} ${SHADOW_TOKEN_CLASS.sm} ${FLEX_GAP_TOKEN_CLASS.gap2} ${PADDING_TOKEN_CLASS.p4}`;

const { t } = useI18n();

const brandForm = defineModel<{
  defaultTitle: string;
  defaultDescription: string;
  contentOverridesJson: string;
}>("brandForm", { required: true });
</script>

<template>
  <div :class="SURFACE_GLASS_CARD_CLASS">
    <div class="card-body" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4, RESPONSIVE_PADDING_MD_P6_CLASS]">
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ t("settings.brand.tabs.contentDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" :extra-class="FLEX_GAP_TOKEN_CLASS.gap4">
        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.defaultTitleLegend") }}
          </legend>
          <input 
            v-model="brandForm.defaultTitle"
            class="input" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            :aria-label="t('settings.brand.defaultTitleAria')"
          />
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.defaultDescriptionLegend") }}
          </legend>
          <AppProseField
            v-model="brandForm.defaultDescription"
            :aria-label="t('settings.brand.defaultDescriptionAria')"
          />
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.contentOverridesLegend") }}
          </legend>
          <AppJsonField
            v-model="brandForm.contentOverridesJson"
            :label="t('settings.brand.contentOverridesLegend')"
            :aria-label="t('settings.brand.contentOverridesAria')"
          />
          <p :id="props.hintIds.contentOverrides" class="label whitespace-normal">
            {{ t("settings.brand.contentOverridesHint") }}
          </p>
        </fieldset>
      </SectionGrid>
    </div>
  </div>
</template>
