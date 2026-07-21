<script setup lang="ts">
import { JOB_FILTER_ALL_VALUE } from "@bao/shared/constants/jobs";
import type { GameGenre, JobExperienceLevel, Platform, StudioType } from "@bao/shared/types/jobs";
import { useI18n } from "vue-i18n";
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  MIN_HEIGHT_ZERO_CLASS,
  PADDING_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  SURFACE_GLASS_SUBTLE_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";

type FilterSelection<T extends string> = T | typeof JOB_FILTER_ALL_VALUE;

const location = defineModel<string>("location", { required: true });

const remote = defineModel<boolean>("remote", { required: true });

const experienceLevel = defineModel<FilterSelection<JobExperienceLevel>>("experienceLevel", {
  required: true,
});

const studioType = defineModel<FilterSelection<StudioType>>("studioType", { required: true });

const platform = defineModel<FilterSelection<Platform>>("platform", { required: true });

const genre = defineModel<FilterSelection<GameGenre>>("genre", { required: true });

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

const emit = defineEmits<{
  clear: [];
  apply: [];
}>();

const { t } = useI18n();

const activeFilterCount = computed(() => {
  let count = 0;
  if (location.value.trim().length > 0) count += 1;
  if (remote.value) count += 1;
  if (experienceLevel.value !== JOB_FILTER_ALL_VALUE) count += 1;
  if (studioType.value !== JOB_FILTER_ALL_VALUE) count += 1;
  if (platform.value !== JOB_FILTER_ALL_VALUE) count += 1;
  if (genre.value !== JOB_FILTER_ALL_VALUE) count += 1;
  return count;
});
</script>

<template>
  <UiGlassCard extra-class="sticky top-6 flex flex-col overflow-hidden">
    <div class="card-body flex-1 overflow-y-auto" :class="[MIN_HEIGHT_ZERO_CLASS]">
      <div class="flex items-center justify-between" :class="[MARGIN_TOKEN_CLASS.mb4, FLEX_GAP_TOKEN_CLASS.gap2]">
        <div class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap2]">
          <h2 class="card-title" :class="[TYPOGRAPHY_SCALE_CLASS.lg]">{{ t("jobsPage.filtersTitle") }}</h2>
          <span
            v-if="activeFilterCount > 0"
            class="badge badge-primary badge-sm"
          >
            {{ t("jobsPage.filtersActiveCount", { count: activeFilterCount }) }}
          </span>
        </div>
        <button
          class="btn btn-ghost"
          :class="[TOUCH_TARGET_MIN_CLASS]"
          :aria-label="t('jobsPage.clearFiltersAria')"
          @click="emit('clear')"
        >
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
    <div
      class="sticky bottom-0 border-t border-base-300 lg:hidden"
      :class="[SURFACE_GLASS_SUBTLE_CLASS, PADDING_TOKEN_CLASS.p3]"
    >
      <button
        type="button"
        :class="[PRIMARY_ACTION_CLASS, FLUID_WIDTH_CLASS]"
        :aria-label="t('jobsPage.applyFiltersAria')"
        @click="emit('apply')"
      >
        {{ t("jobsPage.applyFiltersButton") }}
      </button>
    </div>
  </UiGlassCard>
</template>
