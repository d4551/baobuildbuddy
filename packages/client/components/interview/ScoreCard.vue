<script setup lang="ts">
interface ScoreAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

const props = defineProps<{
  analysis: ScoreAnalysis;
}>();

const scoreColor = computed(() => {
  const score = props.analysis.overallScore;
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
});

const scoreBorderColor = computed(() => {
  const score = props.analysis.overallScore;
  if (score >= 80) return "border-success";
  if (score >= 60) return "border-warning";
  return "border-error";
});
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="card-title">Interview Performance Analysis</h2>

      <div class="flex flex-col items-center py-6">
        <div
          class="radial-progress"
          :class="[scoreColor, scoreBorderColor]"
          :style="`--value:${props.analysis.overallScore}; --size:12rem; --thickness:1rem;`"
          role="progressbar"
        >
          <div class="flex flex-col items-center">
            <span class="text-4xl font-bold">{{ props.analysis.overallScore }}</span>
            <span class="text-sm opacity-70">Overall Score</span>
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Strengths -->
      <div v-if="props.analysis.strengths.length > 0" class="mb-4">
        <h3 class="font-bold text-lg mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Strengths
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
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Areas for Improvement
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
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Recommendations
        </h3>
        <ul class="space-y-2">
          <li
            v-for="(recommendation, index) in props.analysis.recommendations"
            :key="index"
            class="flex items-start gap-2"
          >
            <span class="text-info mt-1">•</span>
            <span class="flex-1">{{ recommendation }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
