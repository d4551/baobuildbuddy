<script setup lang="ts">
import {
  FLEX_GAP_TOKEN_CLASS,
  FLUID_WIDTH_CLASS,
  FORM_WIDTH_32_CLASS,
  MARGIN_TOKEN_CLASS,
  OUTLINE_ACTION_CLASS,
  RADIUS_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "~/constants/layout";
import {
  BADGE_LG_CLASS,
} from "~/constants/layout-badges";

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
          :class="[OUTLINE_ACTION_CLASS]"
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
      cta-label-key="studioAnalytics.openDirectoryButton"
      cta-aria-key="studioAnalytics.openDirectoryAria"
      :cta-to="APP_ROUTES.studios"
    />

    <div v-else :class="[STACK_SPACE_Y_TOKEN_CLASS.stack6]">
      <div class="stats stats-vertical lg:stats-horizontal bg-base-200" :class="[FLUID_WIDTH_CLASS]">
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

      <UiGlassCard>
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.byTypeTitle") }}</h2>

          <SectionGrid grid-token="twoToFourLg">
            <div v-for="[type, count] in byTypeEntries" :key="type" class="stat bg-base-200" :class="[RADIUS_TOKEN_CLASS.lg]">
              <div class="stat-title" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ type }}</div>
              <div class="stat-value" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ count }}</div>
              <div class="stat-desc">
                {{ t("studioAnalytics.overview.percentageOfTotal", { value: totalStudios > 0 ? Math.round((count / totalStudios) * 100) : 0 }) }}
              </div>
            </div>
          </SectionGrid>
        </div>
      </UiGlassCard>

      <UiGlassCard>
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.bySizeTitle") }}</h2>

          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack4]">
            <div
              v-for="[size, count] in bySizeEntries"
              :key="size"
            >
              <div class="flex justify-between items-center" :class="[MARGIN_TOKEN_CLASS.mb2]">
                <span class="font-medium">{{ size }}</span>
                <span :class="[BADGE_LG_CLASS]">{{ count }}</span>
              </div>
              <progress
                class="progress progress-primary" :class="[FLUID_WIDTH_CLASS]"
                :value="count"
                :max="Math.max(1, totalStudios)"
                :aria-label="t('studioAnalytics.progressAria', { label: size })"
              ></progress>
            </div>
          </div>
        </div>
      </UiGlassCard>

      <UiGlassCard>
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.topTechnologiesTitle") }}</h2>
          <p class="text-secondary" :class="[MARGIN_TOKEN_CLASS.mb4, TYPOGRAPHY_SCALE_CLASS.sm]">
            {{ t("studioAnalytics.sections.topTechnologiesDescription") }}
          </p>

          <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack3]">
            <div
              v-for="tech in topTechnologies"
              :key="tech.name"
              class="flex items-center" :class="[FLEX_GAP_TOKEN_CLASS.gap3]"
            >
              <span class="font-medium" :class="[FORM_WIDTH_32_CLASS]">{{ tech.name }}</span>
              <div class="flex-1">
                <progress
                  class="progress progress-primary" :class="[FLUID_WIDTH_CLASS]"
                  :value="tech.count"
                  :max="getMaxCount(topTechnologies)"
                  :aria-label="t('studioAnalytics.progressAria', { label: tech.name })"
                ></progress>
              </div>
              <span class="badge">{{ tech.count }}</span>
            </div>
          </div>
        </div>
      </UiGlassCard>

      <UiGlassCard>
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.remoteAvailabilityTitle") }}</h2>

          <div class="stats stats-vertical bg-base-200 sm:stats-horizontal" :class="[FLUID_WIDTH_CLASS]">
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

          <div :class="[MARGIN_TOKEN_CLASS.mt4]">
            <progress
              class="progress progress-primary" :class="[FLUID_WIDTH_CLASS]"
              :value="remoteWorkStudios"
              :max="Math.max(1, totalStudios)"
              :aria-label="t('studioAnalytics.remoteWorkProgressAria', { value: remoteWorkPercentage })"
            ></progress>
          </div>

          <SectionGrid grid-token="twoColumnSm" :extra-class="MARGIN_TOKEN_CLASS.mt4">
            <div class="stat bg-base-200" :class="[RADIUS_TOKEN_CLASS.lg]">
              <div class="stat-title" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("studioAnalytics.sections.remoteFriendlyTitle") }}</div>
              <div class="stat-value text-success" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ remoteWorkStudios }}</div>
            </div>

            <div class="stat bg-base-200" :class="[RADIUS_TOKEN_CLASS.lg]">
              <div class="stat-title" :class="[TYPOGRAPHY_SCALE_CLASS.xs]">{{ t("studioAnalytics.sections.onSiteOnlyTitle") }}</div>
              <div class="stat-value text-warning" :class="[TYPOGRAPHY_SCALE_CLASS.xl2]">{{ onSiteOnlyCount }}</div>
            </div>
          </SectionGrid>
        </div>
      </UiGlassCard>
    </div>
  </PageScaffold>
</template>
