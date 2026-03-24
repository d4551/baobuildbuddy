<script setup lang="ts">
import { SCORE_PASS_THRESHOLD, SCORE_WARNING_THRESHOLD } from "@bao/shared";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

interface MatchBreakdown {
  skills: number;
  experience: number;
  location: number;
}

const props = withDefaults(defineProps<{
  score: number;
  breakdown?: MatchBreakdown;
  compact?: boolean;
}>(), {
  breakdown: undefined,
  compact: false,
});
const { t } = useI18n();

const scoreTextClass = computed(() => {
  if (props.score >= SCORE_PASS_THRESHOLD) return "text-success";
  if (props.score >= SCORE_WARNING_THRESHOLD) return "text-warning";
  return "text-error";
});

const scoreProgressClass = computed(() => {
  if (props.score >= SCORE_PASS_THRESHOLD) return "progress-success";
  if (props.score >= SCORE_WARNING_THRESHOLD) return "progress-warning";
  return "progress-error";
});

const scoreBadgeClass = computed(() => {
  if (props.score >= SCORE_PASS_THRESHOLD) return "badge-success";
  if (props.score >= SCORE_WARNING_THRESHOLD) return "badge-warning";
  return "badge-error";
});
</script>

<template>
  <div
    v-if="compact"
    class="w-20 shrink-0 space-y-2 text-right"
  >
    <p class="text-sm font-semibold" :class="scoreTextClass">
      {{ score }}%
    </p>
    <progress
      class="progress w-full"
      :class="scoreProgressClass"
      :value="score"
      max="100"
      :aria-label="t('jobsPage.matchBreakdown.overallProgressAria', { score })"
    ></progress>
  </div>

  <div v-else class="flex flex-col items-center gap-4">
    <div class="w-full max-w-xs space-y-3 text-center">
      <div class="flex justify-center">
        <span class="badge badge-lg" :class="scoreBadgeClass">
          {{ score }}%
        </span>
      </div>
      <p class="text-3xl font-bold" :class="scoreTextClass">{{ score }}%</p>
      <progress
        class="progress w-full"
        :class="scoreProgressClass"
        :value="score"
        max="100"
        :aria-label="t('jobsPage.matchBreakdown.overallProgressAria', { score })"
      ></progress>
    </div>

    <div v-if="breakdown" class="w-full space-y-3">
      <div>
        <div class="mb-1 flex justify-between text-sm">
          <span>{{ t("jobsPage.matchBreakdown.skillsMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.skills }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.skills"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.skillsProgressAria')"
        ></progress>
      </div>

      <div>
        <div class="mb-1 flex justify-between text-sm">
          <span>{{ t("jobsPage.matchBreakdown.experienceMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.experience }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.experience"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.experienceProgressAria')"
        ></progress>
      </div>

      <div>
        <div class="mb-1 flex justify-between text-sm">
          <span>{{ t("jobsPage.matchBreakdown.locationMatchLabel") }}</span>
          <span class="font-medium">{{ breakdown.location }}%</span>
        </div>
        <progress
          class="progress progress-success w-full"
          :value="breakdown.location"
          max="100"
          :aria-label="t('jobsPage.matchBreakdown.locationProgressAria')"
        ></progress>
      </div>
    </div>
  </div>
</template>
