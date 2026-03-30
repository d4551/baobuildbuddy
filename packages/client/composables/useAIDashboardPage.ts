import {
  AI_PROVIDER_DEFAULT,
  AI_ROUTING_PURPOSE_IDS,
  type AIProviderType,
  type AIRouting,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import type { ComputedRef, Ref } from "vue";
import { settlePromise } from "~/composables/async-flow";
import type {
  DashboardStats,
  ProviderConfig,
  ProviderConnectivityResult,
  ProviderHealth,
} from "~/types/ai-dashboard";
import {
  buildFallbackProviderRows,
  isProviderConfigured as isConfiguredProviderFromSettings,
  normalizeProviderRows,
  resolveProviderMetadata,
  resolveProviderModelOptions,
  resolveProviderModelSelection,
} from "~/utils/ai-control-plane";
import { getErrorMessage } from "~/utils/errors";

type ApiClient = ReturnType<typeof useApi>;
type TestApiKeyInput = NonNullable<Parameters<ApiClient["settings"]["test-api-key"]["post"]>[0]>;
type DashboardBootstrap = {
  activeModel: string;
  activeProvider: AIProviderType;
  normalizedStats: DashboardStats;
  resolvedProviders: ProviderConfig[];
};

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

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readNumberField(payload: Record<string, unknown>, key: string): number | undefined {
  return asNumber(payload[key]);
}

function createDefaultRouting(provider: AIProviderType) {
  const [
    chat,
    interviewQuestions,
    interviewFeedback,
    resume,
    coverLetter,
    emailResponse,
    jobMatch,
    scrapeEnrichment,
    automationFieldMapping,
  ] = AI_ROUTING_PURPOSE_IDS;

  return {
    [chat]: { provider },
    [interviewQuestions]: { provider },
    [interviewFeedback]: { provider },
    [resume]: { provider },
    [coverLetter]: { provider },
    [emailResponse]: { provider },
    [jobMatch]: { provider },
    [scrapeEnrichment]: { provider },
    [automationFieldMapping]: { provider },
  } satisfies AIRouting;
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

function createDashboardProviderPresentation(
  t: ReturnType<typeof useI18n>["t"],
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

function useAIDashboardSelection(
  settings: ReturnType<typeof useSettings>["settings"],
  providers: ComputedRef<ProviderConfig[]>,
) {
  const selectedProvider = ref<AIProviderType>(AI_PROVIDER_DEFAULT);
  const selectedModel = ref("");
  const selectedProviderModels = computed(() => {
    const matchingProvider = providers.value.find((provider) => provider.id === selectedProvider.value);
    return resolveProviderModelOptions(
      selectedProvider.value,
      settings.value,
      matchingProvider?.models ?? [],
    );
  });

  function resolveDefaultModel(providerId: AIProviderType): string {
    const matchingProvider = providers.value.find((provider) => provider.id === providerId);
    if (matchingProvider?.models[0]) {
      return matchingProvider.models[0];
    }

    const catalogEntry = resolveProviderMetadata(providerId);
    return catalogEntry?.modelHints[0] ?? "";
  }

  return {
    resolveDefaultModel,
    selectedModel,
    selectedProvider,
    selectedProviderModels,
  };
}

async function useDashboardBootstrap(input: {
  api: ReturnType<typeof useApi>;
  fetchSettings: ReturnType<typeof useSettings>["fetchSettings"];
  settings: ReturnType<typeof useSettings>["settings"];
  chatRoutingPreference: ReturnType<typeof useSettings>["chatRoutingPreference"];
  t: ReturnType<typeof useI18n>["t"];
  resolveDefaultModel: (providerId: AIProviderType) => string;
}) {
  async function loadDashboardState(): Promise<DashboardBootstrap> {
    await input.fetchSettings();
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

  return await useAsyncData("ai-dashboard-bootstrap", loadDashboardState, {
    server: true,
    lazy: false,
  });
}

function createDashboardStatsPresentation(
  providerStats: ComputedRef<DashboardStats | null>,
  t: ReturnType<typeof useI18n>["t"],
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

function syncDashboardSelections(input: {
  dashboardBootstrap: Ref<DashboardBootstrap | null | undefined>;
  selectedProvider: Ref<AIProviderType>;
  selectedModel: Ref<string>;
  settings: ReturnType<typeof useSettings>["settings"];
  selectedProviderModels: ComputedRef<string[]>;
}) {
  watch(
    input.dashboardBootstrap,
    (value) => {
      if (!value) {
        return;
      }

      input.selectedProvider.value = value.activeProvider;
      input.selectedModel.value = value.activeModel;
    },
    { immediate: true },
  );

  watch(input.selectedProvider, (providerId) => {
    input.selectedModel.value = resolveProviderModelSelection(
      providerId,
      input.settings.value,
      input.selectedProviderModels.value,
    );
  });
}

function resolveProviderCredential(
  settings: ReturnType<typeof useSettings>["settings"],
  providerId: TestApiKeyInput["provider"],
): string {
  const currentSettings = settings.value;
  if (!currentSettings) return "";
  if (providerId === "gemini") return currentSettings.geminiApiKey ?? "";
  if (providerId === "openai") return currentSettings.openaiApiKey ?? "";
  if (providerId === "claude") return currentSettings.claudeApiKey ?? "";
  if (providerId === "huggingface") return currentSettings.huggingfaceToken ?? "";
  return "";
}

async function testProviderConnectivity(input: {
  providerId: AIProviderType;
  settings: ReturnType<typeof useSettings>["settings"];
  localProviderState: ReturnType<typeof useSettings>["localProviderState"];
  testApiKey: ReturnType<typeof useSettings>["testApiKey"];
  t: ReturnType<typeof useI18n>["t"];
}): Promise<ProviderConnectivityResult> {
  if (input.providerId === "local") {
    const result = await input.testApiKey(
      "local",
      input.localProviderState.value.endpoint,
      input.localProviderState.value.configuredModel || undefined,
    );
    return {
      valid: result.valid,
      message:
        result.message ||
        (result.valid
          ? input.t("aiDashboard.tests.localSuccess")
          : input.t("aiDashboard.tests.localFailure")),
    };
  }

  const providerCredential = resolveProviderCredential(input.settings, input.providerId);
  if (!providerCredential.trim()) {
    return {
      valid: false,
      message: input.t("aiDashboard.tests.missingCredential"),
    };
  }

  const result = await input.testApiKey(input.providerId, providerCredential);
  return {
    valid: result.valid,
    message:
      result.message ||
      (result.valid
        ? input.t("aiDashboard.tests.connectionSuccess")
        : input.t("aiDashboard.tests.connectionFailure")),
  };
}

function createAIDashboardActions(input: {
  api: ReturnType<typeof useApi>;
  localProviderState: ReturnType<typeof useSettings>["localProviderState"];
  refreshDashboardBootstrap: () => Promise<unknown>;
  selectedModel: Ref<string>;
  selectedProvider: Ref<AIProviderType>;
  settings: ReturnType<typeof useSettings>["settings"];
  t: ReturnType<typeof useI18n>["t"];
  testApiKey: ReturnType<typeof useSettings>["testApiKey"];
  testResults: Record<AIProviderType, ProviderConnectivityResult | null>;
  testingProvider: Ref<AIProviderType | null>;
  toast: ReturnType<typeof useNuxtApp>["$toast"];
}) {
  const fetchProviderStats = createDashboardRefreshAction(input);
  const handleTestProvider = createProviderTestAction(input);
  const handleSetPreference = createDashboardPreferenceAction(input, fetchProviderStats);

  return {
    fetchProviderStats,
    handleSetPreference,
    handleTestProvider,
  };
}

function createDashboardRefreshAction(
  input: Pick<
    Parameters<typeof createAIDashboardActions>[0],
    "refreshDashboardBootstrap" | "t" | "toast"
  >,
) {
  return async function fetchProviderStats() {
    const refreshResult = await settlePromise(
      input.refreshDashboardBootstrap(),
      input.t("aiDashboard.toasts.loadFailed"),
    );
    if (!refreshResult.ok) {
      input.toast.error(getErrorMessage(refreshResult.error, input.t("aiDashboard.toasts.loadFailed")));
    }
  };
}

function createProviderTestAction(
  input: Pick<
    Parameters<typeof createAIDashboardActions>[0],
    "localProviderState" | "settings" | "t" | "testApiKey" | "testResults" | "testingProvider"
  >,
) {
  return async function handleTestProvider(providerId: AIProviderType) {
    input.testingProvider.value = providerId;
    input.testResults[providerId] = null;

    const providerTestResult = await settlePromise(
      testProviderConnectivity({
        providerId,
        settings: input.settings,
        localProviderState: input.localProviderState,
        testApiKey: input.testApiKey,
        t: input.t,
      }),
      input.t("aiDashboard.tests.connectionFailure"),
    );
    input.testingProvider.value = null;

    if (!providerTestResult.ok) {
      input.testResults[providerId] = {
        valid: false,
        message: getErrorMessage(providerTestResult.error, input.t("aiDashboard.tests.connectionFailure")),
      };
      return;
    }

    input.testResults[providerId] = providerTestResult.value;
  };
}

function createDashboardPreferenceAction(
  input: Pick<
    Parameters<typeof createAIDashboardActions>[0],
    "api" | "selectedModel" | "selectedProvider" | "settings" | "t" | "toast"
  >,
  fetchProviderStats: () => Promise<void>,
) {
  return async function handleSetPreference() {
    if (!(input.selectedProvider.value && input.selectedModel.value)) return;

    const preferenceResult = await settlePromise(
      (async () => {
        const { error } = await input.api.settings.put({
          aiRouting: {
            ...(input.settings.value?.aiRouting ?? createDefaultRouting(input.selectedProvider.value)),
            chat: {
              provider: input.selectedProvider.value,
              ...(input.selectedModel.value ? { model: input.selectedModel.value } : {}),
            },
          },
          preferredProvider: input.selectedProvider.value,
          preferredModel: input.selectedModel.value || undefined,
        });
        if (error) {
          throw new Error(input.t("aiDashboard.errors.preferenceSaveFailed"));
        }
      })(),
      input.t("aiDashboard.toasts.preferenceSaveFailed"),
    );
    if (!preferenceResult.ok) {
      input.toast.error(
        getErrorMessage(preferenceResult.error, input.t("aiDashboard.toasts.preferenceSaveFailed")),
      );
      return;
    }

    input.toast.success(input.t("aiDashboard.toasts.preferenceSaved"));
    await fetchProviderStats();
  };
}

function createAIDashboardRuntime() {
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

function buildAIDashboardViewModel(input: {
  dashboardBootstrapError: Ref<unknown>;
  loading: ComputedRef<boolean>;
  providerPresentation: ReturnType<typeof createDashboardProviderPresentation>;
  providerStats: ComputedRef<DashboardStats | null>;
  providers: ComputedRef<ProviderConfig[]>;
  selection: ReturnType<typeof useAIDashboardSelection>;
  statsPresentation: ReturnType<typeof createDashboardStatsPresentation>;
  actions: ReturnType<typeof createAIDashboardActions>;
  testResults: Record<AIProviderType, ProviderConnectivityResult | null>;
  testingProvider: Ref<AIProviderType | null>;
  t: ReturnType<typeof useI18n>["t"];
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

async function createAIDashboardBootstrapState(
  runtime: ReturnType<typeof createAIDashboardRuntime>,
) {
  const placeholderProviders = computed<ProviderConfig[]>(() => []);
  const selection = useAIDashboardSelection(runtime.dependencies.settings, placeholderProviders);
  const {
    data: dashboardBootstrap,
    error: dashboardBootstrapError,
    refresh: refreshDashboardBootstrap,
    status: dashboardBootstrapStatus,
  } = await useDashboardBootstrap({
    api: runtime.dependencies.api,
    fetchSettings: runtime.dependencies.fetchSettings,
    settings: runtime.dependencies.settings,
    chatRoutingPreference: runtime.dependencies.chatRoutingPreference,
    t: runtime.dependencies.t,
    resolveDefaultModel: selection.resolveDefaultModel,
  });

  return {
    dashboardBootstrap,
    dashboardBootstrapError,
    dashboardBootstrapStatus,
    refreshDashboardBootstrap,
  };
}

export async function useAIDashboardPage() {
  const runtime = createAIDashboardRuntime();
  const bootstrap = await createAIDashboardBootstrapState(runtime);
  const providers = computed(() => bootstrap.dashboardBootstrap.value?.resolvedProviders ?? []);
  const providerStats = computed(() => bootstrap.dashboardBootstrap.value?.normalizedStats ?? null);
  const providerPresentation = createDashboardProviderPresentation(
    runtime.dependencies.t,
    runtime.dependencies.settings,
  );
  const dashboardSelection = useAIDashboardSelection(runtime.dependencies.settings, providers);
  const statsPresentation = createDashboardStatsPresentation(
    providerStats,
    runtime.dependencies.t,
    providerPresentation.providerLabel,
  );
  syncDashboardSelections({
    dashboardBootstrap: bootstrap.dashboardBootstrap,
    selectedProvider: dashboardSelection.selectedProvider,
    selectedModel: dashboardSelection.selectedModel,
    settings: runtime.dependencies.settings,
    selectedProviderModels: dashboardSelection.selectedProviderModels,
  });
  const actions = createAIDashboardActions({
    api: runtime.dependencies.api,
    localProviderState: runtime.dependencies.localProviderState,
    refreshDashboardBootstrap: bootstrap.refreshDashboardBootstrap,
    selectedModel: dashboardSelection.selectedModel,
    selectedProvider: dashboardSelection.selectedProvider,
    settings: runtime.dependencies.settings,
    t: runtime.dependencies.t,
    testApiKey: runtime.dependencies.testApiKey,
    testResults: runtime.testResults,
    testingProvider: runtime.testingProvider,
    toast: runtime.dependencies.toast,
  });

  return buildAIDashboardViewModel({
    dashboardBootstrapError: bootstrap.dashboardBootstrapError,
    loading: computed(
      () =>
        bootstrap.dashboardBootstrapStatus.value === "pending" ||
        bootstrap.dashboardBootstrapStatus.value === "idle",
    ),
    providerPresentation,
    providerStats,
    providers,
    selection: dashboardSelection,
    statsPresentation,
    actions,
    testResults: runtime.testResults,
    testingProvider: runtime.testingProvider,
    t: runtime.dependencies.t,
  });
}
