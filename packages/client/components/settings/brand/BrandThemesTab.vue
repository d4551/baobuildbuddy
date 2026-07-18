<script setup lang="ts">
import { FLEX_GAP_TOKEN_CLASS, FLUID_WIDTH_CLASS, PADDING_TOKEN_CLASS, SHADOW_TOKEN_CLASS, TRUNCATE_FLEX_CHILD_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";

const props = defineProps<{
  hintIds: {
    lightTheme: string;
    darkTheme: string;
  };
}>();

const brandFieldsetClass =
  "fieldset min-w-0 gap-2 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm";

const { t } = useI18n();

const brandForm = defineModel<{
  lightThemeJson: string;
  darkThemeJson: string;
}>("brandForm", { required: true });
</script>

<template>
  <div class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
    <div class="card-body md:p-6" :class="[FLEX_GAP_TOKEN_CLASS.gap4, PADDING_TOKEN_CLASS.p4]">
      <p class="text-secondary" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
        {{ t("settings.brand.tabs.themesDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" :extra-class="[FLEX_GAP_TOKEN_CLASS.gap4]">
        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.lightThemeLegend") }}
          </legend>
          <textarea
            v-model="brandForm.lightThemeJson"
            class="textarea font-mono" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            rows="12"
            :aria-describedby="props.hintIds.lightTheme"
            :aria-label="t('settings.brand.lightThemeAria')"
          ></textarea>
          <p :id="props.hintIds.lightTheme" class="label whitespace-normal">
            {{ t("settings.brand.themeJsonHint") }}
          </p>
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("settings.brand.darkThemeLegend") }}
          </legend>
          <textarea
            v-model="brandForm.darkThemeJson"
            class="textarea font-mono" :class="[FLUID_WIDTH_CLASS, TRUNCATE_FLEX_CHILD_CLASS]"
            rows="12"
            :aria-describedby="props.hintIds.darkTheme"
            :aria-label="t('settings.brand.darkThemeAria')"
          ></textarea>
          <p :id="props.hintIds.darkTheme" class="label whitespace-normal">
            {{ t("settings.brand.themeJsonHint") }}
          </p>
        </fieldset>
      </SectionGrid>
    </div>
  </div>
</template>
