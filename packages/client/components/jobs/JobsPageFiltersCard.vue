<script setup lang="ts">
import { JOB_FILTER_ALL_VALUE } from "@bao/shared/constants/jobs";
import type { GameGenre, JobExperienceLevel, Platform, StudioType } from "@bao/shared/types/jobs";
import { useI18n } from "vue-i18n";
import {
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

type FilterSelection<T extends string> = T | typeof JOB_FILTER_ALL_VALUE;

defineProps<{
  experienceOptions: JobExperienceLevel[];
  experienceOptionLabel: (value: FilterSelection<JobExperienceLevel>) => string;
  genreOptions: GameGenre[];
  genreOptionLabel: (value: FilterSelection<GameGenre>) => string;
  platformOptions: Platform[];
  platformOptionLabel: (value: FilterSelection<Platform>) => string;
  studioTypeOptions: StudioType[];
  studioTypeOptionLabel: (value: FilterSelection<StudioType>) => string;
}>();

defineEmits<{
  clear: [];
}>();

const location = defineModel<string>("location", { required: true });
const remote = defineModel<boolean>("remote", { required: true });
const experienceLevel = defineModel<FilterSelection<JobExperienceLevel>>("experienceLevel", {
  required: true,
});
const studioType = defineModel<FilterSelection<StudioType>>("studioType", { required: true });
const platform = defineModel<FilterSelection<Platform>>("platform", { required: true });
const genre = defineModel<FilterSelection<GameGenre>>("genre", { required: true });

const { t } = useI18n();
</script>

<template>
  <div class="card sticky top-6 bg-base-200">
    <div class="card-body">
      <div class="flex items-center justify-between" :class="[MARGIN_TOKEN_CLASS.mb4]">
        <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("jobsPage.filtersTitle") }}</h2>
        <button class="btn btn-ghost btn-xs" :aria-label="t('jobsPage.clearFiltersAria')" @click="$emit('clear')">
          {{ t("jobsPage.clearFiltersButton") }}
        </button>
      </div>

      <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("jobsPage.locationLegend") }}</legend>
          <input
            v-model="location"
            type="text"
            :placeholder="t('jobsPage.locationPlaceholder')"
            class="input input-sm" :class="[FLUID_WIDTH_CLASS]"
            :aria-label="t('jobsPage.locationAria')"
          />
        </fieldset>

        <fieldset class="fieldset">
          <label class="label cursor-pointer">
            <span class="label">{{ t("jobsPage.remoteOnlyLabel") }}</span>
            <input
              v-model="remote"
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
              :aria-label="t('jobsPage.remoteOnlyAria')"
            />
          </label>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("jobsPage.experienceLegend") }}</legend>
          <select v-model="experienceLevel" class="select select-sm" :class="[FLUID_WIDTH_CLASS]" :aria-label="t('jobsPage.experienceAria')">
            <option :value="JOB_FILTER_ALL_VALUE">{{ experienceOptionLabel(JOB_FILTER_ALL_VALUE) }}</option>
            <option v-for="level in experienceOptions" :key="level" :value="level">
              {{ experienceOptionLabel(level) }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("jobsPage.studioTypeLegend") }}</legend>
          <select v-model="studioType" class="select select-sm" :class="[FLUID_WIDTH_CLASS]" :aria-label="t('jobsPage.studioTypeAria')">
            <option :value="JOB_FILTER_ALL_VALUE">{{ studioTypeOptionLabel(JOB_FILTER_ALL_VALUE) }}</option>
            <option v-for="studioTypeValue in studioTypeOptions" :key="studioTypeValue" :value="studioTypeValue">
              {{ studioTypeOptionLabel(studioTypeValue) }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("jobsPage.platformLegend") }}</legend>
          <select v-model="platform" class="select select-sm" :class="[FLUID_WIDTH_CLASS]" :aria-label="t('jobsPage.platformAria')">
            <option :value="JOB_FILTER_ALL_VALUE">{{ platformOptionLabel(JOB_FILTER_ALL_VALUE) }}</option>
            <option v-for="platformValue in platformOptions" :key="platformValue" :value="platformValue">
              {{ platformOptionLabel(platformValue) }}
            </option>
          </select>
        </fieldset>

        <fieldset class="fieldset">
          <legend class="fieldset-legend">{{ t("jobsPage.genreLegend") }}</legend>
          <select v-model="genre" class="select select-sm" :class="[FLUID_WIDTH_CLASS]" :aria-label="t('jobsPage.genreAria')">
            <option :value="JOB_FILTER_ALL_VALUE">{{ genreOptionLabel(JOB_FILTER_ALL_VALUE) }}</option>
            <option v-for="genreValue in genreOptions" :key="genreValue" :value="genreValue">
              {{ genreOptionLabel(genreValue) }}
            </option>
          </select>
        </fieldset>
      </div>
    </div>
  </div>
</template>
