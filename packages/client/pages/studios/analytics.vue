<script setup lang="ts">
import { SHADOW_TOKEN_CLASS, RADIUS_TOKEN_CLASS } from "~/constants/layout";
definePageMeta({
  middleware: ["auth"],
});

import { APP_ROUTES } from "@bao/shared/constants/routes";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const {
  analytics,
  bySizeEntries,
  byTypeEntries,
  getMaxCount,
  indieStudiosCount,
  loading,
  onSiteOnlyCount,
  pageError,
  refreshAnalytics,
  remoteWorkPercentage,
  remoteWorkStudios,
  topTechnologies,
  totalStudios,
} = useStudioAnalyticsPage();

useSeoMeta({
  title: t("studioAnalytics.title"),
  description: t("studiosIndex.seoDescription"),
});
</script>

<template>
  <PageScaffold tag="section" width-token="content" labelled-by="studio-analytics-title">
    <PageHeroHeader
      title-id="studio-analytics-title"
      :title="t('studioAnalytics.title')"
      :description="t('studioAnalytics.description')"
    >
      <template #actions>
        <NuxtLink
          :to="APP_ROUTES.studios"
          class="btn btn-outline"
          :aria-label="t('studioAnalytics.openDirectoryAria')"
        >
          {{ t("studiosIndex.title") }}
        </NuxtLink>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="loading && !analytics" :lines="8" />

    <BootstrapErrorAlert
      v-else-if="pageError"
      :title="t('studioAnalytics.title')"
      :message="pageError"
      :retry-label="t('studioAnalytics.retryButton')"
      :retry-aria-label="t('studioAnalytics.retryAria')"
      @retry="() => refreshAnalytics()"
    />

    <EmptyState
      v-else-if="!analytics"
      title-key="studioAnalytics.emptyTitle"
      description-key="studioAnalytics.emptyDescription"
      cta-label-key="studioAnalytics.retryButton"
      :cta-to="APP_ROUTES.studios"
    />

    <div v-else class="space-y-6">
      <div class="stats stats-vertical lg:stats-horizontal w-full bg-base-200">
        <div class="stat">
          <div class="stat-title">{{ t("studioAnalytics.overview.totalStudiosTitle") }}</div>
          <div class="stat-value text-primary">{{ totalStudios }}</div>
          <div class="stat-desc">{{ t("studioAnalytics.overview.totalStudiosDesc") }}</div>
        </div>

        <div class="stat">
          <div class="stat-title">{{ t("studioAnalytics.overview.remoteFriendlyTitle") }}</div>
          <div class="stat-value text-success">{{ remoteWorkPercentage }}%</div>
          <div class="stat-desc">{{ t("studioAnalytics.overview.remoteFriendlyDesc") }}</div>
        </div>

        <div class="stat">
          <div class="stat-title">{{ t("studioAnalytics.overview.indieStudiosTitle") }}</div>
          <div class="stat-value text-warning">{{ indieStudiosCount }}</div>
          <div class="stat-desc">
            {{ t("studioAnalytics.overview.percentageOfTotal", { value: totalStudios > 0 ? Math.round((indieStudiosCount / totalStudios) * 100) : 0 }) }}
          </div>
        </div>
      </div>

      <div class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.byTypeTitle") }}</h2>

          <SectionGrid grid-token="twoToFourLg">
            <div v-for="[type, count] in byTypeEntries" :key="type" class="stat bg-base-200" :class="[RADIUS_TOKEN_CLASS.lg]">
              <div class="stat-title text-xs">{{ type }}</div>
              <div class="stat-value text-2xl">{{ count }}</div>
              <div class="stat-desc">
                {{ t("studioAnalytics.overview.percentageOfTotal", { value: totalStudios > 0 ? Math.round((count / totalStudios) * 100) : 0 }) }}
              </div>
            </div>
          </SectionGrid>
        </div>
      </div>

      <div class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.bySizeTitle") }}</h2>

          <div class="space-y-4">
            <div
              v-for="[size, count] in bySizeEntries"
              :key="size"
            >
              <div class="flex justify-between items-center mb-2">
                <span class="font-medium">{{ size }}</span>
                <span class="badge badge-lg">{{ count }}</span>
              </div>
              <progress
                class="progress progress-primary w-full"
                :value="count"
                :max="Math.max(1, totalStudios)"
                :aria-label="t('studioAnalytics.progressAria', { label: size })"
              ></progress>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.topTechnologiesTitle") }}</h2>
          <p class="mb-4 text-sm text-secondary">
            {{ t("studioAnalytics.sections.topTechnologiesDescription") }}
          </p>

          <div class="space-y-3">
            <div
              v-for="tech in topTechnologies"
              :key="tech.name"
              class="flex items-center gap-3"
            >
              <span class="w-32 font-medium">{{ tech.name }}</span>
              <div class="flex-1">
                <progress
                  class="progress progress-primary w-full"
                  :value="tech.count"
                  :max="getMaxCount(topTechnologies)"
                  :aria-label="t('studioAnalytics.progressAria', { label: tech.name })"
                ></progress>
              </div>
              <span class="badge">{{ tech.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-border bg-base-100" :class="[SHADOW_TOKEN_CLASS.sm]">
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.remoteAvailabilityTitle") }}</h2>

          <div class="stats stats-vertical w-full bg-base-200 sm:stats-horizontal">
            <div class="stat">
              <div class="stat-title">
                {{ t("studioAnalytics.sections.offerRemoteLabel") }}
              </div>
              <div class="stat-value text-success">{{ remoteWorkPercentage }}%</div>
              <div class="stat-desc">
                {{ t("studioAnalytics.remoteWorkProgressAria", { value: remoteWorkPercentage }) }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-title">
                {{ t("studioAnalytics.sections.remoteFriendlyTitle") }}
              </div>
              <div class="stat-value text-success">{{ remoteWorkStudios }}</div>
              <div class="stat-desc">
                {{ t("studioAnalytics.overview.remoteFriendlyDesc") }}
              </div>
            </div>
          </div>

          <div class="mt-4">
            <progress
              class="progress progress-primary w-full"
              :value="remoteWorkStudios"
              :max="Math.max(1, totalStudios)"
              :aria-label="t('studioAnalytics.remoteWorkProgressAria', { value: remoteWorkPercentage })"
            ></progress>
          </div>

          <SectionGrid grid-token="twoColumnSm" extra-class="mt-4">
            <div class="stat bg-base-200" :class="[RADIUS_TOKEN_CLASS.lg]">
              <div class="stat-title text-xs">{{ t("studioAnalytics.sections.remoteFriendlyTitle") }}</div>
              <div class="stat-value text-success text-2xl">{{ remoteWorkStudios }}</div>
            </div>

            <div class="stat bg-base-200" :class="[RADIUS_TOKEN_CLASS.lg]">
              <div class="stat-title text-xs">{{ t("studioAnalytics.sections.onSiteOnlyTitle") }}</div>
              <div class="stat-value text-warning text-2xl">{{ onSiteOnlyCount }}</div>
            </div>
          </SectionGrid>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>
