<script setup lang="ts">
definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import {
  BODY_TEXT_SM_CLASS,
  BODY_TEXT_XS_CLASS,
  CARD_TITLE_LG_CLASS,
  FLUID_HEIGHT_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CHEVRON_CLASS,
  ICON_SIZE_CLASS,
  ICON_SIZE_XS_ALT_CLASS,
  ROW_GAP_SM_CLASS,
  ROW_GAP_XS_CLASS,
  SECTION_GAP_BOTTOM_CLASS,
  SIDEBAR_WIDTH_LG_CLASS,
  STACK_SPACING_SM_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  TRUNCATE_BLOCK_CLASS,
} from "~/constants/layout";
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
          <LoadingSpinner v-if="page.refreshing.value" size="sm" :label="t('jobsPage.refreshButton')" />
          <IconRefresh v-else :class="ICON_SIZE_XS_ALT_CLASS" />
          {{ t("jobsPage.refreshButton") }}
        </button>
      </template>
    </PageHeroHeader>

    <div :class="['card', SECTION_GAP_BOTTOM_CLASS, 'bg-base-200']">
      <div class="card-body">
        <div :class="['flex flex-col', ROW_GAP_SM_CLASS, 'sm:flex-row']">
          <input
            v-model="page.searchQuery.value"
            type="text"
            :placeholder="t('jobsPage.searchPlaceholder')"
            class="input flex-1"
            :aria-label="t('jobsPage.searchAria')"
            @keyup.enter="page.handleSearch()"
          />
          <button class="btn btn-primary" :aria-label="t('jobsPage.searchButtonAria')" @click="page.handleSearch()">
            <IconSearch :class="ICON_SIZE_CLASS.sm" />
            {{ t("jobsPage.searchButton") }}
          </button>
          <button
            class="btn btn-outline sm:hidden"
            :aria-label="t('jobsPage.toggleFiltersAria')"
            @click="page.showFilters.value = !page.showFilters.value"
          >
            <svg :class="ICON_SIZE_CLASS.sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {{ t("jobsPage.toggleFiltersButton") }}
          </button>
        </div>
      </div>
    </div>

    <SectionGrid grid-token="sidebar">
      <div :class="[' shrink-0', SIDEBAR_WIDTH_LG_CLASS, { 'hidden lg:block': !page.showFilters.value }, FLUID_WIDTH_CLASS]">
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

      <div :class="[TRUNCATE_BLOCK_CLASS, 'flex-1']">
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
          :title-key="
            page.isCatalogEmpty.value
              ? 'jobsPage.emptyCatalogTitle'
              : 'jobsPage.emptyStateTitle'
          "
          :description-key="
            page.isCatalogEmpty.value
              ? 'jobsPage.emptyCatalogDescription'
              : 'jobsPage.emptyStateDescription'
          "
          :cta-label-key="
            page.isCatalogEmpty.value ? 'jobsPage.refreshButton' : 'jobsPage.clearFiltersButton'
          "
          @cta="
            page.isCatalogEmpty.value ? page.handleRefresh() : page.clearFilters()
          "
        >
          <template v-if="page.isCatalogEmpty.value" #actions>
            <NuxtLink
              :to="APP_ROUTE_BUILDERS.settingsSection('jobIntelligence')"
              class="btn btn-outline btn-sm"
              :aria-label="t('jobsPage.configureProvidersAria')"
            >
              {{ t("jobsPage.configureProvidersButton") }}
            </NuxtLink>
          </template>
        </EmptyState>

        <div v-else>
          <SectionGrid grid-token="twoColumn" :extra-class="SECTION_GAP_BOTTOM_CLASS">
            <article
              v-for="job in page.paginatedJobs.value"
              :key="job.id"
              :class="[SURFACE_GLASS_CARD_CLASS, 'relative overflow-hidden', FLUID_HEIGHT_CLASS]"
            >
              <NuxtLink
                :to="APP_ROUTE_BUILDERS.jobDetail(job.id)"
                class="absolute inset-0 rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                :aria-label="t('jobsPage.openJobAria', { title: job.title, company: job.company })"
              />
              <div class="card-body relative z-10">
                <div :class="['flex items-start justify-between', ROW_GAP_XS_CLASS]">
                  <h3 :class="CARD_TITLE_LG_CLASS">{{ job.title }}</h3>
                  <JobMatchScore v-if="typeof job.matchScore === 'number'" :score="job.matchScore" compact />
                </div>

                <p class="font-medium text-secondary">{{ job.company }}</p>

                <div :class="[STACK_SPACING_SM_CLASS, 'flex flex-wrap', ROW_GAP_XS_CLASS]">
                  <span class="badge badge-sm">
                    <svg :class="['mr-1', ICON_SIZE_CHEVRON_CLASS]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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

                <p :class="['line-clamp-2', STACK_SPACING_SM_CLASS, BODY_TEXT_SM_CLASS]">
                  {{ job.description }}
                </p>

                <div :class="['card-actions', STACK_SPACING_SM_CLASS, 'items-center justify-between']">
                  <span :class="BODY_TEXT_XS_CLASS">
                    {{ page.formatDate(job.postedDate) }}
                  </span>
                  <div :class="['flex', ROW_GAP_XS_CLASS]">
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
