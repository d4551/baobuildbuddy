<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useScoreColor } from "~/composables/useScoreColor";

interface ScoreAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

const props = defineProps<{
  analysis: ScoreAnalysis;
}>();
const { t } = useI18n();
const { getScoreColorClass, getScoreBorderClass } = useScoreColor();
const RADIAL_PROGRESS_SIZE = "12rem";
const RADIAL_PROGRESS_THICKNESS = "1rem";

const scoreColor = computed(() => getScoreColorClass(props.analysis.overallScore));
const scoreBorderColor = computed(() => getScoreBorderClass(props.analysis.overallScore));

const scoreProgressStyle = computed<Record<string, string>>(() => ({
  "--value": String(props.analysis.overallScore),
  "--size": RADIAL_PROGRESS_SIZE,
  "--thickness": RADIAL_PROGRESS_THICKNESS,
}));
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">{{ t("interviewScoreCard.title") }}</h2>

      <div class="flex flex-col items-center py-6">
        <div
          class="radial-progress"
          :class="[scoreColor, scoreBorderColor]"
          :style="scoreProgressStyle"
          role="progressbar"
          :aria-label="t('interviewScoreCard.progressAria', { score: props.analysis.overallScore })"
          :aria-valuemin="0"
          :aria-valuemax="100"
          :aria-valuenow="props.analysis.overallScore"
        >
          <div class="flex flex-col items-center">
            <span class="text-4xl font-bold">{{ props.analysis.overallScore }}</span>
            <span class="text-sm opacity-70">{{ t("interviewScoreCard.overallScore") }}</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Strengths -->
      <div v-if="props.analysis.strengths.length > 0" class="mb-4">
        <h3 class="font-bold text-lg mb-2 flex items-center gap-2">
          <IconCheckCircle class="h-5 w-5 text-success" />
          {{ t("interviewScoreCard.strengths") }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(strength, index) in props.analysis.strengths"
            :key="index"
            class="badge badge-success gap-2"
          >
            {{ strength }}
          </div>
        </div>
      </div>

      <!-- Weaknesses -->
      <div v-if="props.analysis.weaknesses.length > 0" class="mb-4">
        <h3 class="font-bold text-lg mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {{ t("interviewScoreCard.areasForImprovement") }}
        </h3>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="(weakness, index) in props.analysis.weaknesses"
            :key="index"
            class="badge badge-warning gap-2"
          >
            {{ weakness }}
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="props.analysis.recommendations.length > 0">
        <h3 class="font-bold text-lg mb-2 flex items-center gap-2">
          <IconLightbulb class="h-5 w-5 text-info" />
          {{ t("interviewScoreCard.recommendations") }}
        </h3>
        <ul class="space-y-2">
          <li
            v-for="(recommendation, index) in props.analysis.recommendations"
            :key="index"
            class="flex items-start gap-2"
          >
            <span class="text-info mt-1" aria-hidden="true">•</span>
            <span class="flex-1">{{ recommendation }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
