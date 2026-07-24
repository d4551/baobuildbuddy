import { JOB_DISCOVERY_DEFAULT_PAGE_SIZE, JOB_FILTER_ALL_VALUE } from "@bao/shared/constants/jobs";
import type { GameGenre, JobExperienceLevel, Platform, StudioType } from "@bao/shared/types/jobs";
import { formatRelativeTimeForDate } from "@bao/shared/utils/date-helpers";
import { computed } from "vue";
import type {
  FilterSelection,
  JobsFilterState,
  JobsTranslate,
} from "~/composables/jobs-index-page-contracts";
import { gameGenreLabel, jobExperienceLabel, platformLabel, studioTypeLabel } from "~/utils/labels";

const translateRelativeDate = (
  t: JobsTranslate,
  key: string,
  params?: { count?: number },
): string => (params ? t(key, params) : t(key));

const filterJobs = (input: {
  jobs: ReturnType<typeof useJobs>["jobs"]["value"];
  filters: JobsFilterState;
  searchQuery: string;
}) => {
  let result = [...input.jobs];

  if (input.searchQuery) {
    const query = input.searchQuery.toLowerCase();
    result = result.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.description || "").toLowerCase().includes(query),
    );
  }

  if (input.filters.location) {
    const normalizedLocation = input.filters.location.toLowerCase();
    result = result.filter((job) => job.location.toLowerCase().includes(normalizedLocation));
  }

  if (input.filters.remote) {
    result = result.filter((job) => job.remote);
  }

  if (input.filters.experienceLevel !== JOB_FILTER_ALL_VALUE) {
    result = result.filter((job) => job.experienceLevel === input.filters.experienceLevel);
  }

  if (input.filters.studioType !== JOB_FILTER_ALL_VALUE) {
    result = result.filter((job) => job.studioType === input.filters.studioType);
  }

  if (input.filters.platform !== JOB_FILTER_ALL_VALUE) {
    const platform = input.filters.platform;
    result = result.filter((job) => job.platforms?.includes(platform));
  }

  if (input.filters.genre !== JOB_FILTER_ALL_VALUE) {
    const genre = input.filters.genre;
    result = result.filter((job) => job.gameGenres?.includes(genre));
  }

  return result;
};

const createJobsPaginationState = (input: {
  currentPage: Ref<number>;
  pageSize: number;
  totalJobs: ComputedRef<number>;
}) => {
  const totalPages = computed(() => Math.ceil(input.totalJobs.value / input.pageSize));
  const pageNumbers = computed(() => {
    const length = totalPages.value;
    const pages: number[] = [];
    for (let pageNumber = 1; pageNumber <= length; pageNumber += 1) {
      pages.push(pageNumber);
    }
    return pages;
  });

  function paginatedItems<T>(items: ComputedRef<T[]>) {
    return computed(() => {
      const start = (input.currentPage.value - 1) * input.pageSize;
      return items.value.slice(start, start + input.pageSize);
    });
  }

  return {
    pageNumbers,
    paginatedItems,
    totalPages,
  };
};

export const createJobsDerivedState = (input: {
  jobs: ReturnType<typeof useJobs>["jobs"];
  searchQuery: Ref<string>;
  localFilters: JobsFilterState;
  currentPage: Ref<number>;
  t: JobsTranslate;
}) => {
  const pageSize = JOB_DISCOVERY_DEFAULT_PAGE_SIZE;
  const filteredJobs = computed(() =>
    filterJobs({
      jobs: input.jobs.value,
      filters: input.localFilters,
      searchQuery: input.searchQuery.value,
    }),
  );
  const pagination = createJobsPaginationState({
    currentPage: input.currentPage,
    pageSize,
    totalJobs: computed(() => filteredJobs.value.length),
  });
  const jobsPaginationSummary = computed(() =>
    input.t("jobsPage.pagination.summary", {
      start: filteredJobs.value.length === 0 ? 0 : (input.currentPage.value - 1) * pageSize + 1,
      end: Math.min(input.currentPage.value * pageSize, filteredJobs.value.length),
      total: filteredJobs.value.length,
    }),
  );

  const hasActiveFilters = computed(() => {
    const filters = input.localFilters;
    return (
      input.searchQuery.value.trim().length > 0 ||
      filters.location.trim().length > 0 ||
      filters.remote ||
      filters.experienceLevel !== JOB_FILTER_ALL_VALUE ||
      filters.studioType !== JOB_FILTER_ALL_VALUE ||
      filters.platform !== JOB_FILTER_ALL_VALUE ||
      filters.genre !== JOB_FILTER_ALL_VALUE
    );
  });

  const isCatalogEmpty = computed(() => input.jobs.value.length === 0);

  return {
    filteredJobs,
    hasActiveFilters,
    isCatalogEmpty,
    jobsPaginationSummary,
    pageNumbers: pagination.pageNumbers,
    pageSize,
    paginatedJobs: pagination.paginatedItems(filteredJobs),
    totalPages: pagination.totalPages,
  };
};

export const createJobsLabels = (t: JobsTranslate, te: (key: string) => boolean) => ({
  formatDate(date: string) {
    return formatRelativeTimeForDate(date, (key, params) => translateRelativeDate(t, key, params), {
      keyPrefix: "jobsPage.date",
    });
  },
  applicationStatusLabel(status: string): string {
    const key = `jobsPage.applied.status.${status}`;
    return te(key) ? t(key) : status;
  },
  experienceOptionLabel(value: FilterSelection<JobExperienceLevel>): string {
    if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.all");
    return jobExperienceLabel(t, value);
  },
  studioTypeOptionLabel(value: FilterSelection<StudioType>): string {
    if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allTypes");
    return studioTypeLabel(t, value);
  },
  platformOptionLabel(value: FilterSelection<Platform>): string {
    if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allPlatforms");
    return platformLabel(t, value);
  },
  genreOptionLabel(value: FilterSelection<GameGenre>): string {
    if (value === JOB_FILTER_ALL_VALUE) return t("jobsPage.options.allGenres");
    return gameGenreLabel(t, value);
  },
});
