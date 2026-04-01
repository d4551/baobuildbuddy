<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ResumePersonalFields } from "./resume-page-contracts";

const props = defineProps<{
  modelValue: ResumePersonalFields;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ResumePersonalFields];
}>();
const { t } = useI18n();

const localValue = reactive<ResumePersonalFields>({
  ...props.modelValue,
});

watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localValue, newValue);
  },
  { deep: true },
);

function emitValue(): void {
  emit("update:modelValue", { ...localValue });
}
</script>

<template>
  <div class="space-y-4 p-6">
    <h2 class="text-lg font-semibold">{{ t("resumePage.personal.title") }}</h2>
    <SectionGrid grid-token="twoColumn">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.personal.fullNameLegend") }}</legend>
        <input
          v-model="localValue.name"
          type="text"
          required
          minlength="2"
          class="input validator w-full"
          :aria-label="t('resumePage.personal.fullNameAria')"
          @input="emitValue"
        />
        <p class="validator-hint">{{ t("resumePage.personal.fullNameHint") }}</p>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.personal.emailLegend") }}</legend>
        <input
          v-model="localValue.email"
          type="email"
          required
          class="input validator w-full"
          :aria-label="t('resumePage.personal.emailAria')"
          @input="emitValue"
        />
        <p class="validator-hint">{{ t("resumePage.personal.emailHint") }}</p>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.personal.phoneLegend") }}</legend>
        <input
          v-model="localValue.phone"
          type="tel"
          pattern="^[+0-9()\\-\\s]{7,20}$"
          class="input validator w-full"
          :aria-label="t('resumePage.personal.phoneAria')"
          @input="emitValue"
        />
        <p class="validator-hint">{{ t("resumePage.personal.phoneHint") }}</p>
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.personal.locationLegend") }}</legend>
        <input
          v-model="localValue.location"
          type="text"
          class="input w-full"
          :aria-label="t('resumePage.personal.locationAria')"
          @input="emitValue"
        />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.personal.linkedInLegend") }}</legend>
        <input
          v-model="localValue.linkedIn"
          type="url"
          class="input w-full"
          :aria-label="t('resumePage.personal.linkedInAria')"
          @input="emitValue"
        />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumePage.personal.portfolioLegend") }}</legend>
        <input
          v-model="localValue.portfolio"
          type="url"
          class="input w-full"
          :aria-label="t('resumePage.personal.portfolioAria')"
          @input="emitValue"
        />
      </fieldset>
    </SectionGrid>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("resumePage.personal.summaryLegend") }}</legend>
      <textarea
        v-model="localValue.summary"
        required
        minlength="50"
        class="textarea validator w-full"
        rows="4"
        :aria-label="t('resumePage.personal.summaryAria')"
        @input="emitValue"
      ></textarea>
      <p class="validator-hint">{{ t("resumePage.personal.summaryHint") }}</p>
    </fieldset>
  </div>
</template>
