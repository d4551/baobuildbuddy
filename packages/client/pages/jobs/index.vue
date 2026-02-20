<script setup lang="ts">
import { buildInterviewJobNavigation } from "~/utils/interview-navigation";

const { jobs, loading, searchJobs, refreshJobs } = useJobs();
const router = useRouter();

const searchQuery = ref("");
const localFilters = reactive({
  location: "",
  remote: false,
  experienceLevel: "all",
  studioType: "",
  platform: "",
  genre: "",
});
const currentPage = ref(1);
const pageSize = 12;
const refreshing = ref(false);
const showFilters = ref(false);

onMounted(() => {
  searchJobs();
});

const filteredJobs = computed(() => {
  let result = [...jobs.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (job) =>
        job.title?.toLowerCase().includes(query) ||
        job.company?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query),
    );
  }

  if (localFilters.location) {
    result = result.filter((job) =>
      job.location?.toLowerCase().includes(localFilters.location.toLowerCase()),
    );
  }

  if (localFilters.remote) {
    result = result.filter((job) => job.remote);
  }

  if (localFilters.experienceLevel !== "all") {
    result = result.filter((job) => job.experienceLevel === localFilters.experienceLevel);
  }

  if (localFilters.studioType) {
    result = result.filter((job) => job.studioType === localFilters.studioType);
  }

  if (localFilters.platform) {
    result = result.filter((job) => job.platforms?.includes(localFilters.platform));
  }

  if (localFilters.genre) {
    result = result.filter((job) =>
      (job.gameGenres ?? []).some(
        (genre) => genre.toLowerCase() === localFilters.genre.toLowerCase(),
      ),
    );
  }

  return result;
});

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredJobs.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredJobs.value.length / pageSize));
const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, index) => index + 1));

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
  if (nextTotal === 0) {
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
  } finally {
    refreshing.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
}

function clearFilters() {
  searchQuery.value = "";
  localFilters.location = "";
  localFilters.remote = false;
  localFilters.experienceLevel = "all";
  localFilters.studioType = "";
  localFilters.platform = "";
  localFilters.genre = "";
  currentPage.value = 1;
}

