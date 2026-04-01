import type { AIProviderType } from "@bao/shared/types/ai";
import type { ComputedRef, Ref } from "vue";
import type {
  DashboardStats,
  ProviderConfig,
  ProviderConnectivityResult,
  ProviderHealth,
} from "~/types/ai-dashboard";
import {
  isProviderConfigured as isConfiguredProviderFromSettings,
  resolveProviderMetadata,
} from "~/utils/ai-control-plane";

type Translate = (key: string, params?: Record<string, unknown>) => string;

const HEALTH_LABEL_KEY_BY_VALUE: Record<ProviderHealth, string> = {
  healthy: "aiDashboard.health.healthy",
  degraded: "aiDashboard.health.degraded",
  down: "aiDashboard.health.down",
  unconfigured: "aiDashboard.health.unconfigured",
};

const HEALTH_BADGE_CLASS_BY_VALUE: Record<ProviderHealth, string> = {
  healthy: "badge-success",
  degraded: "badge-warning",
  down: "badge-error",
  unconfigured: "badge-ghost",
};

export function createDashboardProviderPresentation(
  t: Translate,
  settings: ReturnType<typeof useSettings>["settings"],
) {
  function isProviderConfigured(providerId: AIProviderType): boolean {
    return isConfiguredProviderFromSettings(settings.value, providerId);
  }

  function providerAvailabilityLabel(available: boolean): string {
    return available
      ? t("aiDashboard.availability.available")
      : t("aiDashboard.availability.unavailable");
  }

  function providerHealthLabel(health: ProviderHealth): string {
    return t(HEALTH_LABEL_KEY_BY_VALUE[health]);
  }

  function providerHealthBadgeClass(health: ProviderHealth): string {
    return HEALTH_BADGE_CLASS_BY_VALUE[health];
  }

  function providerLabel(providerId: AIProviderType): string {
    const catalogEntry = resolveProviderMetadata(providerId);
    if (!catalogEntry) {
      return providerId;
    }
    return t(catalogEntry.nameKey);
  }

  function providerDescription(providerId: AIProviderType): string {
    const catalogEntry = resolveProviderMetadata(providerId);
    if (!catalogEntry) {
      return "";
    }
    return t(catalogEntry.descriptionKey);
  }

  function providerSelectOptionLabel(provider: ProviderConfig): string {
    const providerName = providerLabel(provider.id);
    if (isProviderConfigured(provider.id)) {
      return providerName;
    }
    return t("aiDashboard.preference.providerNotConfiguredOption", { provider: providerName });
  }

  return {
    isProviderConfigured,
    providerAvailabilityLabel,
    providerDescription,
    providerHealthBadgeClass,
    providerHealthLabel,
    providerLabel,
    providerSelectOptionLabel,
  };
}

export function createDashboardStatsPresentation(
  providerStats: ComputedRef<DashboardStats | null>,
  t: Translate,
  providerLabel: (providerId: AIProviderType) => string,
) {
  const activeProviderLabel = computed(() =>
    providerStats.value ? providerLabel(providerStats.value.activeProvider) : "",
  );

  const statsItems = computed(() =>
    providerStats.value
      ? [
          {
            titleKey: "aiDashboard.stats.totalRequestsTitle",
            value: providerStats.value.totalRequests,
            valueClass: "text-primary",
            descKey: "aiDashboard.stats.totalRequestsDesc",
          },
          {
            titleKey: "aiDashboard.stats.successRateTitle",
            value: `${providerStats.value.successRate}%`,
            valueClass: "text-success",
            descKey: "aiDashboard.stats.successRateDesc",
          },
          {
            titleKey: "aiDashboard.stats.averageResponseTitle",
            value: t("aiDashboard.stats.averageResponseValue", {
              seconds: providerStats.value.averageResponseTimeSeconds,
            }),
            valueClass: "text-secondary",
            descKey: "aiDashboard.stats.averageResponseDesc",
          },
          {
            titleKey: "aiDashboard.stats.sessionsTitle",
            value: providerStats.value.sessions,
            valueClass: "text-accent",
            descKey: "aiDashboard.stats.sessionsDesc",
            descInterpolation: { provider: activeProviderLabel.value },
          },
        ]
      : [],
  );

  return {
    statsItems,
  };
}

export function buildAIDashboardViewModel(input: {
  dashboardBootstrapError: Ref<unknown>;
  loading: ComputedRef<boolean>;
  providerPresentation: ReturnType<typeof createDashboardProviderPresentation>;
  providerStats: ComputedRef<DashboardStats | null>;
  providers: ComputedRef<ProviderConfig[]>;
  selection: {
    selectedModel: Ref<string>;
    selectedProvider: Ref<AIProviderType>;
    selectedProviderModels: ComputedRef<string[]>;
  };
  statsPresentation: ReturnType<typeof createDashboardStatsPresentation>;
  actions: {
    fetchProviderStats: () => Promise<void>;
    handleSetPreference: () => Promise<void>;
    handleTestProvider: (providerId: AIProviderType) => Promise<void>;
  };
  testResults: Record<AIProviderType, ProviderConnectivityResult | null>;
  testingProvider: Ref<AIProviderType | null>;
  t: Translate;
}) {
  return {
    dashboardBootstrapError: input.dashboardBootstrapError,
    ...input.actions,
    ...input.providerPresentation,
    loading: input.loading,
    providerStats: input.providerStats,
    providers: input.providers,
    selectedModel: input.selection.selectedModel,
    selectedProvider: input.selection.selectedProvider,
    selectedProviderModels: input.selection.selectedProviderModels,
    statsItems: input.statsPresentation.statsItems,
    testResults: input.testResults,
    testingProvider: input.testingProvider,
    t: input.t,
  };
}
