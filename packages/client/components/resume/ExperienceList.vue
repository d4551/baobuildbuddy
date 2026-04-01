<script setup lang="ts">
import type { ResumeFormExperience } from "@bao/shared/utils/resume-transform";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  modelValue: ResumeFormExperience[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ResumeFormExperience[]];
}>();
const { t } = useI18n();

function cloneExperienceItem(item: ResumeFormExperience): ResumeFormExperience {
  return {
    ...item,
  };
}

function cloneExperienceList(items: readonly ResumeFormExperience[]): ResumeFormExperience[] {
  return items.map(cloneExperienceItem);
}

const localValue = ref<ResumeFormExperience[]>(cloneExperienceList(props.modelValue));

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = cloneExperienceList(newValue);
  },
  { deep: true },
);

function emitValue(): void {
  emit("update:modelValue", cloneExperienceList(localValue.value));
}

function addExperience(): void {
  localValue.value.push({
    title: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  });
  emitValue();
}

function removeExperience(index: number): void {
  localValue.value.splice(index, 1);
  emitValue();
}
</script>

<template>
  <div class="card-body">
    <div class="mb-4 flex items-center justify-between">
      <h2 class="card-title">{{ t("resumePage.experience.title") }}</h2>
      <button
        class="btn btn-sm btn-primary"
        :aria-label="t('resumePage.experience.addButtonAria')"
        @click="addExperience"
      >
        {{ t("resumePage.experience.addButton") }}
      </button>
    </div>
    <div class="space-y-6">
      <div
        v-for="(experience, index) in localValue"
        :key="`${experience.company}-${experience.title}-${index}`"
        class="card bg-base-100"
      >
        <div class="card-body">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-semibold">
              {{ t("resumePage.experience.itemTitle", { index: index + 1 }) }}
            </h3>
            <button
              class="btn btn-error btn-xs"
              :aria-label="t('resumePage.experience.removeButtonAria', { index: index + 1 })"
              @click="removeExperience(index)"
            >
              {{ t("resumePage.experience.removeButton") }}
            </button>
          </div>
          <SectionGrid grid-token="twoColumn">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.experience.jobTitleLegend") }}</legend>
              <input
                v-model="experience.title"
                type="text"
                required
                minlength="2"
                class="input validator w-full input-sm"
                :aria-label="t('resumePage.experience.jobTitleAria')"
                @input="emitValue"
              />
              <p class="validator-hint">{{ t("resumePage.experience.jobTitleHint") }}</p>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.experience.companyLegend") }}</legend>
              <input
                v-model="experience.company"
                type="text"
                required
                minlength="2"
                class="input validator w-full input-sm"
                :aria-label="t('resumePage.experience.companyAria')"
                @input="emitValue"
              />
              <p class="validator-hint">{{ t("resumePage.experience.companyHint") }}</p>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.experience.locationLegend") }}</legend>
              <input
                v-model="experience.location"
                type="text"
                class="input w-full input-sm"
                :aria-label="t('resumePage.experience.locationAria')"
                @input="emitValue"
              />
            </fieldset>
            <div class="flex gap-2">
              <fieldset class="fieldset flex-1">
                <legend class="fieldset-legend">{{ t("resumePage.experience.startDateLegend") }}</legend>
                <input
                  v-model="experience.startDate"
                  type="month"
                  class="input w-full input-sm"
                  :aria-label="t('resumePage.experience.startDateAria')"
                  @input="emitValue"
                />
              </fieldset>
              <fieldset class="fieldset flex-1">
                <legend class="fieldset-legend">{{ t("resumePage.experience.endDateLegend") }}</legend>
                <input
                  v-model="experience.endDate"
                  type="month"
                  class="input w-full input-sm"
                  :disabled="experience.current"
                  :aria-label="t('resumePage.experience.endDateAria')"
                  @input="emitValue"
                />
              </fieldset>
            </div>
          </SectionGrid>
          <fieldset class="fieldset">
            <label class="label cursor-pointer justify-start gap-2">
              <input
                v-model="experience.current"
                type="checkbox"
                class="checkbox checkbox-sm"
                :aria-label="t('resumePage.experience.currentAria')"
                @change="emitValue"
              />
              <span class="label">{{ t("resumePage.experience.currentLabel") }}</span>
            </label>
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("resumePage.experience.descriptionLegend") }}</legend>
            <textarea
              v-model="experience.description"
              required
              minlength="20"
              class="textarea validator w-full"
              rows="3"
              :aria-label="t('resumePage.experience.descriptionAria')"
              @input="emitValue"
            ></textarea>
            <p class="validator-hint">{{ t("resumePage.experience.descriptionHint") }}</p>
          </fieldset>
        </div>
      </div>
    </div>
  </div>
</template>