function viewJob(id: string) {
  router.push(`/jobs/${id}`);
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
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Job Board</h1>
      <button
        class="btn btn-primary btn-sm"
        aria-label="Refresh job feed"
        :disabled="refreshing"
        @click="handleRefresh"
      >
        <span v-if="refreshing" class="loading loading-spinner loading-xs"></span>
        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh Jobs
      </button>
    </div>

    <!-- Search Bar -->
    <div class="card bg-base-200 mb-6">
      <div class="card-body">
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search jobs by title, company, or keywords..."
            class="input input-bordered flex-1"
            @keyup.enter="handleSearch"
            aria-label="Search jobs by title, company, or keywords..."/>
          <button class="btn btn-primary" aria-label="Search jobs" @click="handleSearch">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          <button
            class="btn btn-outline sm:hidden"
            aria-label="Toggle filter panel"
            @click="showFilters = !showFilters"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Filter Sidebar -->
      <div
        class="w-full lg:w-64 shrink-0"
        :class="{ 'hidden lg:block': !showFilters }"
      >
        <div class="card bg-base-200 sticky top-6">
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <h2 class="card-title text-lg">Filters</h2>
              <button
                class="btn btn-ghost btn-xs"
                aria-label="Clear all job filters"
                @click="clearFilters"
              >
                Clear
              </button>
            </div>

            <div class="space-y-4">
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Location</legend>
                <input
                  v-model="localFilters.location"
                  type="text"
                  placeholder="City, State, or Country"
                  class="input input-sm w-full"
                  aria-label="City, State, or Country"/>
              </fieldset>

              <div class="form-control">
                <label class="label cursor-pointer">
                  <span class="label-text">Remote Only</span>
                  <input
                    v-model="localFilters.remote"
                    type="checkbox"
                    class="toggle toggle-primary toggle-sm"
                    aria-label="Remote"/>
                </label>
              </div>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">Experience Level</legend>
                <div class="filter">
                  <input
                    class="btn btn-sm filter-reset"
                    type="radio"
                    name="job-experience-level"
                    aria-label="All"
                    :checked="localFilters.experienceLevel === 'all'"
                    @change="localFilters.experienceLevel = 'all'"
                  />
                  <input
                    class="btn btn-sm"
                    type="radio"
                    name="job-experience-level"
                    aria-label="Entry"
                    :checked="localFilters.experienceLevel === 'entry'"
                    @change="localFilters.experienceLevel = 'entry'"
                  />
                  <input
                    class="btn btn-sm"
                    type="radio"
                    name="job-experience-level"
                    aria-label="Mid"
                    :checked="localFilters.experienceLevel === 'mid'"
                    @change="localFilters.experienceLevel = 'mid'"
                  />
                  <input
                    class="btn btn-sm"
                    type="radio"
                    name="job-experience-level"
                    aria-label="Senior"
                    :checked="localFilters.experienceLevel === 'senior'"
                    @change="localFilters.experienceLevel = 'senior'"
                  />
                  <input
                    class="btn btn-sm"
                    type="radio"
                    name="job-experience-level"
                    aria-label="Lead"
                    :checked="localFilters.experienceLevel === 'lead'"
                    @change="localFilters.experienceLevel = 'lead'"
                  />
                </div>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">Studio Type</legend>
                <select
                  v-model="localFilters.studioType"
                  class="select select-sm w-full"
                  aria-label="Studio Type">
                  <option value="">All Types</option>
                  <option value="indie">Indie</option>
                  <option value="aaa">AAA</option>
                  <option value="mobile">Mobile</option>
                  <option value="publisher">Publisher</option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">Platform</legend>
                <select
                  v-model="localFilters.platform"
                  class="select select-sm w-full"
                  aria-label="Platform">
                  <option value="">All Platforms</option>
                  <option value="pc">PC</option>
                  <option value="console">Console</option>
                  <option value="mobile">Mobile</option>
                  <option value="vr">VR</option>
                </select>
              </fieldset>

              <fieldset class="fieldset">
                <legend class="fieldset-legend">Genre</legend>
                <select
                  v-model="localFilters.genre"
                  class="select select-sm w-full"
                  aria-label="Genre">
                  <option value="">All Genres</option>
                  <option value="action">Action</option>
                  <option value="rpg">RPG</option>
                  <option value="strategy">Strategy</option>
                  <option value="simulation">Simulation</option>
                  <option value="puzzle">Puzzle</option>
                </select>
              </fieldset>
            </div>
          </div>
        </div>
      </div>

      <!-- Jobs Grid -->
      <div class="flex-1">
        <LoadingSkeleton v-if="loading" variant="cards" />

        <div v-else-if="paginatedJobs.length === 0" class="alert alert-info alert-soft">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>No jobs found. Try adjusting your filters or search query.</span>
        </div>

        <div v-else>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              v-for="job in paginatedJobs"
              :key="job.id"
              class="card card-border bg-base-100 hover:bg-base-200 cursor-pointer transition-colors"
              role="button"
              :aria-label="`Open job details for ${job.title} at ${job.company}`"
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
                  >
                    {{ job.matchScore }}%
                  </div>
                </div>

                <p class="text-base-content/70 font-medium">{{ job.company }}</p>

                <div class="flex flex-wrap gap-2 mt-2">
                  <span class="badge badge-sm">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ job.location }}
                  </span>

                  <span v-if="job.remote" class="badge badge-success badge-sm">
                    Remote
                  </span>

                  <span v-if="job.experienceLevel" class="badge badge-sm badge-outline">
                    {{ job.experienceLevel }}
                  </span>
                </div>

                <p class="text-sm text-base-content/60 line-clamp-2 mt-2">
                  {{ job.description }}
                </p>

                <div class="card-actions justify-between items-center mt-2">
                  <span class="text-xs text-base-content/50">
                    {{ formatDate(job.postedDate) }}
                  </span>
                  <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm" aria-label="Start interview for job" @click.stop="interviewJob(job.id)">
                      Interview
                    </button>
                    <button class="btn btn-primary btn-sm" aria-label="View job details" @click.stop="viewJob(job.id)">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex justify-center">
            <div class="join">
              <button
                class="join-item btn btn-sm"
                aria-label="Previous page"
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
                :aria-label="`Go to page ${page}`"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
              <button
                class="join-item btn btn-sm"
                aria-label="Next page"
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
