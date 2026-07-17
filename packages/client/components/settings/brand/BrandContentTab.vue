<script setup lang="ts">
import { useI18n } from "vue-i18n";
import SectionGrid from "~/components/ui/SectionGrid.vue";

const props = defineProps<{
  hintIds: {
    contentOverrides: string;
  };
}>();

const brandFieldsetClass =
  "fieldset min-w-0 gap-2 rounded-box border border-base-300 bg-base-100 p-4 shadow-sm";

const { t } = useI18n();

const brandForm = defineModel<{
  defaultTitle: string;
  defaultDescription: string;
  contentOverridesJson: string;
}>("brandForm", { required: true });
</script>

<template>
  <div class="card card-border bg-base-100 shadow-sm">
    <div class="card-body gap-4 p-4 md:p-6">
      <p class="text-sm text-secondary">
        {{ t("settings.brand.tabs.contentDescription") }}
      </p>

      <SectionGrid grid-token="twoColumn" extra-class="gap-4">
        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.defaultTitleLegend") }}
          </legend>
          <input
            v-model="brandForm.defaultTitle"
            class="input min-w-0 w-full"
            :aria-label="t('settings.brand.defaultTitleAria')"
          />
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.defaultDescriptionLegend") }}
          </legend>
          <textarea
            v-model="brandForm.defaultDescription"
            class="textarea min-w-0 w-full"
            rows="4"
            :aria-label="t('settings.brand.defaultDescriptionAria')"
          ></textarea>
        </fieldset>

        <fieldset :class="[brandFieldsetClass, 'md:col-span-2']">
          <legend class="fieldset-legend text-sm font-semibold">
            {{ t("settings.brand.contentOverridesLegend") }}
          </legend>
          <textarea
            v-model="brandForm.contentOverridesJson"
            class="textarea font-mono min-w-0 w-full"
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
  </div>
</template>
