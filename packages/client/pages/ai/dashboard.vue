<script setup lang="ts">
import {
  AI_PROVIDER_DEFAULT,
  AI_ROUTING_PURPOSE_IDS,
  type AIRouting,
  type AIProviderType,
  APP_ROUTES,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
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
type ProviderHealth = "healthy" | "degraded" | "down" | "unconfigured";

type ProviderConfig = {
  id: AIProviderType;
  iconId: AIProviderType;
  models: string[];
  available: boolean;
  health: ProviderHealth;
};

type DashboardStats = {
  totalRequests: number;
  successRate: number;
  averageResponseTimeSeconds: number;
  activeProvider: AIProviderType;
  sessions: number;
};

type ProviderConnectivityResult = {
  valid: boolean;
  message: string;
};

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

const { t } = useI18n();
const {
  settings,
  fetchSettings,
  testApiKey,
  chatRoutingPreference,
  localProviderState,
} = useSettings();
const { $toast } = useNuxtApp();
const api = useApi();

if (import.meta.server) {
  useServerSeoMeta({
    title: t("aiDashboard.title"),
    description: t("aiDashboard.subtitle"),
  });
}

const testingProvider = ref<AIProviderType | null>(null);
const testResults = reactive<Record<AIProviderType, ProviderConnectivityResult | null>>({
  local: null,
  gemini: null,
  openai: null,
  claude: null,
  huggingface: null,
});

const selectedProvider = ref<AIProviderType>(AI_PROVIDER_DEFAULT);
const selectedModel = ref("");
const selectedProviderModels = computed(() => {
  const matchingProvider = providers.value.find(
    (provider) => provider.id === selectedProvider.value,
  );
  return resolveProviderModelOptions(
    selectedProvider.value,
    settings.value,
    matchingProvider?.models ?? [],
  );
});

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

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

function providerSelectOptionLabel(provider: ProviderConfig): string {
  const providerName = providerLabel(provider.id);
  if (isProviderConfigured(provider.id)) {
    return providerName;
  }
  return t("aiDashboard.preference.providerNotConfiguredOption", { provider: providerName });
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

function resolveDefaultModel(providerId: AIProviderType): string {
  const matchingProvider = providers.value.find((provider) => provider.id === providerId);
  if (matchingProvider?.models[0]) {
    return matchingProvider.models[0];
  }

  const catalogEntry = resolveProviderMetadata(providerId);
  return catalogEntry?.modelHints[0] ?? "";
}

function resolveProviderCredential(providerId: TestApiKeyInput["provider"]): string {
  const currentSettings = settings.value;
  if (!currentSettings) return "";
  if (providerId === "gemini") return currentSettings.geminiApiKey ?? "";
  if (providerId === "openai") return currentSettings.openaiApiKey ?? "";
  if (providerId === "claude") return currentSettings.claudeApiKey ?? "";
  if (providerId === "huggingface") return currentSettings.huggingfaceToken ?? "";
  return "";
}

function normalizeDashboardStats(
  usagePayload: unknown,
  activeProvider: AIProviderType,
): DashboardStats {
  if (typeof usagePayload !== "object" || usagePayload === null) {
    return {
      totalRequests: 0,
      successRate: 0,
      averageResponseTimeSeconds: 0,
      activeProvider,
      sessions: 0,
    };
  }

  const totalMessages = asNumber(usagePayload.totalMessages) ?? 0;
  const userMessages = asNumber(usagePayload.userMessages) ?? 0;
  const assistantMessages = asNumber(usagePayload.assistantMessages) ?? 0;
  const sessions = asNumber(usagePayload.sessions) ?? 0;

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

async function fetchProviderStats() {
  const refreshResult = await settlePromise(
    refreshDashboardBootstrap(),
    t("aiDashboard.toasts.loadFailed"),
  );
  if (!refreshResult.ok) {
    $toast.error(getErrorMessage(refreshResult.error, t("aiDashboard.toasts.loadFailed")));
  }
}

async function loadDashboardState(): Promise<DashboardBootstrap> {
  await fetchSettings();

  const [usageResult, modelsResult] = await Promise.all([
    api.ai.usage.get(),
    api.ai.models.get(),
  ]);

  if (usageResult.error) {
    throw new Error(t("aiDashboard.errors.usageLoadFailed"));
  }
  if (modelsResult.error) {
    throw new Error(t("aiDashboard.errors.modelsLoadFailed"));
  }

  const normalizedProviders = normalizeProviderRows(modelsResult.data, settings.value);
  const resolvedProviders =
    normalizedProviders.length > 0
      ? normalizedProviders
      : buildFallbackProviderRows(settings.value);
  const activeProvider = resolvedProviders.some(
    (provider) => provider.id === chatRoutingPreference.value.provider,
  )
    ? chatRoutingPreference.value.provider
    : (resolvedProviders[0]?.id ?? AI_PROVIDER_DEFAULT);
  const activeProviderModels =
    resolvedProviders.find((provider) => provider.id === activeProvider)?.models ?? [];

  return {
    resolvedProviders,
    activeProvider,
    activeModel:
      resolveProviderModelSelection(activeProvider, settings.value, activeProviderModels) ||
      resolveDefaultModel(activeProvider),
    normalizedStats: normalizeDashboardStats(usageResult.data, activeProvider),
  };
}

const {
  data: dashboardBootstrap,
  error: dashboardBootstrapError,
  refresh: refreshDashboardBootstrap,
  status: dashboardBootstrapStatus,
} = await useAsyncData("ai-dashboard-bootstrap", loadDashboardState, {
  server: true,
  lazy: false,
});

const loading = computed(
  () => dashboardBootstrapStatus.value === "pending" || dashboardBootstrapStatus.value === "idle",
);
const providers = computed(() => dashboardBootstrap.value?.resolvedProviders ?? []);
const providerStats = computed(() => dashboardBootstrap.value?.normalizedStats ?? null);

watch(
  dashboardBootstrap,
  (value) => {
    if (!value) {
      return;
    }

    selectedProvider.value = value.activeProvider;
    selectedModel.value = value.activeModel;
  },
  { immediate: true },
);

async function handleTestProvider(providerId: AIProviderType) {
  testingProvider.value = providerId;
  testResults[providerId] = null;

  const providerTestResult = await settlePromise(
    (async (): Promise<ProviderConnectivityResult> => {
      if (providerId === "local") {
        const result = await testApiKey(
          "local",
          localProviderState.value.endpoint,
          localProviderState.value.configuredModel || undefined,
        );
        return {
          valid: result.valid,
          message:
            result.message ||
            (result.valid
              ? t("aiDashboard.tests.localSuccess")
              : t("aiDashboard.tests.localFailure")),
        };
      }

      const providerCredential = resolveProviderCredential(providerId);
      if (!providerCredential.trim()) {
        return {
          valid: false,
          message: t("aiDashboard.tests.missingCredential"),
        };
      }

      const result = await testApiKey(providerId, providerCredential);
      const valid = result.valid;
      return {
        valid,
        message:
          result.message ||
          (valid ? t("aiDashboard.tests.connectionSuccess") : t("aiDashboard.tests.connectionFailure")),
      };
    })(),
    t("aiDashboard.tests.connectionFailure"),
  );
  testingProvider.value = null;

  if (!providerTestResult.ok) {
    testResults[providerId] = {
      valid: false,
      message: getErrorMessage(providerTestResult.error, t("aiDashboard.tests.connectionFailure")),
    };
    return;
  }

  testResults[providerId] = providerTestResult.value;
}

async function handleSetPreference() {
  if (!selectedProvider.value || !selectedModel.value) return;

  const preferenceResult = await settlePromise(
    (async () => {
      const { error } = await api.settings.put({
        aiRouting: {
          ...(settings.value?.aiRouting ??
            (Object.fromEntries(
              AI_ROUTING_PURPOSE_IDS.map((purpose) => [purpose, { provider: selectedProvider.value }]),
            ) as AIRouting)),
          chat: {
            provider: selectedProvider.value,
            ...(selectedModel.value ? { model: selectedModel.value } : {}),
          },
        },
        preferredProvider: selectedProvider.value,
        preferredModel: selectedModel.value || undefined,
      });
      if (error) {
        throw new Error(t("aiDashboard.errors.preferenceSaveFailed"));
      }
    })(),
    t("aiDashboard.toasts.preferenceSaveFailed"),
  );
  if (!preferenceResult.ok) {
    $toast.error(
      getErrorMessage(preferenceResult.error, t("aiDashboard.toasts.preferenceSaveFailed")),
    );
    return;
  }

  $toast.success(t("aiDashboard.toasts.preferenceSaved"));
  await fetchProviderStats();
}

watch(selectedProvider, (providerId) => {
  selectedModel.value = resolveProviderModelSelection(
    providerId,
    settings.value,
    selectedProviderModels.value,
  );
});

const activeProviderLabel = computed(() =>
  providerStats.value ? providerLabel(providerStats.value.activeProvider) : "",
);
</script>

<template>
  <PageScaffold tag="section" labelled-by="ai-dashboard-title">
    <PageHeroHeader
      title-id="ai-dashboard-title"
      :title="t('aiDashboard.title')"
      :description="t('aiDashboard.subtitle')"
      description-class="text-base-content/70"
    >
      <template #actions>
        <button
          class="btn btn-outline btn-sm"
          :disabled="loading"
          :aria-label="t('aiDashboard.preference.refreshAria')"
          @click="fetchProviderStats"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          <span>{{ t("aiDashboard.preference.refreshButton") }}</span>
        </button>
      </template>
    </PageHeroHeader>

    <LoadingSkeleton v-if="loading && !providerStats" :lines="8" />
    <BootstrapErrorAlert
      v-else-if="dashboardBootstrapError"
      :message="getErrorMessage(dashboardBootstrapError, t('aiDashboard.toasts.loadFailed'))"
      :retry-label="t('aiDashboard.preference.refreshButton')"
      :retry-aria-label="t('aiDashboard.preference.refreshAria')"
      @retry="fetchProviderStats"
    />

    <div v-else class="space-y-6">
      <div
        v-if="providerStats"
        class="stats stats-vertical lg:stats-horizontal w-full border border-base-300 bg-base-100 shadow-sm"
      >
        <div class="stat">
          <div class="stat-title">{{ t("aiDashboard.stats.totalRequestsTitle") }}</div>
          <div class="stat-value text-primary">{{ providerStats.totalRequests }}</div>
          <div class="stat-desc">{{ t("aiDashboard.stats.totalRequestsDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("aiDashboard.stats.successRateTitle") }}</div>
          <div class="stat-value text-success">{{ providerStats.successRate }}%</div>
          <div class="stat-desc">{{ t("aiDashboard.stats.successRateDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("aiDashboard.stats.averageResponseTitle") }}</div>
          <div class="stat-value text-secondary">
            {{
              t("aiDashboard.stats.averageResponseValue", {
                seconds: providerStats.averageResponseTimeSeconds,
              })
            }}
          </div>
          <div class="stat-desc">{{ t("aiDashboard.stats.averageResponseDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("aiDashboard.stats.sessionsTitle") }}</div>
          <div class="stat-value text-accent">{{ providerStats.sessions }}</div>
          <div class="stat-desc">
            {{ t("aiDashboard.stats.sessionsDesc", { provider: activeProviderLabel }) }}
          </div>
        </div>
      </div>

      <div class="card card-border bg-base-100 shadow-sm">
        <div class="card-body gap-4">
          <h2 class="card-title">{{ t("aiDashboard.preference.title") }}</h2>
          <p class="text-sm text-base-content/70">{{ t("aiDashboard.preference.description") }}</p>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("aiDashboard.preference.providerLegend") }}</legend>
              <select
                v-model="selectedProvider"
                class="select w-full"
                :aria-label="t('aiDashboard.preference.providerAria')"
              >
                <option disabled value="">{{ t("aiDashboard.preference.selectProviderOption") }}</option>
                <option
                  v-for="provider in providers"
                  :key="provider.id"
                  :value="provider.id"
                  :disabled="!isProviderConfigured(provider.id)"
                >
                  {{ providerSelectOptionLabel(provider) }}
                </option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">{{ t("aiDashboard.preference.modelLegend") }}</legend>
              <select
                v-model="selectedModel"
                class="select w-full"
                :aria-label="t('aiDashboard.preference.modelAria')"
                :disabled="selectedProviderModels.length === 0"
              >
                <option disabled value="">{{ t("aiDashboard.preference.selectModelOption") }}</option>
                <option v-for="model in selectedProviderModels" :key="model" :value="model">
                  {{ model }}
                </option>
              </select>
            </fieldset>
          </div>

          <div class="card-actions justify-end">
            <button
              class="btn btn-primary"
              :disabled="!selectedProvider || !selectedModel || loading"
              :aria-label="t('aiDashboard.preference.saveAria')"
              @click="handleSetPreference"
            >
              <span v-if="loading" class="loading loading-spinner loading-xs"></span>
              <span>{{ t("aiDashboard.preference.saveButton") }}</span>
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="providers.length === 0"
        role="alert"
        class="alert alert-warning alert-vertical sm:alert-horizontal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
        <div>
          <h3 class="font-bold">{{ t("aiDashboard.alerts.noProvidersTitle") }}</h3>
          <p class="text-xs">{{ t("aiDashboard.alerts.noProvidersDescription") }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          v-for="provider in providers"
          :key="provider.id"
          class="card card-border bg-base-100 shadow-sm"
        >
          <div class="card-body gap-4">
            <div class="flex items-center justify-between gap-3">
              <div class="flex min-w-0 items-center gap-3">
                <AIProviderIcon
                  :provider-id="provider.iconId"
                  class="h-8 w-8 shrink-0 text-primary"
                />
                <div class="min-w-0">
                  <h3 class="card-title text-lg">{{ providerLabel(provider.id) }}</h3>
                  <p class="text-xs text-base-content/70">{{ providerDescription(provider.id) }}</p>
                </div>
              </div>
              <span
                class="badge"
                :class="isProviderConfigured(provider.id) ? 'badge-success' : 'badge-ghost'"
              >
                {{
                  isProviderConfigured(provider.id)
                    ? t("aiDashboard.providerCard.configuredBadge")
                    : t("aiDashboard.providerCard.notConfiguredBadge")
                }}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span class="badge" :class="provider.available ? 'badge-success' : 'badge-neutral'">
                {{ providerAvailabilityLabel(provider.available) }}
              </span>
              <span class="badge badge-outline" :class="providerHealthBadgeClass(provider.health)">
                {{ providerHealthLabel(provider.health) }}
              </span>
            </div>

            <div
              v-if="testResults[provider.id]"
              role="status"
              class="alert alert-vertical sm:alert-horizontal"
              :class="testResults[provider.id]?.valid ? 'alert-success' : 'alert-error'"
            >
              <div>
                <h4 class="font-semibold">
                  {{
                    testResults[provider.id]?.valid
                      ? t("aiDashboard.alerts.testSuccessTitle")
                      : t("aiDashboard.alerts.testErrorTitle")
                  }}
                </h4>
                <p class="text-xs">{{ testResults[provider.id]?.message }}</p>
              </div>
            </div>

            <div class="card-actions justify-end">
              <button
                class="btn btn-outline btn-sm"
                :disabled="testingProvider === provider.id"
                :aria-label="t('aiDashboard.providerCard.testAria', { provider: providerLabel(provider.id) })"
                @click="handleTestProvider(provider.id)"
              >
                <span v-if="testingProvider === provider.id" class="loading loading-spinner loading-xs"></span>
                <span>{{
                  testingProvider === provider.id
                    ? t("aiDashboard.providerCard.testingLabel")
                    : t("aiDashboard.providerCard.testButton")
                }}</span>
              </button>
              <NuxtLink
                :to="APP_ROUTES.settings"
                class="btn btn-primary btn-sm"
                :aria-label="t('aiDashboard.providerCard.configureAria', { provider: providerLabel(provider.id) })"
              >
                {{ t("aiDashboard.providerCard.configureButton") }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageScaffold>
</template>
