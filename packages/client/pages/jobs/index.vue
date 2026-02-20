<script setup lang="ts">
import type {
  GameGenre,
  JobExperienceLevel,
  Platform,
  StudioType,
} from "@bao/shared";
import {
  APP_ROUTE_BUILDERS,
  JOB_DISCOVERY_DEFAULT_PAGE_SIZE,
  JOB_EXPERIENCE_LEVELS,
  JOB_FILTER_ALL_VALUE,
  JOB_GAME_GENRES,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";

type FilterSelection<T extends string> = T | typeof JOB_FILTER_ALL_VALUE;

interface JobsFilterState {
  location: string;
  remote: boolean;
  experienceLevel: FilterSelection<JobExperienceLevel>;
  studioType: FilterSelection<StudioType>;
  platform: FilterSelection<Platform>;
  genre: FilterSelection<GameGenre>;
}

const { jobs, loading, searchJobs, refreshJobs } = useJobs();
const router = useRouter();
const { t } = useI18n();
const { $toast } = useNuxtApp();
const { awardForAction } = usePipelineGamification();

const searchQuery = ref("");
const localFilters = reactive<JobsFilterState>({
  location: "",
  remote: false,
  experienceLevel: JOB_FILTER_ALL_VALUE,
  studioType: JOB_FILTER_ALL_VALUE,
  platform: JOB_FILTER_ALL_VALUE,
  genre: JOB_FILTER_ALL_VALUE,
});
const currentPage = ref(1);
const pageSize = JOB_DISCOVERY_DEFAULT_PAGE_SIZE;
const refreshing = ref(false);
const showFilters = ref(false);

const experienceOptions = JOB_EXPERIENCE_LEVELS;
const studioTypeOptions = JOB_STUDIO_TYPES;
const platformOptions = JOB_SUPPORTED_PLATFORMS;
const genreOptions = JOB_GAME_GENRES;

await useAsyncData("jobs-page-bootstrap", async () => {
  await searchJobs();
  return true;
});

const filteredJobs = computed(() => {
  let result = [...jobs.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.description || "").toLowerCase().includes(query),
    );
  }

  if (localFilters.location) {
    const normalizedLocation = localFilters.location.toLowerCase();
    result = result.filter((job) => job.location.toLowerCase().includes(normalizedLocation));
  }

  if (localFilters.remote) {
    result = result.filter((job) => job.remote);
  }

  if (localFilters.experienceLevel !== JOB_FILTER_ALL_VALUE) {
    const selectedExperienceLevel = localFilters.experienceLevel;
    result = result.filter((job) => job.experienceLevel === selectedExperienceLevel);
  }

  if (localFilters.studioType !== JOB_FILTER_ALL_VALUE) {
    const selectedStudioType = localFilters.studioType;
    result = result.filter((job) => job.studioType === selectedStudioType);
  }

  if (localFilters.platform !== JOB_FILTER_ALL_VALUE) {
    const selectedPlatform = localFilters.platform;
    result = result.filter((job) => job.platforms?.includes(selectedPlatform));
  }

  if (localFilters.genre !== JOB_FILTER_ALL_VALUE) {
    const selectedGenre = localFilters.genre;
    result = result.filter((job) => job.gameGenres?.includes(selectedGenre));
  }

  return result;
});

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredJobs.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredJobs.value.length / pageSize));
const pageNumbers = computed(() =>
  Array.from({ length: totalPages.value }, (_, index) => index + 1),
);

watch(
  () => ({
    search: searchQuery.value,
    location: localFilters.location,
    remote: localFilters.remote,
    experienceLevel: localFilters.experienceLevel,
    studioType: localFilters.studioType,
    platform: localFilters.platform,
    genre: localFilters.genre,
  }),
  () => {
    currentPage.value = 1;
  },
);

watch(totalPages, (nextTotal) => {
  if (nextTotal <= 0) {
    currentPage.value = 1;
    return;
  }
  if (currentPage.value > nextTotal) {
    currentPage.value = nextTotal;
  }
});

