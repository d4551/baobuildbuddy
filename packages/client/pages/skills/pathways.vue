<script setup lang="ts">
import type { CareerPathway } from "@navi/shared";
import { getErrorMessage } from "~/utils/errors";

const { $toast } = useNuxtApp();
const {
  pathways,
  readiness,
  loading: skillLoading,
  fetchPathways,
  fetchReadiness,
} = useSkillMapping();

const loading = computed(() => skillLoading.value);
const pageError = ref<string | null>(null);

const pathwaysByCategory = computed(() => {
  if (!pathways.value) return {};
  const grouped: Record<string, CareerPathway[]> = {};
  pathways.value.forEach((pathway) => {
    const cat = pathway.category || "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(pathway);
  });
  return grouped;
});

const readinessAssessment = computed(() => readiness.value);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  pageError.value = null;
  try {
    await Promise.all([fetchPathways(), fetchReadiness()]);
  } catch (error: unknown) {
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

    <LoadingSkeleton v-else-if="loading && (!pathways || pathways.length === 0)" :lines="8" />

    <div v-else class="space-y-6">
      <!-- Readiness Assessment -->
      <div v-if="readinessAssessment" class="card bg-gradient-to-br from-primary to-secondary text-primary-content">
        <div class="card-body">
          <h2 class="card-title text-2xl">Your Career Readiness</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <p class="text-sm opacity-80 mb-2">Overall Readiness</p>
              <div class="radial-progress bg-primary-content/20 text-primary-content border-4 border-primary-content" :style="`--value:${readinessAssessment.overallReadiness}; --size:7rem;`">
                <span class="text-2xl font-bold">{{ readinessAssessment.overallReadiness }}%</span>
              </div>
            </div>

            <div>
              <p class="text-sm opacity-80 mb-2">Strong Areas</p>
              <ul class="space-y-1">
                <li v-for="area in readinessAssessment.strongAreas" :key="area" class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span class="text-sm">{{ area }}</span>
                </li>
              </ul>
            </div>

            <div>
              <p class="text-sm opacity-80 mb-2">Areas to Improve</p>
              <ul class="space-y-1">
                <li v-for="area in readinessAssessment.areasToImprove" :key="area" class="flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span class="text-sm">{{ area }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Pathways by Category -->
      <div v-for="(categoryPathways, category) in pathwaysByCategory" :key="category" class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">{{ category }}</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="pathway in categoryPathways"
              :key="pathway.id"
              class="card bg-base-100"
            >
              <div class="card-body">
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="card-title text-base">{{ pathway.name }}</h3>
                  <span
                    class="badge badge-sm"
                    :class="getReadinessBadgeColor(pathway.readinessPercentage)"
                  >
                    {{ pathway.readinessPercentage }}%
                  </span>
                </div>

                <p class="text-sm text-base-content/70 mb-3">{{ pathway.description }}</p>

                <div class="mb-3">
                  <p class="text-xs font-semibold mb-2">Required Skills:</p>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="skill in pathway.requiredSkills"
                      :key="skill"
                      class="badge badge-xs"
                    >
                      {{ skill }}
                    </span>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between text-xs mb-1">
                    <span>Readiness</span>
                    <span class="font-semibold">{{ pathway.readinessPercentage }}%</span>
                  </div>
                  <progress
                    class="progress w-full"
                    :class="getReadinessColor(pathway.readinessPercentage)"
                    :value="pathway.readinessPercentage"
                    max="100"
                  ></progress>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
