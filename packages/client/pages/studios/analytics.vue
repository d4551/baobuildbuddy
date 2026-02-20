<script setup lang="ts">
import { getErrorMessage } from "~/utils/errors";

const { $toast } = useNuxtApp();
const api = useApi();

const analytics = ref<Record<string, unknown> | null>(null);
const loading = ref(false);
const pageError = ref<string | null>(null);

onMounted(async () => {
  await fetchAnalytics();
});

async function fetchAnalytics() {
  pageError.value = null;
  loading.value = true;
  try {
    const { data } = await api.studios.analytics.get();
    analytics.value = data;
  } catch (error) {
    pageError.value = getErrorMessage(error, "Failed to load analytics data");
    $toast.error(pageError.value);
  } finally {
    loading.value = false;
  }
}

function getMaxCount(items: Array<{ name: string; count: number }>) {
  return Math.max(...items.map((i) => i.count));
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Studio Analytics</h1>

    <div v-if="pageError" class="alert alert-error mb-6">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ pageError }}</span>
      <button class="btn btn-sm" @click="fetchAnalytics">Retry</button>
    </div>

    <LoadingSkeleton v-else-if="loading && !analytics" :lines="8" />

    <div v-else-if="analytics" class="space-y-6">
      <!-- Overview Stats -->
      <div class="stats stats-vertical lg:stats-horizontal w-full bg-base-200">
        <div class="stat">
          <div class="stat-title">Total Studios</div>
          <div class="stat-value text-primary">{{ analytics.totalStudios }}</div>
          <div class="stat-desc">In database</div>
        </div>

        <div class="stat">
          <div class="stat-title">Remote Friendly</div>
          <div class="stat-value text-secondary">{{ analytics.remoteWorkPercentage }}%</div>
          <div class="stat-desc">Offer remote positions</div>
        </div>

        <div class="stat">
          <div class="stat-title">Indie Studios</div>
          <div class="stat-value text-accent">{{ analytics.byType.Indie }}</div>
          <div class="stat-desc">{{ Math.round((analytics.byType.Indie / analytics.totalStudios) * 100) }}% of total</div>
        </div>
      </div>

      <!-- By Type -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Studios by Type</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="(count, type) in analytics.byType"
              :key="type"
              class="stat bg-base-100 rounded-lg"
            >
              <div class="stat-title text-xs">{{ type }}</div>
              <div class="stat-value text-2xl">{{ count }}</div>
              <div class="stat-desc">{{ Math.round((count / analytics.totalStudios) * 100) }}% of total</div>
            </div>
          </div>
        </div>
      </div>

      <!-- By Size -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Studios by Size</h2>

          <div class="space-y-4">
            <div
              v-for="(count, size) in analytics.bySize"
              :key="size"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium">{{ size }}</span>
                <span class="badge badge-lg">{{ count }}</span>
              </div>
              <progress
                class="progress progress-primary w-full"
                :value="count"
                :max="analytics.totalStudios"
                aria-label="Count progress"></progress>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Technologies -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Most Common Technologies</h2>
          <p class="text-sm text-base-content/70 mb-4">
            Technologies used across game studios
          </p>

          <div class="space-y-3">
            <div
              v-for="tech in analytics.topTechnologies"
              :key="tech.name"
              class="flex items-center gap-3"
            >
              <span class="w-32 font-medium">{{ tech.name }}</span>
              <div class="flex-1">
                <progress
                  class="progress progress-primary w-full"
                  :value="tech.count"
                  :max="getMaxCount(analytics.topTechnologies)"
                  aria-label="Count progress"></progress>
              </div>
              <span class="badge">{{ tech.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Remote Work Distribution -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Remote Work Availability</h2>

          <div class="flex items-center justify-center py-8">
            <div class="radial-progress text-primary" :style="`--value:${analytics.remoteWorkPercentage}; --size:12rem;`">
              <div class="text-center">
                <span class="text-4xl font-bold">{{ analytics.remoteWorkPercentage }}%</span>
                <p class="text-sm mt-2">Offer Remote</p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mt-4">
            <div class="stat bg-base-100 rounded-lg">
              <div class="stat-title text-xs">Remote Friendly</div>
              <div class="stat-value text-success text-2xl">
                {{ Math.round((analytics.remoteWorkPercentage / 100) * analytics.totalStudios) }}
              </div>
            </div>

            <div class="stat bg-base-100 rounded-lg">
              <div class="stat-title text-xs">On-site Only</div>
              <div class="stat-value text-warning text-2xl">
                {{ analytics.totalStudios - Math.round((analytics.remoteWorkPercentage / 100) * analytics.totalStudios) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
