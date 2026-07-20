<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useScoreColor } from "~/composables/useScoreColor";
import {
  FLEX_GAP_TOKEN_CLASS,
  FONT_WEIGHT_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  MARGIN_TOKEN_CLASS,
  MAX_W_XS_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
  WIDTH_TOKEN_CLASS,
} from "~/constants/layout";

interface MatchBreakdown {
  skills: number;
  experience: number;
  location: number;
}

const props = withDefaults(
  defineProps<{
    score: number;
    breakdown?: MatchBreakdown;
    compact?: boolean;
  }>(),
  {
    breakdown: undefined,
    compact: false,
  },
);
const { t } = useI18n();
const { getScoreTextClass, getScoreProgressClass, getScoreBadgeClass } = useScoreColor();

const scoreTextClass = computed(() => getScoreTextClass(props.score));
const scoreProgressClass = computed(() => getScoreProgressClass(props.score));
const scoreBadgeClass = computed(() => getScoreBadgeClass(props.score));
</script>

<template>
  <div class="shrink-0 text-end" v-if="compact" :class="[STACK_SPACE_Y_TOKEN_CLASS.stack2, WIDTH_TOKEN_CLASS.w20]">
    <p class="font-semibold" :class="[TYPOGRAPHY_SCALE_CLASS.sm, scoreTextClass]">
      {{ score }}%
    </p>
    <progress 
      class="progress" :class="[FLUID_WIDTH_CLASS, scoreProgressClass]"
      :value="score"
      max="100"
      :aria-label="t('jobsPage.matchBreakdown.overallProgressAria', { score })"
    ></progress>
  </div>

  <div v-else class="flex flex-col items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap4]">
    <div class="text-center" :class="[FLUID_WIDTH_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack3, MAX_W_XS_CLASS]">
      <div class="flex justify-center">
        <span class="badge badge-lg" :class="scoreBadgeClass">
          {{ score }}%
        </span>
      </div>
      <p :class="[FONT_WEIGHT_TOKEN_CLASS.bold, TYPOGRAPHY_SCALE_CLASS.xl3, scoreTextClass]">{{ score }}%</p>
      <progress 
        class="progress" :class="[FLUID_WIDTH_CLASS, scoreProgressClass]"
        :value="score"
        max="100"
        :aria-label="t('jobsPage.matchBreakdown.overallProgressAria', { score })"
      ></progress>
    </div>

    <div v-if="breakdown" :class="[FLUID_WIDTH_CLASS, STACK_SPACE_Y_TOKEN_CLASS.stack3]">
      <div>
        <div class="flex justify-between" :class="[MARGIN_TOKEN_CLASS.mb1, TYPOGRAPHY_SCALE_CLASS.sm]">
          <span>{{ t("jobsPage.matchBreakdown.skillsMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.skills }}%</span>
        </div>
        <progress 
          class="progress progress-success" :class="[FLUID_WIDTH_CLASS]"
          :value="breakdown.skills"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.skillsProgressAria')"
        ></progress>
      </div>

      <div>
        <div class="flex justify-between" :class="[MARGIN_TOKEN_CLASS.mb1, TYPOGRAPHY_SCALE_CLASS.sm]">
          <span>{{ t("jobsPage.matchBreakdown.experienceMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.experience }}%</span>
        </div>
        <progress 
          class="progress progress-success" :class="[FLUID_WIDTH_CLASS]"
          :value="breakdown.experience"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.experienceProgressAria')"
        ></progress>
      </div>

      <div>
        <div class="flex justify-between" :class="[MARGIN_TOKEN_CLASS.mb1, TYPOGRAPHY_SCALE_CLASS.sm]">
          <span>{{ t("jobsPage.matchBreakdown.locationMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.location }}%</span>
        </div>
        <progress 
          class="progress progress-success" :class="[FLUID_WIDTH_CLASS]"
          :value="breakdown.location"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.locationProgressAria')"
        ></progress>
      </div>
    </div>
  </div>
</template>
