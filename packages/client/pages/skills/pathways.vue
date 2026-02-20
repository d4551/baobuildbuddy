<script setup lang="ts">
import type { ReadinessAssessment } from "@bao/shared";
import { getErrorMessage } from "~/utils/errors";

const { $toast } = useNuxtApp();
const {
  pathways,
  readiness,
  loading: skillLoading,
  fetchPathways,
  fetchReadiness,
} = useSkillMapping();

type ReadinessCategoryStat = {
  key: string;
  score: number;
  feedback: string;
};

const loading = computed(() => skillLoading.value);
const pageError = ref<string | null>(null);

const readinessAssessment = computed<ReadinessAssessment | null>(
  () => readiness.value as ReadinessAssessment | null,
);

const sortedPathways = computed(() => {
  return [...pathways.value].sort((a, b) => b.matchScore - a.matchScore);
});

const readinessCategories = computed<ReadinessCategoryStat[]>(() => {
  if (!readinessAssessment.value) return [];
  return Object.entries(readinessAssessment.value.categories).map(([key, category]) => ({
    key,
    score: category.score,
    feedback: category.feedback,
  }));
});

function formatCategoryLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^\w/, (match) => match.toUpperCase());
}

onMounted(async () => {
  await loadData();
});

async function loadData() {
  pageError.value = null;
  try {
    await Promise.all([fetchPathways(), fetchReadiness()]);
  } catch (error) {
    pageError.value = getErrorMessage(error, "Failed to load career pathways data");
    $toast.error(pageError.value);
  }
}

function getReadinessColor(percentage: number) {
  if (percentage >= 80) return "progress-success";
  if (percentage >= 60) return "progress-warning";
  return "progress-error";
}

function getReadinessBadgeColor(percentage: number) {
  if (percentage >= 80) return "badge-success";
  if (percentage >= 60) return "badge-warning";
  return "badge-error";
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Career Pathways</h1>

    <div v-if="pageError" class="alert alert-error mb-6">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ pageError }}</span>
      <button class="btn btn-sm" @click="loadData">Retry</button>
    </div>

    <LoadingSkeleton v-else-if="loading && (!pathways.length || !readiness)" :lines="8" />

    <div v-else class="space-y-6">
      <!-- Readiness Assessment -->
      <div v-if="readinessAssessment" class="card bg-gradient-to-br from-primary to-secondary text-primary-content">
        <div class="card-body">
          <h2 class="card-title text-2xl">Your Career Readiness</h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <div>
              <p class="text-sm opacity-80 mb-2">Overall Readiness</p>
              <div class="radial-progress bg-primary-content/20 text-primary-content border-4 border-primary-content" :style="`--value:${readinessAssessment.overallScore}; --size:7rem;`">
                <span class="text-2xl font-bold">{{ readinessAssessment.overallScore }}%</span>
              </div>
            </div>

            <div>
              <p class="text-sm opacity-80 mb-2">Category Scores</p>
              <div class="space-y-3">
                <div
                  v-for="category in readinessCategories"
                  :key="category.key"
                >
                  <p class="text-sm">{{ formatCategoryLabel(category.key) }}: {{ category.score }}%</p>
                  <progress
                    class="progress w-full"
                    :class="getReadinessColor(category.score)"
                    :value="category.score"
                    max="100"
                    aria-label="Score progress"></progress>
                  <p class="text-xs opacity-80 mt-1">{{ category.feedback }}</p>
                </div>
              </div>
            </div>

            <div>
              <p class="text-sm opacity-80 mb-2">Suggested Focus Areas</p>
              <div class="space-y-3">
                <div>
                  <p class="text-xs font-semibold">Top Improvements</p>
                  <ul class="text-sm list-disc list-inside">
                    <li
                      v-for="item in readinessAssessment?.improvementSuggestions ?? []"
                      :key="item"
                    >
                      {{ item }}
                    </li>
                  </ul>
                </div>
                <div>
                  <p class="text-xs font-semibold">Next Steps</p>
                  <ul class="text-sm list-disc list-inside">
                    <li
                      v-for="item in readinessAssessment?.nextSteps ?? []"
                      :key="item"
                    >
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Career Pathways -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Pathway Recommendations</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="pathway in sortedPathways"
              :key="pathway.id"
              class="card bg-base-100"
            >
              <div class="card-body">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="card-title text-base">{{ pathway.title }}</h3>
                  <span class="badge badge-sm" :class="getReadinessBadgeColor(pathway.matchScore)">
                    {{ pathway.matchScore }}%
                  </span>
                </div>

                <p class="text-sm text-base-content/70 mb-3">{{ pathway.description }}</p>
                <p v-if="pathway.detailedDescription" class="text-xs text-base-content/80">
                  {{ pathway.detailedDescription }}
                </p>

                <div class="mb-3">
                  <p class="text-xs font-semibold mb-2">Required Skills</p>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="skill in pathway.requiredSkills" :key="skill" class="badge badge-xs">
                      {{ skill }}
                    </span>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span>Match score</span>
                    <span class="font-semibold">{{ pathway.matchScore }}%</span>
                  </div>
                  <progress
                    class="progress w-full"
                    :class="getReadinessColor(pathway.matchScore)"
                    :value="pathway.matchScore"
                    max="100"
                    aria-label="Match Score progress"></progress>
                  <p class="text-xs mt-2">
                    Estimated time to entry:
                    <span class="font-semibold">{{ pathway.estimatedTimeToEntry }}</span>
                  </p>
                  <p class="text-xs mt-1">
                    Market trend: <span class="font-semibold capitalize">{{ pathway.jobMarketTrend }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p v-if="!sortedPathways.length" class="text-sm opacity-80 text-center mt-2">
            No pathways available yet. Add more mapped skills to generate recommendations.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
