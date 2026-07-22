import { isRecord } from "@bao/shared/utils/type-guards";
import type { ComputedRef, Ref } from "vue";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";
import { PERCENT_MAX } from "@bao/shared/constants/numeric";

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

type StudioAnalyticsLoadResult = {
  data: StudioAnalytics | null;
  errorMessage: string | null;
};

type StudioAnalyticsMetrics = {
  bySizeEntries: ComputedRef<[string, number][]>;
  byTypeEntries: ComputedRef<[string, number][]>;
  indieStudiosCount: ComputedRef<number>;
  onSiteOnlyCount: ComputedRef<number>;
  remoteWorkPercentage: ComputedRef<number>;
  remoteWorkStudios: ComputedRef<number>;
  topTechnologies: ComputedRef<AnalyticsTechnology[]>;
  totalStudios: ComputedRef<number>;
};

function toBreakdown(value: unknown): AnalyticsByBreakdown {
  if (!isRecord(value)) {
    return {};
  }

  const breakdown: AnalyticsByBreakdown = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number") {
      breakdown[key] = entry;
    }
  }

  return breakdown;
}

function toTechnology(value: unknown): AnalyticsTechnology | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = typeof value.name === "string" ? value.name : "";
  const count = typeof value.count === "number" ? value.count : 0;
  if (!name) {
    return null;
  }

  return { name, count };
}

function mapAnalyticsResponse(data: unknown): StudioAnalytics | null {
  if (!isRecord(data)) {
    return null;
  }

  return {
    totalStudios: typeof data.totalStudios === "number" ? data.totalStudios : 0,
    byType: toBreakdown(data.byType),
    bySize: toBreakdown(data.bySize),
    remoteWorkStudios: typeof data.remoteWorkStudios === "number" ? data.remoteWorkStudios : 0,
    topTechnologies: Array.isArray(data.topTechnologies)
      ? data.topTechnologies
          .map((technology) => toTechnology(technology))
          .filter((technology): technology is AnalyticsTechnology => technology !== null)
      : [],
  };
}

function createStudioAnalyticsMetrics(
  analytics: Ref<StudioAnalytics | null> | ComputedRef<StudioAnalytics | null>,
): StudioAnalyticsMetrics {
  const totalStudios = computed(() => analytics.value?.totalStudios ?? 0);
  const remoteWorkStudios = computed(() => analytics.value?.remoteWorkStudios ?? 0);
  const remoteWorkPercentage = computed(() => {
    if (totalStudios.value === 0) {
      return 0;
    }

    return Math.round((remoteWorkStudios.value / totalStudios.value) * PERCENT_MAX);
  });
  const byTypeEntries = computed(() => Object.entries(analytics.value?.byType ?? {}));
  const bySizeEntries = computed(() => Object.entries(analytics.value?.bySize ?? {}));
  const topTechnologies = computed(() => analytics.value?.topTechnologies ?? []);
  const indieStudiosCount = computed(() => analytics.value?.byType.Indie ?? 0);
  const onSiteOnlyCount = computed(() => Math.max(0, totalStudios.value - remoteWorkStudios.value));

  return {
    bySizeEntries,
    byTypeEntries,
    indieStudiosCount,
    onSiteOnlyCount,
    remoteWorkPercentage,
    remoteWorkStudios,
    topTechnologies,
    totalStudios,
  };
}

function getMaxCount(items: readonly AnalyticsTechnology[]): number {
  return Math.max(1, ...items.map((item) => item.count));
}

async function loadStudioAnalyticsData(
  api: ReturnType<typeof useApi>,
  loadFailedMessage: string,
): Promise<StudioAnalyticsLoadResult> {
  const analyticsResult = await settlePromise(api.studios.analytics.get(), loadFailedMessage);
  if (!analyticsResult.ok) {
    return {
      data: null,
      errorMessage: getErrorMessage(analyticsResult.error, loadFailedMessage),
    };
  }

  const { data, error } = analyticsResult.value;
  if (error) {
    return {
      data: null,
      errorMessage: getErrorMessage(error, loadFailedMessage),
    };
  }

  return {
    data: mapAnalyticsResponse(data),
    errorMessage: null,
  };
}

/**
 * Studio analytics page state. Payload must flow through `useAsyncData` `data`
 * so SSR HTML and client hydration share one owner (no orphan `ref(null)`).
 */
export function useStudioAnalyticsPage() {
  const { $toast } = useNuxtApp();
  const api = useApi();
  const { t } = useI18n();
  const loadFailedMessage = t("studioAnalytics.errors.loadFailed");

  const {
    data: analyticsPayload,
    pending: loading,
    refresh: refreshAnalytics,
    error: asyncError,
  } = useAsyncData(
    "studio-analytics",
    async () => {
      const result = await loadStudioAnalyticsData(api, loadFailedMessage);
      if (result.errorMessage && import.meta.client) {
        $toast.error(result.errorMessage);
      }
      return result;
    },
    { lazy: false, server: true },
  );

  const analytics = computed(() => analyticsPayload.value?.data ?? null);
  const pageError = computed(
    () =>
      analyticsPayload.value?.errorMessage ??
      (asyncError.value ? getErrorMessage(asyncError.value, loadFailedMessage) : null),
  );
  const metrics = createStudioAnalyticsMetrics(analytics);

  return {
    analytics,
    getMaxCount,
    loading,
    pageError,
    refreshAnalytics,
    ...metrics,
  };
}
