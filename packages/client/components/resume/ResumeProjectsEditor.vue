<script setup lang="ts">
import type { ResumeFormProject } from "@bao/shared/utils/resume-transform";
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_CARD_CLASS,
} from "~/constants/layout";

const props = defineProps<{
  modelValue: ResumeFormProject[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: ResumeFormProject[]];
}>();
const { t } = useI18n();

function cloneProjectItem(item: ResumeFormProject): ResumeFormProject {
  return {
    ...item,
    technologies: [...item.technologies],
  };
}

function cloneProjectList(items: readonly ResumeFormProject[]): ResumeFormProject[] {
  return items.map(cloneProjectItem);
}

const localValue = ref<ResumeFormProject[]>(cloneProjectList(props.modelValue));

watch(
  () => props.modelValue,
  (newValue) => {
    localValue.value = cloneProjectList(newValue);
  },
  { deep: true },
);

function emitValue(): void {
  emit("update:modelValue", cloneProjectList(localValue.value));
}

function addProject(): void {
  localValue.value.push({
    name: "",
    description: "",
    technologies: [],
    url: "",
  });
  emitValue();
}

function removeProject(index: number): void {
  localValue.value.splice(index, 1);
  emitValue();
}
</script>

<template>
  <div class="card-body">
    <div class="flex items-center justify-between" :class="[MARGIN_TOKEN_CLASS.mb4]">
      <h2 class="card-title">{{ t("resumePage.projects.title") }}</h2>
      <button 
        class="btn btn-sm btn-primary"
        :aria-label="t('resumePage.projects.addButtonAria')"
        @click="addProject"
      >
        {{ t("resumePage.projects.addButton") }}
      </button>
    </div>
    <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <div 
        v-for="(project, index) in localValue"
        :key="`${project.name}-${index}`"
        :class="SURFACE_GLASS_CARD_CLASS"
      >
        <div class="card-body">
          <div class="flex items-center justify-between" :class="[MARGIN_TOKEN_CLASS.mb4]">
            <h3 class="font-semibold">
              {{ t("resumePage.projects.itemTitle", { index: index + 1 }) }}
            </h3>
            <button 
              class="btn btn-error btn-xs"
              :aria-label="t('resumePage.projects.removeButtonAria', { index: index + 1 })"
              @click="removeProject(index)"
            >
              {{ t("resumePage.projects.removeButton") }}
            </button>
          </div>
          <SectionGrid grid-token="twoColumn">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.projects.nameLegend") }}</legend>
              <input 
                v-model="project.name"
                type="text"
                required
                minlength="2"
                class="input validator input-sm" :class="[FLUID_WIDTH_CLASS]"
                :aria-label="t('resumePage.projects.nameAria')"
                @input="emitValue"
              />
              <p class="validator-hint">{{ t("resumePage.projects.nameHint") }}</p>
            </fieldset>
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("resumePage.projects.urlLegend") }}</legend>
              <input 
                v-model="project.url"
                type="url"
                class="input input-sm" :class="[FLUID_WIDTH_CLASS]"
                :aria-label="t('resumePage.projects.urlAria')"
                @input="emitValue"
              />
            </fieldset>
          </SectionGrid>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">{{ t("resumePage.projects.descriptionLegend") }}</legend>
            <textarea 
              v-model="project.description"
              required
              minlength="20"
              class="textarea validator" :class="[FLUID_WIDTH_CLASS]"
              rows="3"
              :aria-label="t('resumePage.projects.descriptionAria')"
              @input="emitValue"
            ></textarea>
            <p class="validator-hint">{{ t("resumePage.projects.descriptionHint") }}</p>
          </fieldset>
        </div>
      </div>
    </div>
  </div>
</template>
