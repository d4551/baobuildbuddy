<script setup lang="ts">
import { APP_ROUTES } from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

type ApiClient = ReturnType<typeof useApi>;
type AnalyticsResponse = Awaited<ReturnType<ApiClient["studios"]["analytics"]["get"]>>["data"];
type AnalyticsByBreakdown = Record<string, number>;
type AnalyticsTechnology = {
  name: string;
  count: number;
};

type StudioAnalytics = {
  totalStudios: number;
  byType: AnalyticsByBreakdown;
  bySize: AnalyticsByBreakdown;
  remoteWorkStudios: number;
  topTechnologies: AnalyticsTechnology[];
};

const { $toast } = useNuxtApp();
const api = useApi();
const { t } = useI18n();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("studioAnalytics.title"),
    description: t("studiosIndex.seoDescription"),
  });
}

const analytics = ref<StudioAnalytics | null>(null);
const pageError = ref<string | null>(null);

const totalStudios = computed(() => analytics.value?.totalStudios ?? 0);
const remoteWorkStudios = computed(() => analytics.value?.remoteWorkStudios ?? 0);
const remoteWorkPercentage = computed(() => {
  if (totalStudios.value === 0) return 0;
  return Math.round((remoteWorkStudios.value / totalStudios.value) * 100);
});
const byTypeEntries = computed(() => Object.entries(analytics.value?.byType ?? {}));
const bySizeEntries = computed(() => Object.entries(analytics.value?.bySize ?? {}));
const topTechnologies = computed(() => analytics.value?.topTechnologies ?? []);
const indieStudiosCount = computed(() => analytics.value?.byType.Indie ?? 0);
const onSiteOnlyCount = computed(() => Math.max(0, totalStudios.value - remoteWorkStudios.value));

const { pending: loading, refresh: refreshAnalytics } = await useAsyncData(
  "studio-analytics",
  async () => {
    await fetchAnalytics();
    return analytics.value;
  },
);

function mapAnalyticsResponse(data: AnalyticsResponse): StudioAnalytics | null {
  if (!data) return null;
  return {
    totalStudios: typeof data.totalStudios === "number" ? data.totalStudios : 0,
    byType: data.byType ?? {},
    bySize: data.bySize ?? {},
    remoteWorkStudios: typeof data.remoteWorkStudios === "number" ? data.remoteWorkStudios : 0,
    topTechnologies: Array.isArray(data.topTechnologies)
      ? data.topTechnologies.map((technology) => ({
          name: technology.name,
          count: technology.count,
        }))
      : [],
  };
}

function showErrorToast(message: string) {
  if (import.meta.client) {
    $toast.error(message);
  }
}

async function fetchAnalytics() {
  pageError.value = null;
  const analyticsResult = await settlePromise(
    api.studios.analytics.get(),
    t("studioAnalytics.errors.loadFailed"),
  );
  if (!analyticsResult.ok) {
    pageError.value = getErrorMessage(
      analyticsResult.error,
      t("studioAnalytics.errors.loadFailed"),
    );
    showErrorToast(pageError.value);
    return;
  }

  const { data, error } = analyticsResult.value;
  if (error) {
    pageError.value = getErrorMessage(error, t("studioAnalytics.errors.loadFailed"));
    showErrorToast(pageError.value);
    return;
  }

  analytics.value = mapAnalyticsResponse(data);
}

function getMaxCount(items: readonly AnalyticsTechnology[]) {
  return Math.max(1, ...items.map((item) => item.count));
}
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

      <div class="card card-border bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.byTypeTitle") }}</h2>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div v-for="[type, count] in byTypeEntries" :key="type" class="stat rounded-lg bg-base-200">
              <div class="stat-title text-xs">{{ type }}</div>
              <div class="stat-value text-2xl">{{ count }}</div>
              <div class="stat-desc">
                {{ t("studioAnalytics.overview.percentageOfTotal", { value: totalStudios > 0 ? Math.round((count / totalStudios) * 100) : 0 }) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card card-border bg-base-100 shadow-sm">
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

      <div class="card card-border bg-base-100 shadow-sm">
        <div class="card-body">
          <h2 class="card-title">{{ t("studioAnalytics.sections.topTechnologiesTitle") }}</h2>
          <p class="mb-4 text-sm text-base-content/70">
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

      <div class="card card-border bg-base-100 shadow-sm">
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

          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="stat rounded-lg bg-base-200">
              <div class="stat-title text-xs">{{ t("studioAnalytics.sections.remoteFriendlyTitle") }}</div>
              <div class="stat-value text-success text-2xl">{{ remoteWorkStudios }}</div>
            </div>

            <div class="stat rounded-lg bg-base-200">
              <div class="stat-title text-xs">{{ t("studioAnalytics.sections.onSiteOnlyTitle") }}</div>
              <div class="stat-value text-warning text-2xl">{{ onSiteOnlyCount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>
