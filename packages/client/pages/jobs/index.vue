<script setup lang="ts">
import {
  UI_STAGGER_INDEX_MAX,
} from "~/constants/numeric-ui";

const NUM_4 = 4;
defineOptions({ name: "PagesJobsIndexPage" });

definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTE_BUILDERS } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";
import { JOBS_INDEX_TABS } from "~/composables/jobs-index-page-contracts";
import {
  BODY_TEXT_SM_CLASS,
  BODY_TEXT_XS_CLASS,
  CARD_TITLE_LG_CLASS,
  FLUID_WIDTH_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CHEVRON_CLASS,
  ICON_SIZE_XS_ALT_CLASS,
  LABEL_HIDE_BELOW_SM_CLASS,
  OUTLINE_ACTION_CLASS,
  OUTLINE_ACTION_DENSE_CLASS,
  POINTER_EVENTS_TOKEN_CLASS,
  PRIMARY_ACTION_CLASS,
  ROW_GAP_XS_CLASS,
  SECTION_GAP_BOTTOM_CLASS,
  SIDEBAR_WIDTH_LG_CLASS,
  STACK_SPACING_SM_CLASS,
  TOUCH_TARGET_MIN_CLASS,
  TRUNCATE_BLOCK_CLASS,
} from "~/constants/layout";
import {
  BADGE_OUTLINE_SM_CLASS,
  BADGE_SM_CLASS,
  BADGE_SUCCESS_SM_CLASS,
} from "~/constants/layout-badges";
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
      :description="page.isCatalogEmpty.value ? '' : t('jobsPage.seoDescription')"
    >
      <template v-if="!page.isCatalogEmpty.value" #actions>
        <button
          type="button"
          :class="[OUTLINE_ACTION_CLASS]"
          :aria-label="t('jobsPage.aiMatchAria')"
          :disabled="page.matching.value"
          @click="page.handleAiMatch()"
        >
          <LoadingSpinner v-if="page.matching.value" size="sm" :label="t('jobsPage.aiMatchButton')" />
          <span v-else>{{ t("jobsPage.aiMatchButton") }}</span>
        </button>
        <button type="button"
          :class="[PRIMARY_ACTION_CLASS]"
          :aria-label="t('jobsPage.refreshAria')"
          :disabled="page.refreshing.value"
          @click="page.handleRefresh()"
        >
          <LoadingSpinner v-if="page.refreshing.value" size="sm" :label="t('jobsPage.refreshButton')" />
          <IconRefresh v-else :class="ICON_SIZE_XS_ALT_CLASS" />
          <span :class="LABEL_HIDE_BELOW_SM_CLASS">{{ t("jobsPage.refreshButton") }}</span>
        </button>
      </template>
    </PageHeroHeader>

    <nav
      class="tabs tabs-box"
      :class="[SECTION_GAP_BOTTOM_CLASS]"
      :aria-label="t('jobsPage.tabs.aria')"
    >
      <button
        v-for="tab in JOBS_INDEX_TABS"
        :key="tab"
        type="button"
        class="tab"
        :class="{ 'tab-active': page.activeTab.value === tab }"
        :aria-label="t(`jobsPage.tabs.${tab}Aria`)"
        :aria-pressed="page.activeTab.value === tab"
        @click="page.activeTab.value = tab"
      >
        {{ t(`jobsPage.tabs.${tab}`) }}
      </button>
    </nav>

    <template v-if="page.activeTab.value === 'browse'">
    <section
      v-if="page.recommendations.value.length > 0"
      :class="[SECTION_GAP_BOTTOM_CLASS]"
      :aria-label="t('jobsPage.recommendationsAria')"
    >
      <h2 :class="[CARD_TITLE_LG_CLASS, SECTION_GAP_BOTTOM_CLASS]">
        {{ t("jobsPage.recommendationsTitle") }}
      </h2>
      <SectionGrid grid-token="twoColumn">
        <UiGlassCard
          v-for="(job, index) in page.recommendations.value.slice(0, NUM_4)"
          :key="`rec-${job.id}`"
          :to="APP_ROUTE_BUILDERS.jobDetail(job.id)"
          :link-aria-label="t('jobsPage.openRecommendationAria', { title: job.title, company: job.company })"
          :stagger-index="Math.min(index, UI_STAGGER_INDEX_MAX)"
        >
          <div class="card-body relative z-10">
            <h3 :class="CARD_TITLE_LG_CLASS">{{ job.title }}</h3>
            <p :class="BODY_TEXT_SM_CLASS">{{ job.company }}</p>
          </div>
        </UiGlassCard>
      </SectionGrid>
    </section>

    <template v-if="!page.isCatalogEmpty.value">
      <UiSearchFilterBar
        v-model="page.searchQuery.value"
        :placeholder="t('jobsPage.searchPlaceholder')"
        :aria-label="t('jobsPage.searchAria')"
        :button-aria-label="t('jobsPage.searchButtonAria')"
        :show-mobile-filter-toggle="true"
        :mobile-toggle-aria-label="t('jobsPage.toggleFiltersAria')"
        :mobile-toggle-text="t('jobsPage.toggleFiltersButton')"
        :extra-class="SECTION_GAP_BOTTOM_CLASS"
        @search="page.handleSearch()"
        @toggle-filters="page.showFilters.value = !page.showFilters.value"
      >
        <template #search-text>{{ t("jobsPage.searchButton") }}</template>
      </UiSearchFilterBar>
    </template>

    <SectionGrid grid-token="sidebar">
      <div
        v-if="!page.isCatalogEmpty.value"
        :class="['shrink-0', SIDEBAR_WIDTH_LG_CLASS, { 'hidden lg:block': !page.showFilters.value }, FLUID_WIDTH_CLASS]"
      >
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
          @apply="page.showFilters.value = false"
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
            page.isCatalogEmpty.value
              ? 'jobsPage.configureProvidersButton'
              : 'jobsPage.clearFiltersButton'
          "
          :cta-aria-key="
            page.isCatalogEmpty.value
              ? 'jobsPage.configureProvidersAria'
              : 'jobsPage.clearFiltersAria'
          "
          :cta-to="
            page.isCatalogEmpty.value
              ? APP_ROUTE_BUILDERS.settingsSection('jobIntelligence')
              : ''
          "
          @cta="page.clearFilters()"
        >
          <template v-if="page.isCatalogEmpty.value" #actions>
            <button
              type="button"
              :class="[OUTLINE_ACTION_CLASS, TOUCH_TARGET_MIN_CLASS, FLUID_WIDTH_CLASS]"
              :aria-label="t('jobsPage.refreshAria')"
              :disabled="page.refreshing.value"
              @click="page.handleRefresh()"
            >
              <LoadingSpinner v-if="page.refreshing.value" size="sm" :label="t('jobsPage.refreshButton')" />
              <span v-else>{{ t("jobsPage.refreshButton") }}</span>
            </button>
          </template>
        </EmptyState>

        <div v-else>
          <SectionGrid grid-token="twoColumn" :extra-class="SECTION_GAP_BOTTOM_CLASS">
            <UiGlassCard
              v-for="(job, index) in page.paginatedJobs.value"
              :key="job.id"
              :to="APP_ROUTE_BUILDERS.jobDetail(job.id)"
              :link-aria-label="t('jobsPage.openJobAria', { title: job.title, company: job.company })"
              :stagger-index="Math.min(index, UI_STAGGER_INDEX_MAX)"
            >
              <div class="card-body relative z-10">
                <div :class="['flex items-start justify-between', ROW_GAP_XS_CLASS]">
                  <h3 :class="CARD_TITLE_LG_CLASS">{{ job.title }}</h3>
                  <JobMatchScore v-if="typeof job.matchScore === 'number'" :score="job.matchScore" compact />
                </div>

                <p class="font-medium text-secondary">{{ job.company }}</p>

                <div :class="[STACK_SPACING_SM_CLASS, 'flex flex-wrap', ROW_GAP_XS_CLASS]">
                  <span :class="[BADGE_SM_CLASS]">
                    <svg :class="['me-1', ICON_SIZE_CHEVRON_CLASS]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="ICON_DECORATIVE_STROKE_WIDTH" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {{ job.location }}
                  </span>

                  <span v-if="job.remote" :class="[BADGE_SUCCESS_SM_CLASS]">
                    {{ t("jobsPage.remoteBadge") }}
                  </span>

                  <span v-if="job.experienceLevel" :class="[BADGE_OUTLINE_SM_CLASS]">
                    {{ page.experienceOptionLabel(job.experienceLevel) }}
                  </span>
                </div>

                <p :class="['line-clamp-2', STACK_SPACING_SM_CLASS, BODY_TEXT_SM_CLASS]">
                  {{ job.description }}
                </p>

                <div
                  :class="[
                    'card-actions',
                    STACK_SPACING_SM_CLASS,
                    'items-center justify-between',
                    POINTER_EVENTS_TOKEN_CLASS.auto,
                  ]"
                >
                  <span :class="BODY_TEXT_XS_CLASS">
                    {{ page.formatDate(job.postedDate) }}
                  </span>
                  <div :class="['flex', ROW_GAP_XS_CLASS]">
                    <button type="button"
                      :class="[OUTLINE_ACTION_DENSE_CLASS]"
                      :aria-label="t('jobsPage.interviewAria', { title: job.title, company: job.company })"
                      @click.stop="page.interviewJob(job.id)"
                    >
                      {{ t("jobsPage.interviewButton") }}
                    </button>
                    <button type="button"
                      :class="[PRIMARY_ACTION_CLASS]"
                      :aria-label="t('jobsPage.viewAria', { title: job.title, company: job.company })"
                      @click.stop="page.viewJob(job.id)"
                    >
                      {{ t("jobsPage.viewButton") }}
                    </button>
                  </div>
                </div>
              </div>
            </UiGlassCard>
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
    </template>

    <section
      v-else-if="page.activeTab.value === 'saved'"
      :aria-label="t('jobsPage.tabs.savedAria')"
    >
      <LoadingSkeleton
        v-if="page.savedJobsStatus.value === 'pending'"
        variant="cards"
      />

      <BootstrapErrorAlert
        v-else-if="page.savedJobsError.value"
        :message="getErrorMessage(page.savedJobsError.value, t('jobsPage.saved.errorTitle'))"
        :retry-label="t('jobsPage.saved.retryButton')"
        :retry-aria-label="t('jobsPage.saved.retryAria')"
        @retry="() => page.refreshSavedJobs()"
      />

      <EmptyState
        v-else-if="page.savedJobs.value.length === 0"
        title-key="jobsPage.saved.emptyTitle"
        description-key="jobsPage.saved.emptyDescription"
        cta-label-key="jobsPage.saved.emptyCta"
        cta-aria-key="jobsPage.saved.emptyCtaAria"
        @cta="page.activeTab.value = JOBS_INDEX_TABS[0]"
      />

      <SectionGrid v-else grid-token="twoColumn">
        <UiGlassCard
          v-for="(job, index) in page.savedJobs.value"
          :key="`saved-${job.id}`"
          :to="APP_ROUTE_BUILDERS.jobDetail(job.id)"
          :link-aria-label="t('jobsPage.saved.openSavedAria', { title: job.title, company: job.company })"
          :stagger-index="Math.min(index, UI_STAGGER_INDEX_MAX)"
        >
          <div class="card-body relative z-10">
            <h3 :class="CARD_TITLE_LG_CLASS">{{ job.title }}</h3>
            <p class="font-medium text-secondary">{{ job.company }}</p>
            <div :class="[STACK_SPACING_SM_CLASS, 'flex flex-wrap', ROW_GAP_XS_CLASS]">
              <span :class="[BADGE_SM_CLASS]">{{ job.location }}</span>
              <span v-if="job.remote" :class="[BADGE_SUCCESS_SM_CLASS]">
                {{ t("jobsPage.remoteBadge") }}
              </span>
            </div>
            <p :class="BODY_TEXT_XS_CLASS">{{ page.formatDate(job.postedDate) }}</p>
          </div>
        </UiGlassCard>
      </SectionGrid>
    </section>

    <section
      v-else
      :aria-label="t('jobsPage.tabs.appliedAria')"
    >
      <LoadingSkeleton
        v-if="page.applicationsStatus.value === 'pending'"
        variant="cards"
      />

      <BootstrapErrorAlert
        v-else-if="page.applicationsError.value"
        :message="getErrorMessage(page.applicationsError.value, t('jobsPage.applied.errorTitle'))"
        :retry-label="t('jobsPage.applied.retryButton')"
        :retry-aria-label="t('jobsPage.applied.retryAria')"
        @retry="() => page.refreshApplications()"
      />

      <EmptyState
        v-else-if="page.applications.value.length === 0"
        title-key="jobsPage.applied.emptyTitle"
        description-key="jobsPage.applied.emptyDescription"
        cta-label-key="jobsPage.applied.emptyCta"
        cta-aria-key="jobsPage.applied.emptyCtaAria"
        @cta="page.activeTab.value = JOBS_INDEX_TABS[0]"
      />

      <SectionGrid v-else grid-token="twoColumn">
        <UiGlassCard
          v-for="(application, index) in page.applications.value"
          :key="`applied-${application.id}`"
          :to="APP_ROUTE_BUILDERS.jobDetail(application.job.id)"
          :link-aria-label="
            t('jobsPage.applied.openApplicationAria', {
              title: application.job.title,
              company: application.job.company,
            })
          "
          :stagger-index="Math.min(index, UI_STAGGER_INDEX_MAX)"
        >
          <div class="card-body relative z-10">
            <div :class="['flex items-start justify-between', ROW_GAP_XS_CLASS]">
              <h3 :class="CARD_TITLE_LG_CLASS">{{ application.job.title }}</h3>
              <span :class="[BADGE_OUTLINE_SM_CLASS]">
                {{ page.applicationStatusLabel(application.status) }}
              </span>
            </div>
            <p class="font-medium text-secondary">{{ application.job.company }}</p>
            <p :class="BODY_TEXT_XS_CLASS">
              {{
                t("jobsPage.applied.appliedOn", {
                  date: page.formatDate(application.appliedDate),
                })
              }}
            </p>
          </div>
        </UiGlassCard>
      </SectionGrid>
    </section>
  </PageScaffold>
</template>
