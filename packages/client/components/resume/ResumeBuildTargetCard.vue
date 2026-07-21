<script setup lang="ts">
import {
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

const targetRole = defineModel<string>("targetRole", { required: true });

defineProps<{
  studios: ReadonlyArray<{ id: string; name: string }>;
  experienceLevelOptions: ReadonlyArray<{ value: string; labelKey: string }>;
  canProceedTarget: boolean;
  errorMessage: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const studioName = defineModel<string>("studioName", { required: true });
const studioId = defineModel<string>("studioId", { required: true });
const experienceLevel = defineModel<string>("experienceLevel", { required: true });

const emit = defineEmits<{
  generate: [];
}>();
</script>

<template>
  <UiGlassCard>
    <div class="card-body">
      <h2 class="card-title">{{ t("resumeBuildPage.target.title") }}</h2>
      <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mb4, TYPOGRAPHY_SCALE_CLASS.sm]">{{ t("resumeBuildPage.target.description") }}</p>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumeBuildPage.target.roleLegend") }}</legend>
        <label for="target-role" class="label">{{ t("resumeBuildPage.target.roleLabel") }}</label>
        <input 
          id="target-role"
          v-model="targetRole"
          type="text"
          class="input" :class="[FLUID_WIDTH_CLASS]"
          :placeholder="t('resumeBuildPage.target.rolePlaceholder')"
          :aria-label="t('resumeBuildPage.target.roleAria')"
        />
      </fieldset>

      <fieldset class="fieldset" :class="[MARGIN_TOKEN_CLASS.mt4]">
        <legend class="fieldset-legend">{{ t("resumeBuildPage.target.studioLegend") }}</legend>
        <label for="studio-select" class="label">{{ t("resumeBuildPage.target.studioLabel") }}</label>
        <select 
          id="studio-select"
          v-model="studioId"
          class="select" :class="[FLUID_WIDTH_CLASS]"
          :aria-label="t('resumeBuildPage.target.studioAria')"
        >
          <option value="">{{ t("resumeBuildPage.target.noStudioOption") }}</option>
          <option v-for="studio in studios" :key="studio.id" :value="studio.id">{{ studio.name }}</option>
        </select>
        <label for="studio-name" class="label" :class="[MARGIN_TOKEN_CLASS.mt2]">{{ t("resumeBuildPage.target.studioNameLabel") }}</label>
        <input 
          id="studio-name"
          v-model="studioName"
          type="text"
          class="input" :class="[FLUID_WIDTH_CLASS]"
          :placeholder="t('resumeBuildPage.target.studioNamePlaceholder')"
          :aria-label="t('resumeBuildPage.target.studioNameAria')"
        />
      </fieldset>

      <fieldset class="fieldset" :class="[MARGIN_TOKEN_CLASS.mt4]">
        <legend class="fieldset-legend">{{ t("resumeBuildPage.target.experienceLegend") }}</legend>
        <select 
          id="experience-level"
          v-model="experienceLevel"
          class="select" :class="[FLUID_WIDTH_CLASS]"
          :aria-label="t('resumeBuildPage.target.experienceAria')"
        >
          <option value="">{{ t("resumeBuildPage.experienceLevels.any") }}</option>
          <option v-for="option in experienceLevelOptions" :key="option.value" :value="option.value">
            {{ t(option.labelKey) }}
          </option>
        </select>
      </fieldset>

      <p v-if="errorMessage" class="text-error" :class="[MARGIN_TOKEN_CLASS.mt2, TYPOGRAPHY_SCALE_CLASS.sm]">{{ errorMessage }}</p>

      <div class="card-actions justify-end" :class="[MARGIN_TOKEN_CLASS.mt6]">
        <button 
          :class="[PRIMARY_ACTION_CLASS]"
          :disabled="!canProceedTarget"
          :aria-label="t('resumeBuildPage.target.generateAria')"
          @click="emit('generate')"
        >
          {{ t("resumeBuildPage.target.generateButton") }}
        </button>
      </div>
    </div>
  </UiGlassCard>
</template>
