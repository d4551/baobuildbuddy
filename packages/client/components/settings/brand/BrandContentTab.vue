<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  PADDING_TOKEN_CLASS,
  SHADOW_TOKEN_CLASS,
  TRUNCATE_FLEX_CHILD_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import { RESPONSIVE_PADDING_MD_P6_CLASS } from "~/constants/ui-layout";

const brandForm = defineModel<{
  defaultTitle: string;
  defaultDescription: string;
  contentOverridesJson: string;
}>("brandForm", { required: true });

const props = defineProps<{
  hintIds: {
    contentOverrides: string;
  };
}>();

const brandFieldsetClass = `fieldset min-w-0 rounded-box border border-base-300 bg-base-100 ${SHADOW_TOKEN_CLASS.sm} ${FLEX_GAP_TOKEN_CLASS.gap2} ${PADDING_TOKEN_CLASS.p4}`;

const { t } = useI18n();
</script>

<template>
  <UiGlassCard>
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
          <textarea 
            v-model="brandForm.defaultDescription"
            class="textarea" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            rows="4"
            :aria-label="t('settings.brand.defaultDescriptionAria')"
          ></textarea>
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.contentOverridesLegend") }}
          </legend>
          <textarea 
            v-model="brandForm.contentOverridesJson"
            class="textarea font-mono" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            rows="10"
            :aria-describedby="props.hintIds.contentOverrides"
            :aria-label="t('settings.brand.contentOverridesAria')"
          ></textarea>
          <p :id="props.hintIds.contentOverrides" class="label whitespace-normal">
            {{ t("settings.brand.contentOverridesHint") }}
          </p>
        </fieldset>
      </SectionGrid>
    </div>
  </UiGlassCard>
</template>
