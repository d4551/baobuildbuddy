import { AI_PROVIDER_DEFAULT } from "@bao/shared/constants/ai-provider";
import type { AIProviderType } from "@bao/shared/types/ai";
import { useI18n } from "vue-i18n";
import type {
  DashboardStats,
  ProviderConfig,
  ProviderConnectivityResult,
} from "~/types/ai-dashboard";
import {
  buildFallbackProviderRows,
  normalizeProviderRows,
  resolveProviderModelSelection,
} from "~/utils/ai-control-plane";

export type DashboardBootstrap = {
  activeModel: string;
  activeProvider: AIProviderType;
  normalizedStats: DashboardStats;
  resolvedProviders: ProviderConfig[];
};

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumberField(payload: Record<string, unknown>, key: string): number | undefined {
  return asNumber(payload[key]);
}

function normalizeDashboardStats(
  usagePayload: unknown,
  activeProvider: AIProviderType,
): DashboardStats {
  if (!isRecord(usagePayload)) {
    return {
      totalRequests: 0,
      successRate: 0,
      averageResponseTimeSeconds: 0,
      activeProvider,
      sessions: 0,
    };
  }

  const totalMessages = readNumberField(usagePayload, "totalMessages") ?? 0;
  const userMessages = readNumberField(usagePayload, "userMessages") ?? 0;
  const assistantMessages = readNumberField(usagePayload, "assistantMessages") ?? 0;
  const sessions = readNumberField(usagePayload, "sessions") ?? 0;
  const successRate =
    userMessages > 0
      ? Math.round((assistantMessages / userMessages) * 100)
      : totalMessages > 0
        ? 100
        : 0;

  return {
    totalRequests: totalMessages,
    successRate,
    averageResponseTimeSeconds: 0,
    activeProvider,
    sessions,
  };
}

function useAIDashboardDependencies() {
  const { t } = useI18n();
  const { settings, fetchSettings, testApiKey, chatRoutingPreference, localProviderState } =
    useSettings();
  const { $toast } = useNuxtApp();
  const api = useApi();

  return {
    api,
    chatRoutingPreference,
    fetchSettings,
    localProviderState,
    settings,
    t,
    testApiKey,
    toast: $toast,
  };
}

function useDashboardBootstrap(input: {
  api: ReturnType<typeof useApi>;
  fetchSettings: ReturnType<typeof useSettings>["fetchSettings"];
  settings: ReturnType<typeof useSettings>["settings"];
  chatRoutingPreference: ReturnType<typeof useSettings>["chatRoutingPreference"];
  t: ReturnType<typeof useI18n>["t"];
  resolveDefaultModel: (providerId: AIProviderType) => string;
}) {
  async function loadDashboardState(): Promise<DashboardBootstrap> {
    if (!input.settings.value) {
      await input.fetchSettings();
    }
    const [usageResult, modelsResult] = await Promise.all([
      input.api.ai.usage.get(),
      input.api.ai.models.get(),
    ]);

    if (usageResult.error) {
      throw new Error(input.t("aiDashboard.errors.usageLoadFailed"));
    }
    if (modelsResult.error) {
      throw new Error(input.t("aiDashboard.errors.modelsLoadFailed"));
    }

    const normalizedProviders = normalizeProviderRows(modelsResult.data, input.settings.value);
    const resolvedProviders =
      normalizedProviders.length > 0
        ? normalizedProviders
        : buildFallbackProviderRows(input.settings.value);
    const activeProvider = resolvedProviders.some(
      (provider) => provider.id === input.chatRoutingPreference.value.provider,
    )
      ? input.chatRoutingPreference.value.provider
      : (resolvedProviders[0]?.id ?? AI_PROVIDER_DEFAULT);
    const activeProviderModels =
      resolvedProviders.find((provider) => provider.id === activeProvider)?.models ?? [];

    return {
      resolvedProviders,
      activeProvider,
      activeModel:
        resolveProviderModelSelection(activeProvider, input.settings.value, activeProviderModels) ||
        input.resolveDefaultModel(activeProvider),
      normalizedStats: normalizeDashboardStats(usageResult.data, activeProvider),
    };
  }

  return useAsyncData("ai-dashboard-bootstrap", loadDashboardState, {
    server: true,
    lazy: false,
  });
}

export function createAIDashboardRuntime() {
  return {
    dependencies: useAIDashboardDependencies(),
    testingProvider: ref<AIProviderType | null>(null),
    testResults: reactive<Record<AIProviderType, ProviderConnectivityResult | null>>({
      local: null,
      gemini: null,
      openai: null,
      claude: null,
      huggingface: null,
    }),
  };
}

export function createAIDashboardBootstrapState(
  runtime: ReturnType<typeof createAIDashboardRuntime>,
  resolveDefaultModel: (providerId: AIProviderType) => string,
) {
  const {
    data: dashboardBootstrap,
    error: dashboardBootstrapError,
    refresh: refreshDashboardBootstrap,
    status: dashboardBootstrapStatus,
  } = useDashboardBootstrap({
    api: runtime.dependencies.api,
    fetchSettings: runtime.dependencies.fetchSettings,
    settings: runtime.dependencies.settings,
    chatRoutingPreference: runtime.dependencies.chatRoutingPreference,
    t: runtime.dependencies.t,
    resolveDefaultModel,
  });

  return {
    dashboardBootstrap,
    dashboardBootstrapError,
    dashboardBootstrapStatus,
    refreshDashboardBootstrap,
  };
}