async function handleRefresh() {
  refreshing.value = true;
  try {
    await refreshJobs();
    await maybeAwardSearchXp();
  } finally {
    refreshing.value = false;
  }
}

async function handleSearch() {
  currentPage.value = 1;
  if (!hasSearchCriteria()) {
    return;
  }

  await maybeAwardSearchXp();
}

function clearFilters() {
  searchQuery.value = "";
  localFilters.location = "";
  localFilters.remote = false;
  localFilters.experienceLevel = JOB_FILTER_ALL_VALUE;
  localFilters.studioType = JOB_FILTER_ALL_VALUE;
  localFilters.platform = JOB_FILTER_ALL_VALUE;
  localFilters.genre = JOB_FILTER_ALL_VALUE;
  currentPage.value = 1;
}

function viewJob(id: string) {
  router.push(APP_ROUTE_BUILDERS.jobDetail(id));
}

function interviewJob(id: string) {
  router.push(buildInterviewJobNavigation(id, "jobs-list"));
}

function getMatchScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-error";
}

function formatDate(date: string) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return t("jobsPage.date.unknown");
  }

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return t("jobsPage.date.today");
  if (diffDays === 1) return t("jobsPage.date.yesterday");
  if (diffDays < 7) return t("jobsPage.date.daysAgo", { count: diffDays });
  if (diffDays < 30) return t("jobsPage.date.weeksAgo", { count: Math.floor(diffDays / 7) });
  return t("jobsPage.date.monthsAgo", { count: Math.floor(diffDays / 30) });
}

function experienceOptionLabel(value: FilterSelection<JobExperienceLevel>): string {
  if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.all");
  if (value === "entry") return t("jobsPage.options.experience.entry");
  if (value === "junior") return t("jobsPage.options.experience.junior");
  if (value === "mid") return t("jobsPage.options.experience.mid");
  if (value === "senior") return t("jobsPage.options.experience.senior");
  if (value === "principal") return t("jobsPage.options.experience.principal");
  return t("jobsPage.options.experience.director");
}

function studioTypeOptionLabel(value: FilterSelection<StudioType>): string {
  if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allTypes");
  if (value === "AAA") return t("jobsPage.options.studioType.aaa");
  if (value === "Indie") return t("jobsPage.options.studioType.indie");
  if (value === "Mobile") return t("jobsPage.options.studioType.mobile");
  if (value === "VR/AR") return t("jobsPage.options.studioType.vrAr");
  if (value === "Platform") return t("jobsPage.options.studioType.platform");
  if (value === "Esports") return t("jobsPage.options.studioType.esports");
  return t("jobsPage.options.studioType.unknown");
}

function platformOptionLabel(value: FilterSelection<Platform>): string {
  if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allPlatforms");
  if (value === "PC") return t("jobsPage.options.platform.pc");
  if (value === "Console") return t("jobsPage.options.platform.console");
  if (value === "Mobile") return t("jobsPage.options.platform.mobile");
  if (value === "VR") return t("jobsPage.options.platform.vr");
  if (value === "AR") return t("jobsPage.options.platform.ar");
  if (value === "Web") return t("jobsPage.options.platform.web");
  if (value === "Switch") return t("jobsPage.options.platform.switch");
  if (value === "PlayStation") return t("jobsPage.options.platform.playStation");
  if (value === "Xbox") return t("jobsPage.options.platform.xbox");
  return t("jobsPage.options.platform.steam");
}

function genreOptionLabel(value: FilterSelection<GameGenre>): string {
  if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allGenres");
  return t("jobsPage.options.genre", { value });
}

function hasSearchCriteria(): boolean {
  return (
    searchQuery.value.trim().length > 0 ||
    localFilters.location.trim().length > 0 ||
    localFilters.remote ||
    localFilters.experienceLevel !== JOB_FILTER_ALL_VALUE ||
    localFilters.studioType !== JOB_FILTER_ALL_VALUE ||
    localFilters.platform !== JOB_FILTER_ALL_VALUE ||
    localFilters.genre !== JOB_FILTER_ALL_VALUE
  );
}

