<script setup lang="ts">
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
  <div class="card card-border bg-base-100 shadow-sm">
    <div class="card-body gap-4 p-4 md:p-6">
      <p class="text-sm text-secondary">
        {{ t("settings.brand.tabs.themesDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" extra-class="gap-4">
        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.lightThemeLegend") }}
          </legend>
          <textarea
            v-model="brandForm.lightThemeJson"
            class="textarea font-mono min-w-0 w-full"
            rows="12"
            :aria-describedby="props.hintIds.lightTheme"
            :aria-label="t('settings.brand.lightThemeAria')"
          ></textarea>
          <p :id="props.hintIds.lightTheme" class="label whitespace-normal">
            {{ t("settings.brand.themeJsonHint") }}
          </p>
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.darkThemeLegend") }}
          </legend>
          <textarea
            v-model="brandForm.darkThemeJson"
            class="textarea font-mono min-w-0 w-full"
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
