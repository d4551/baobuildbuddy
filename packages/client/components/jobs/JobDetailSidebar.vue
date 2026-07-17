<script setup lang="ts">
defineProps<{
  job: {
    company?: string;
    studioType?: string;
    url?: string;
    postedDate?: string;
    platforms?: string[];
    gameGenres?: string[];
  };
  t: (key: string, values?: Record<string, unknown>) => string;
  studioTypeLabel: (studioType: string) => string;
  platformLabel: (platform: string) => string;
  gameGenreLabel: (genre: string) => string;
  formatDate: (date: string) => string;
}>();
</script>

<template>
  <div class="space-y-6">
    <div class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title text-lg">{{ t("jobDetail.companyInfoTitle") }}</h2>
        <div class="space-y-3">
          <div v-if="job.company">
            <p class="text-xs text-muted">{{ t("jobDetail.companyLabel") }}</p>
            <p class="font-medium">{{ job.company }}</p>
          </div>

          <div v-if="job.studioType">
            <p class="text-xs text-muted">{{ t("jobDetail.studioTypeLabel") }}</p>
            <p class="font-medium">{{ studioTypeLabel(job.studioType) }}</p>
          </div>

          <div v-if="job.url">
            <p class="text-xs text-muted">{{ t("jobDetail.websiteLabel") }}</p>
            <a
              :href="job.url"
              target="_blank"
              rel="noopener noreferrer"
              class="link link-primary"
              :aria-label="t('jobDetail.visitWebsiteAria', { company: job.company })"
            >
              {{ t("jobDetail.visitWebsiteButton") }}
            </a>
          </div>

          <div v-if="job.postedDate">
            <p class="text-xs text-muted">{{ t("jobDetail.postedLabel") }}</p>
            <p class="font-medium">{{ formatDate(job.postedDate) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="job.platforms?.length" class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title text-lg">{{ t("jobDetail.platformsTitle") }}</h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="platform in job.platforms" :key="platform" class="badge">
            {{ platformLabel(platform) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="job.gameGenres?.length" class="card bg-base-200">
      <div class="card-body">
        <h2 class="card-title text-lg">{{ t("jobDetail.genresTitle") }}</h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="genre in job.gameGenres" :key="genre" class="badge">
            {{ gameGenreLabel(genre) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