async function maybeAwardSearchXp(): Promise<void> {
  try {
    const reward = await awardForAction("jobSearch");
    if (reward.awarded) {
      $toast.success(t("jobsPage.toasts.searchReward", { xp: reward.amount }));
    }
  } catch {
    // Search UX must not fail if gamification awarding is unavailable.
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold">{{ t("jobsPage.title") }}</h1>
      <button
        class="btn btn-primary btn-sm"
        :aria-label="t('jobsPage.refreshAria')"
        :disabled="refreshing"
        @click="handleRefresh"
      >
        <span v-if="refreshing" class="loading loading-spinner loading-xs"></span>
        <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ t("jobsPage.refreshButton") }}
      </button>
    </div>

    <div class="card mb-6 bg-base-200">
      <div class="card-body">
        <div class="flex flex-col gap-3 sm:flex-row">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('jobsPage.searchPlaceholder')"
            class="input input-bordered flex-1"
            :aria-label="t('jobsPage.searchAria')"
            @keyup.enter="handleSearch"
          />
          <button class="btn btn-primary" :aria-label="t('jobsPage.searchButtonAria')" @click="handleSearch">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {{ t("jobsPage.searchButton") }}
          </button>
          <button
            class="btn btn-outline sm:hidden"
            :aria-label="t('jobsPage.toggleFiltersAria')"
            @click="showFilters = !showFilters"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {{ t("jobsPage.toggleFiltersButton") }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-6 lg:flex-row">
      <div class="w-full shrink-0 lg:w-64" :class="{ 'hidden lg:block': !showFilters }">
        <div class="card sticky top-6 bg-base-200">
          <div class="card-body">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="card-title text-lg">{{ t("jobsPage.filtersTitle") }}</h2>
              <button
                class="btn btn-ghost btn-xs"
                :aria-label="t('jobsPage.clearFiltersAria')"
                @click="clearFilters"
              >
                {{ t("jobsPage.clearFiltersButton") }}
              </button>
            </div>

            <div class="space-y-4">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("jobsPage.locationLegend") }}</legend>
                <input
                  v-model="localFilters.location"
                  type="text"
                  :placeholder="t('jobsPage.locationPlaceholder')"
                  class="input input-sm w-full"
                  :aria-label="t('jobsPage.locationAria')"
                />
              </fieldset>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">{{ t("jobsPage.remoteOnlyLabel") }}</span>
                  <input
                    v-model="localFilters.remote"
                    type="checkbox"
                    class="toggle toggle-primary toggle-sm"
                    :aria-label="t('jobsPage.remoteOnlyAria')"
                  />
                </label>
              </div>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("jobsPage.experienceLegend") }}</legend>
                <select
                  v-model="localFilters.experienceLevel"
                  class="select select-sm w-full"
                  :aria-label="t('jobsPage.experienceAria')"
                >
                  <option :value="JOB_FILTER_ALL_VALUE">
                    {{ experienceOptionLabel(JOB_FILTER_ALL_VALUE) }}
                  </option>
                  <option v-for="level in experienceOptions" :key="level" :value="level">
                    {{ experienceOptionLabel(level) }}
                  </option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("jobsPage.studioTypeLegend") }}</legend>
                <select
                  v-model="localFilters.studioType"
                  class="select select-sm w-full"
                  :aria-label="t('jobsPage.studioTypeAria')"
                >
                  <option :value="JOB_FILTER_ALL_VALUE">
                    {{ studioTypeOptionLabel(JOB_FILTER_ALL_VALUE) }}
                  </option>
                  <option v-for="studioType in studioTypeOptions" :key="studioType" :value="studioType">
                    {{ studioTypeOptionLabel(studioType) }}
                  </option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("jobsPage.platformLegend") }}</legend>
                <select
                  v-model="localFilters.platform"
                  class="select select-sm w-full"
                  :aria-label="t('jobsPage.platformAria')"
                >
                  <option :value="JOB_FILTER_ALL_VALUE">
                    {{ platformOptionLabel(JOB_FILTER_ALL_VALUE) }}
                  </option>
                  <option v-for="platform in platformOptions" :key="platform" :value="platform">
                    {{ platformOptionLabel(platform) }}
                  </option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">{{ t("jobsPage.genreLegend") }}</legend>
                <select
                  v-model="localFilters.genre"
                  class="select select-sm w-full"
                  :aria-label="t('jobsPage.genreAria')"
                >
                  <option :value="JOB_FILTER_ALL_VALUE">
                    {{ genreOptionLabel(JOB_FILTER_ALL_VALUE) }}
                  </option>
                  <option v-for="genre in genreOptions" :key="genre" :value="genre">
                    {{ genreOptionLabel(genre) }}
                  </option>
                </select>
              </fieldset>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-1">
        <LoadingSkeleton v-if="loading" variant="cards" />

        <div v-else-if="paginatedJobs.length === 0" class="alert alert-info alert-soft">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ t("jobsPage.emptyState") }}</span>
        </div>

        <div v-else>
          <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div
              v-for="job in paginatedJobs"
              :key="job.id"
              class="card card-border cursor-pointer bg-base-100 transition-colors hover:bg-base-200"
              role="button"
              :aria-label="t('jobsPage.openJobAria', { title: job.title, company: job.company })"
              tabindex="0"
              @click="viewJob(job.id)"
              @keydown.enter="viewJob(job.id)"
              @keydown.space.prevent="viewJob(job.id)"
            >
              <div class="card-body">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="card-title text-lg">{{ job.title }}</h3>
                  <div
                    v-if="job.matchScore"
                    class="radial-progress text-[0.65rem] font-bold"
                    :class="getMatchScoreColor(job.matchScore)"
                    :style="`--value:${job.matchScore}; --size:2.5rem; --thickness:0.22rem;`"
                    role="progressbar"
                    :aria-valuenow="job.matchScore"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    :aria-label="t('jobsPage.matchScoreAria')"
                  >
                    {{ job.matchScore }}%
                  </div>
                </div>

                <p class="font-medium text-base-content/70">{{ job.company }}</p>

                <div class="mt-2 flex flex-wrap gap-2">
                  <span class="badge badge-sm">
                    <svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ job.location }}
                  </span>

                  <span v-if="job.remote" class="badge badge-success badge-sm">
                    {{ t("jobsPage.remoteBadge") }}
                  </span>

                  <span v-if="job.experienceLevel" class="badge badge-sm badge-outline">
                    {{ experienceOptionLabel(job.experienceLevel) }}
                  </span>
                </div>

                <p class="mt-2 line-clamp-2 text-sm text-base-content/60">
                  {{ job.description }}
                </p>

                <div class="card-actions mt-2 items-center justify-between">
                  <span class="text-xs text-base-content/50">
                    {{ formatDate(job.postedDate) }}
                  </span>
                  <div class="flex gap-2">
                    <button
                      class="btn btn-outline btn-sm"
                      :aria-label="t('jobsPage.interviewAria', { title: job.title, company: job.company })"
                      @click.stop="interviewJob(job.id)"
                    >
                      {{ t("jobsPage.interviewButton") }}
                    </button>
                    <button
                      class="btn btn-primary btn-sm"
                      :aria-label="t('jobsPage.viewAria', { title: job.title, company: job.company })"
                      @click.stop="viewJob(job.id)"
                    >
                      {{ t("jobsPage.viewButton") }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="totalPages > 1" class="flex justify-center">
            <div class="join">
              <button
                class="join-item btn btn-sm"
                :aria-label="t('jobsPage.previousPageAria')"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                «
              </button>
              <button
                v-for="page in pageNumbers"
                :key="page"
                class="join-item btn btn-sm"
                :class="{ 'btn-active': page === currentPage }"
                :aria-label="t('jobsPage.pageAria', { page })"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
              <button
                class="join-item btn btn-sm"
                :aria-label="t('jobsPage.nextPageAria')"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
