<script setup lang="ts">
import type { ResumeFormEducation } from "@bao/shared/utils/resume-transform";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  modelValue: ResumeFormEducation[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ResumeFormEducation[]];
}>();
const { t } = useI18n();

function cloneEducationItem(item: ResumeFormEducation): ResumeFormEducation {
  return {
    ...item,
  };
}

function cloneEducationList(items: readonly ResumeFormEducation[]): ResumeFormEducation[] {
  return items.map(cloneEducationItem);
}

const localValue = ref<ResumeFormEducation[]>(cloneEducationList(props.modelValue));

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = cloneEducationList(newValue);
  },
  { deep: true },
);

function emitValue(): void {
  emit("update:modelValue", cloneEducationList(localValue.value));
}

function addEducation(): void {
  localValue.value.push({
    degree: "",
    school: "",
    location: "",
    graduationDate: "",
    gpa: "",
  });
  emitValue();
}

function removeEducation(index: number): void {
  localValue.value.splice(index, 1);
  emitValue();
}
</script>

<template>
  <div class="card-body">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="card-title">{{ t("resumePage.education.title") }}</h2>
      <button
        class="btn btn-sm btn-primary"
        :aria-label="t('resumePage.education.addButtonAria')"
        @click="addEducation"
      >
        {{ t("resumePage.education.addButton") }}
      </button>
    </div>
    <div class="space-y-6">
      <div
        v-for="(education, index) in localValue"
        :key="`${education.school}-${education.degree}-${index}`"
        class="card bg-base-100"
      >
        <div class="card-body">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold">
              {{ t("resumePage.education.itemTitle", { index: index + 1 }) }}
            </h3>
            <button
              class="btn btn-error btn-xs"
              :aria-label="t('resumePage.education.removeButtonAria', { index: index + 1 })"
              @click="removeEducation(index)"
            >
              {{ t("resumePage.education.removeButton") }}
            </button>
          </div>
          <SectionGrid grid-token="twoColumn">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.education.degreeLegend") }}</legend>
              <input
                v-model="education.degree"
                type="text"
                required
                minlength="2"
                class="input validator w-full input-sm"
                :aria-label="t('resumePage.education.degreeAria')"
                @input="emitValue"
              />
              <p class="validator-hint">{{ t("resumePage.education.degreeHint") }}</p>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.education.schoolLegend") }}</legend>
              <input
                v-model="education.school"
                type="text"
                required
                minlength="2"
                class="input validator w-full input-sm"
                :aria-label="t('resumePage.education.schoolAria')"
                @input="emitValue"
              />
              <p class="validator-hint">{{ t("resumePage.education.schoolHint") }}</p>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.education.locationLegend") }}</legend>
              <input
                v-model="education.location"
                type="text"
                class="input w-full input-sm"
                :aria-label="t('resumePage.education.locationAria')"
                @input="emitValue"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.education.graduationDateLegend") }}</legend>
              <input
                v-model="education.graduationDate"
                type="month"
                class="input w-full input-sm"
                :aria-label="t('resumePage.education.graduationDateAria')"
                @input="emitValue"
              />
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.education.gpaLegend") }}</legend>
              <input
                v-model="education.gpa"
                type="text"
                class="input w-full input-sm"
                :aria-label="t('resumePage.education.gpaAria')"
                @input="emitValue"
              />
            </fieldset>
          </SectionGrid>
        </div>
      </div>
    </div>
  </div>
</template>
