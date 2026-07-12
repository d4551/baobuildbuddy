<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { getErrorMessage } from "~/utils/errors";

const { t } = useI18n();

useSeoMeta({
  title: t("jobsPage.seoTitle"),
  description: t("jobsPage.seoDescription"),
});
const page = useJobsIndexPage();
</script>

<template>
  <PageScaffold labelled-by="jobs-page-title">
    <PageHeroHeader
      title-id="jobs-page-title"
      :title="t('jobsPage.title')"
      :description="t('jobsPage.seoDescription')"
    >
      <template #actions>
        <button
          class="btn btn-primary"
          :aria-label="t('jobsPage.refreshAria')"
          :disabled="page.refreshing.value"
          @click="page.handleRefresh()"
        >
          <span v-if="page.refreshing.value" class="loading loading-spinner loading-sm"></span>
          <IconRefresh v-else class="h-4 w-4" />
          {{ t("jobsPage.refreshButton") }}
        </button>
      </template>
    </PageHeroHeader>

    <div class="card mb-6 bg-base-200">
      <div class="card-body">
        <div class="flex flex-col gap-3 sm:flex-row">
          <input
            v-model="page.searchQuery.value"
            type="text"
            :placeholder="t('jobsPage.searchPlaceholder')"
            class="input flex-1"
            :aria-label="t('jobsPage.searchAria')"
            @keyup.enter="page.handleSearch()"
          />
          <button class="btn btn-primary" :aria-label="t('jobsPage.searchButtonAria')" @click="page.handleSearch()">
            <IconSearch class="h-5 w-5" />
            {{ t("jobsPage.searchButton") }}
          </button>
          <button
            class="btn btn-outline sm:hidden"
            :aria-label="t('jobsPage.toggleFiltersAria')"
            @click="page.showFilters.value = !page.showFilters.value"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {{ t("jobsPage.toggleFiltersButton") }}
          </button>
        </div>
      </div>
    </div>

    <SectionGrid grid-token="sidebar">
      <div class="w-full shrink-0 lg:w-64" :class="{ 'hidden lg:block': !page.showFilters.value }">
        <JobsPageFiltersCard
          v-model:location="page.localFilters.location"
          v-model:remote="page.localFilters.remote"
          v-model:experience-level="page.localFilters.experienceLevel"
          v-model:studio-type="page.localFilters.studioType"
          v-model:platform="page.localFilters.platform"
          v-model:genre="page.localFilters.genre"
          :experience-options="page.experienceOptions"
          :experience-option-label="(value) => page.experienceOptionLabel(value)"
          :studio-type-options="page.studioTypeOptions"
          :studio-type-option-label="(value) => page.studioTypeOptionLabel(value)"
          :platform-options="page.platformOptions"
          :platform-option-label="(value) => page.platformOptionLabel(value)"
          :genre-options="page.genreOptions"
          :genre-option-label="(value) => page.genreOptionLabel(value)"
          @clear="page.clearFilters"
        />
      </div>

      <div class="min-w-0 flex-1">
        <LoadingSkeleton
          v-if="page.loading.value || page.jobsBootstrapStatus.value === 'pending'"
          variant="cards"
        />

        <BootstrapErrorAlert
          v-else-if="page.jobsBootstrapError.value"
          :message="getErrorMessage(page.jobsBootstrapError.value, t('jobsPage.bootstrapError'))"
          :retry-label="t('jobsPage.bootstrapRetry')"
          :retry-aria-label="t('jobsPage.bootstrapRetryAria')"
          @retry="() => page.refreshJobsBootstrap()"
        />

        <EmptyState
          v-else-if="page.paginatedJobs.value.length === 0"
          title-key="jobsPage.emptyStateTitle"
          description-key="jobsPage.emptyStateDescription"
        />

        <div v-else>
          <SectionGrid grid-token="twoColumn" extra-class="mb-6">
            <article
              v-for="job in page.paginatedJobs.value"
              :key="job.id"
              class="card card-border relative h-full overflow-hidden bg-base-100 transition-colors hover:bg-base-200"
            >
              <NuxtLink
                :to="APP_ROUTE_BUILDERS.jobDetail(job.id)"
                class="absolute inset-0 rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                :aria-label="t('jobsPage.openJobAria', { title: job.title, company: job.company })"
              />
              <div class="card-body relative z-10">
                <div class="flex items-start justify-between gap-2">
                  <h3 class="card-title text-lg">{{ job.title }}</h3>
                  <JobMatchScore v-if="typeof job.matchScore === 'number'" :score="job.matchScore" compact />
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
                    {{ page.experienceOptionLabel(job.experienceLevel) }}
                  </span>
                </div>

                <p class="mt-2 line-clamp-2 text-sm text-base-content/60">
                  {{ job.description }}
                </p>

                <div class="card-actions mt-2 items-center justify-between">
                  <span class="text-xs text-base-content/50">
                    {{ page.formatDate(job.postedDate) }}
                  </span>
                  <div class="flex gap-2">
                    <button
                      class="btn btn-outline btn-sm relative z-20"
                      :aria-label="t('jobsPage.interviewAria', { title: job.title, company: job.company })"
                      @click.stop="page.interviewJob(job.id)"
                    >
                      {{ t("jobsPage.interviewButton") }}
                    </button>
                    <button
                      class="btn btn-primary btn-sm relative z-20"
                      :aria-label="t('jobsPage.viewAria', { title: job.title, company: job.company })"
                      @click.stop="page.viewJob(job.id)"
                    >
                      {{ t("jobsPage.viewButton") }}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </SectionGrid>

          <AppPagination
            v-if="page.totalPages.value > 1"
            v-model:current-page="page.currentPage.value"
            :total-pages="page.totalPages.value"
            :page-numbers="page.pageNumbers.value"
            :summary="page.jobsPaginationSummary.value"
            :navigation-aria="t('jobsPage.pagination.navigationAria')"
            :previous-aria="t('jobsPage.pagination.previousAria')"
            :next-aria="t('jobsPage.pagination.nextAria')"
            :page-aria="(page: number) => t('jobsPage.pagination.pageAria', { page })"
          />
        </div>
      </div>
    </SectionGrid>
  </PageScaffold>
</template>
