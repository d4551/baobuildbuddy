<script setup lang="ts">
defineProps<{
  studios: ReadonlyArray<{ id: string; name: string }>;
  experienceLevelOptions: ReadonlyArray<{ value: string; labelKey: string }>;
  canProceedTarget: boolean;
  errorMessage: string;
  t: (key: string, values?: Record<string, unknown>) => string;
}>();

const targetRole = defineModel<string>("targetRole", { required: true });
const studioName = defineModel<string>("studioName", { required: true });
const studioId = defineModel<string>("studioId", { required: true });
const experienceLevel = defineModel<string>("experienceLevel", { required: true });

const emit = defineEmits<{
  generate: [];
}>();
</script>

<template>
  <div class="card bg-base-200">
    <div class="card-body">
      <h2 class="card-title">{{ t("resumeBuildPage.target.title") }}</h2>
      <p class="mb-4 text-sm text-secondary">{{ t("resumeBuildPage.target.description") }}</p>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">{{ t("resumeBuildPage.target.roleLegend") }}</legend>
        <label for="target-role" class="label">{{ t("resumeBuildPage.target.roleLabel") }}</label>
        <input
          id="target-role"
          v-model="targetRole"
          type="text"
          class="input w-full"
          :placeholder="t('resumeBuildPage.target.rolePlaceholder')"
          :aria-label="t('resumeBuildPage.target.roleAria')"
        />
      </fieldset>

      <fieldset class="fieldset mt-4">
        <legend class="fieldset-legend">{{ t("resumeBuildPage.target.studioLegend") }}</legend>
        <label for="studio-select" class="label">{{ t("resumeBuildPage.target.studioLabel") }}</label>
        <select
          id="studio-select"
          v-model="studioId"
          class="select w-full"
          :aria-label="t('resumeBuildPage.target.studioAria')"
        >
          <option value="">{{ t("resumeBuildPage.target.noStudioOption") }}</option>
          <option v-for="studio in studios" :key="studio.id" :value="studio.id">{{ studio.name }}</option>
        </select>
        <label for="studio-name" class="label mt-2">{{ t("resumeBuildPage.target.studioNameLabel") }}</label>
        <input
          id="studio-name"
          v-model="studioName"
          type="text"
          class="input w-full"
          :placeholder="t('resumeBuildPage.target.studioNamePlaceholder')"
          :aria-label="t('resumeBuildPage.target.studioNameAria')"
        />
      </fieldset>

      <fieldset class="fieldset mt-4">
        <legend class="fieldset-legend">{{ t("resumeBuildPage.target.experienceLegend") }}</legend>
        <select
          id="experience-level"
          v-model="experienceLevel"
          class="select w-full"
          :aria-label="t('resumeBuildPage.target.experienceAria')"
        >
          <option value="">{{ t("resumeBuildPage.experienceLevels.any") }}</option>
          <option v-for="option in experienceLevelOptions" :key="option.value" :value="option.value">
            {{ t(option.labelKey) }}
          </option>
        </select>
      </fieldset>

      <p v-if="errorMessage" class="mt-2 text-sm text-error">{{ errorMessage }}</p>

      <div class="card-actions mt-6 justify-end">
        <button
          class="btn btn-primary"
          :disabled="!canProceedTarget"
          :aria-label="t('resumeBuildPage.target.generateAria')"
          @click="emit('generate')"
        >
          {{ t("resumeBuildPage.target.generateButton") }}
        </button>
      </div>
    </div>
  </div>
</template>
