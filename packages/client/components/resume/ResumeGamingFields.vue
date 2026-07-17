<script setup lang="ts">
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
  <div class="space-y-4 p-6">
    <h2 class="text-lg font-semibold">{{ t("resumePage.gaming.title") }}</h2>
    <p class="mb-4 text-sm text-secondary">
      {{ t("resumePage.gaming.description") }}
    </p>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("resumePage.gaming.rolesLegend") }}</legend>
      <input
        v-model="localValue.roles"
        type="text"
        :placeholder="t('resumePage.gaming.rolesPlaceholder')"
        class="input w-full"
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
        class="input w-full"
        :aria-label="t('resumePage.gaming.genresAria')"
        @input="emitValue"
      />
    </fieldset>
    <fieldset class="fieldset">
      <legend class="fieldset-legend">{{ t("resumePage.gaming.achievementsLegend") }}</legend>
      <textarea
        v-model="localValue.achievements"
        class="textarea w-full"
        rows="4"
        :placeholder="t('resumePage.gaming.achievementsPlaceholder')"
        :aria-label="t('resumePage.gaming.achievementsAria')"
        @input="emitValue"
      ></textarea>
    </fieldset>
  </div>
</template>
