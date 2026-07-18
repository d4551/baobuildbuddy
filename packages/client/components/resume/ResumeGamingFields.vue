<script setup lang="ts">
import { FLUID_WIDTH_CLASS, MARGIN_TOKEN_CLASS, STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from "~/constants/layout";
import type { ResumeFormData } from "@bao/shared/utils/resume-transform";
import { useI18n } from "vue-i18n";

type ResumeGamingFields = ResumeFormData["gaming"];

const props = defineProps<{
  modelValue: ResumeGamingFields;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ResumeGamingFields];
}>();
const { t } = useI18n();

function normalizeFieldValue(value: string | string[]): string {
  return Array.isArray(value) ? value.join(", ") : value;
}

const localValue = reactive({
  roles: normalizeFieldValue(props.modelValue.roles),
  genres: normalizeFieldValue(props.modelValue.genres),
  achievements: normalizeFieldValue(props.modelValue.achievements),
});

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.roles = normalizeFieldValue(newValue.roles);
    localValue.genres = normalizeFieldValue(newValue.genres);
    localValue.achievements = normalizeFieldValue(newValue.achievements);
  },
  { deep: true },
);

function emitValue(): void {
  emit("update:modelValue", {
    roles: localValue.roles,
    genres: localValue.genres,
    achievements: localValue.achievements,
  });
}
</script>

<template>
  <div class="p-6" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
    <h2 class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("resumePage.gaming.title") }}</h2>
    <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mb4, TYPOGRAPHY_SCALE_CLASS.sm]">
      {{ t("resumePage.gaming.description") }}
    </p>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("resumePage.gaming.rolesLegend") }}</legend>
      <input
        v-model="localValue.roles"
        type="text"
        :placeholder="t('resumePage.gaming.rolesPlaceholder')"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('resumePage.gaming.rolesAria')"
        @input="emitValue"
      />
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("resumePage.gaming.genresLegend") }}</legend>
      <input
        v-model="localValue.genres"
        type="text"
        :placeholder="t('resumePage.gaming.genresPlaceholder')"
        class="input" :class="[FLUID_WIDTH_CLASS]"
        :aria-label="t('resumePage.gaming.genresAria')"
        @input="emitValue"
      />
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("resumePage.gaming.achievementsLegend") }}</legend>
      <textarea
        v-model="localValue.achievements"
        class="textarea" :class="[FLUID_WIDTH_CLASS]"
        rows="4"
        :placeholder="t('resumePage.gaming.achievementsPlaceholder')"
        :aria-label="t('resumePage.gaming.achievementsAria')"
        @input="emitValue"
      ></textarea>
    </fieldset>
  </div>
</template>
