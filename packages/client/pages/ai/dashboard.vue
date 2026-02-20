<script setup lang="ts">
import {
  AI_PROVIDER_CATALOG,
  AI_PROVIDER_DEFAULT_ORDER,
  AI_PROVIDER_ID_LIST,
  APP_ROUTES,
  type AIProviderType,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { settlePromise } from "~/composables/async-flow";
import { getErrorMessage } from "~/utils/errors";

type ApiClient = ReturnType<typeof useApi>;
type TestApiKeyInput = NonNullable<Parameters<ApiClient["settings"]["test-api-key"]["post"]>[0]>;
type ProviderHealth = "healthy" | "degraded" | "down" | "unconfigured";

type ProviderConfig = {
  id: AIProviderType;
  name: string;
  description: string;
  icon: string;
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

const providerCatalogById = new Map(
  AI_PROVIDER_CATALOG.map((provider) => [provider.id, provider] as const),
);
const providerIdSet = new Set<string>(AI_PROVIDER_ID_LIST);
const providerHealthSet = new Set<string>(["healthy", "degraded", "down", "unconfigured"]);

const { t } = useI18n();
const { settings, fetchSettings } = useSettings();
const { $toast } = useNuxtApp();
const api = useApi();

const providerStats = ref<DashboardStats | null>(null);
const providers = ref<ProviderConfig[]>([]);
const loading = ref(false);
const testingProvider = ref<AIProviderType | null>(null);
const testResults = reactive<Record<AIProviderType, ProviderConnectivityResult | null>>({
  local: null,
  gemini: null,
  openai: null,
  claude: null,
  huggingface: null,
});

const selectedProvider = ref<AIProviderType>(AI_PROVIDER_DEFAULT_ORDER[0] ?? "local");
const selectedModel = ref("");
const selectedProviderModels = computed(() => {
  const matchingProvider = providers.value.find(
    (provider) => provider.id === selectedProvider.value,
  );
  return matchingProvider?.models ?? [];
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

function isProviderId(value: string): value is AIProviderType {
  return providerIdSet.has(value);
}

function isProviderHealth(value: string): value is ProviderHealth {
  return providerHealthSet.has(value);
}

function isProviderConfigured(providerId: AIProviderType): boolean {
  const currentSettings = settings.value;
  if (!currentSettings) return false;

  if (providerId === "local") {
    return currentSettings.hasLocalKey ?? true;
  }
  if (providerId === "gemini") return Boolean(currentSettings.hasGeminiKey);
  if (providerId === "openai") return Boolean(currentSettings.hasOpenaiKey);
  if (providerId === "claude") return Boolean(currentSettings.hasClaudeKey);
  return Boolean(currentSettings.hasHuggingfaceToken);
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
  if (isProviderConfigured(provider.id)) {
    return provider.name;
  }
  return t("aiDashboard.preference.providerNotConfiguredOption", { provider: provider.name });
}

function normalizeProviderRow(value: unknown): ProviderConfig | null {
  if (!isRecord(value)) return null;

  const rawId = asString(value.id);
  if (!rawId || !isProviderId(rawId)) return null;

  const catalogEntry = providerCatalogById.get(rawId);
  if (!catalogEntry) return null;

  const rawHealth = asString(value.health);
  const rawAvailable = asBoolean(value.available);
  const available = rawAvailable ?? isProviderConfigured(rawId);
  const health =
    rawHealth && isProviderHealth(rawHealth) ? rawHealth : available ? "healthy" : "unconfigured";
  const models = asStringArray(value.models);

  return {
    id: rawId,
    name: asString(value.name) ?? catalogEntry.name,
    description: catalogEntry.description,
    icon: catalogEntry.icon,
    models: models.length > 0 ? models : [...catalogEntry.modelHints],
    available,
    health,
  };
}

function buildFallbackProviders(): ProviderConfig[] {
  return AI_PROVIDER_DEFAULT_ORDER.map((providerId) => {
    const catalogEntry = providerCatalogById.get(providerId);
    if (!catalogEntry) {
      return {
        id: providerId,
        name: providerId,
        description: "",
        icon: "💠",
        models: [],
        available: false,
        health: "unconfigured",
      };
    }

    return {
      id: providerId,
      name: catalogEntry.name,
      description: catalogEntry.description,
      icon: catalogEntry.icon,
      models: [...catalogEntry.modelHints],
      available: isProviderConfigured(providerId),
      health: isProviderConfigured(providerId) ? "degraded" : "unconfigured",
    };
  });
}

function resolveDefaultModel(providerId: AIProviderType): string {
  const matchingProvider = providers.value.find((provider) => provider.id === providerId);
  if (matchingProvider?.models[0]) {
    return matchingProvider.models[0];
  }

  const catalogEntry = providerCatalogById.get(providerId);
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

function resolvePreferredProvider(value: unknown): AIProviderType {
  if (!isRecord(value)) {
    return AI_PROVIDER_DEFAULT_ORDER[0] ?? "local";
  }

  const preferred = asString(value.preferredProvider);
  if (preferred && isProviderId(preferred)) {
    return preferred;
  }

  return AI_PROVIDER_DEFAULT_ORDER[0] ?? "local";
}

function normalizeProviders(value: unknown): ProviderConfig[] {
  if (!isRecord(value)) return [];

  const rows = Array.isArray(value.providers) ? value.providers : [];
  return rows
    .map((row) => normalizeProviderRow(row))
    .filter((provider): provider is ProviderConfig => provider !== null);
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
  loading.value = true;
  const statsResult = await settlePromise(
    (async () => {
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

      const normalizedProviders = normalizeProviders(modelsResult.data);
      const resolvedProviders =
        normalizedProviders.length > 0 ? normalizedProviders : buildFallbackProviders();
      const preferredProvider = resolvePreferredProvider(modelsResult.data);
      const activeProvider = resolvedProviders.some((provider) => provider.id === preferredProvider)
        ? preferredProvider
        : (resolvedProviders[0]?.id ?? "local");

      return {
        resolvedProviders,
        activeProvider,
        normalizedStats: normalizeDashboardStats(usageResult.data, activeProvider),
      };
    })(),
    t("aiDashboard.toasts.loadFailed"),
  );
  loading.value = false;

  if (!statsResult.ok) {
    providers.value = buildFallbackProviders();
    const fallbackProvider = providers.value[0]?.id ?? "local";
    selectedProvider.value = fallbackProvider;
    selectedModel.value = resolveDefaultModel(fallbackProvider);
    providerStats.value = normalizeDashboardStats(null, fallbackProvider);
    $toast.error(getErrorMessage(statsResult.error, t("aiDashboard.toasts.loadFailed")));
    return;
  }

  providers.value = statsResult.value.resolvedProviders;
  selectedProvider.value = statsResult.value.activeProvider;
  selectedModel.value = resolveDefaultModel(statsResult.value.activeProvider);
  providerStats.value = statsResult.value.normalizedStats;
}

async function handleTestProvider(providerId: AIProviderType) {
  testingProvider.value = providerId;
  testResults[providerId] = null;

  const providerTestResult = await settlePromise(
    (async (): Promise<ProviderConnectivityResult> => {
      if (providerId === "local") {
        const { data, error } = await api.ai.models.get();
        if (error) {
          throw new Error(t("aiDashboard.errors.localConnectivityFailed"));
        }

        const localProvider = normalizeProviders(data).find((provider) => provider.id === "local");
        const localAvailable = localProvider?.available ?? false;
        return {
          valid: localAvailable,
          message: localAvailable
            ? t("aiDashboard.tests.localSuccess")
            : t("aiDashboard.tests.localFailure"),
        };
      }

      const providerCredential = resolveProviderCredential(providerId);
      if (!providerCredential.trim()) {
        return {
          valid: false,
          message: t("aiDashboard.tests.missingCredential"),
        };
      }

      const { data, error } = await api.settings["test-api-key"].post({
        provider: providerId,
        key: providerCredential,
      });

      if (error) {
        throw new Error(t("aiDashboard.errors.providerTestFailed"));
      }

      const valid = isRecord(data) && data.valid === true;
      return {
        valid,
        message: valid
          ? t("aiDashboard.tests.connectionSuccess")
          : t("aiDashboard.tests.connectionFailure"),
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
        preferredProvider: selectedProvider.value,
        preferredModel: selectedModel.value,
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
  selectedModel.value = resolveDefaultModel(providerId);
});

onMounted(() => {
  void fetchProviderStats();
});
</script>

<template>
  <div class="space-y-6">
    <section class="hero rounded-box border border-base-300 bg-base-200">
      <div class="hero-content w-full flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-2xl space-y-2">
          <h1 class="text-3xl font-bold md:text-4xl">{{ t("aiDashboard.title") }}</h1>
          <p class="text-base-content/70">{{ t("aiDashboard.subtitle") }}</p>
        </div>
        <button
          class="btn btn-outline btn-sm"
          :disabled="loading"
          :aria-label="t('aiDashboard.preference.refreshAria')"
          @click="fetchProviderStats"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          <span>{{ t("aiDashboard.preference.refreshButton") }}</span>
        </button>
      </div>
    </section>

    <LoadingSkeleton v-if="loading && !providerStats" :lines="8" />

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
          <div class="stat-value text-secondary">{{ providerStats.averageResponseTimeSeconds }}s</div>
          <div class="stat-desc">{{ t("aiDashboard.stats.averageResponseDesc") }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">{{ t("aiDashboard.stats.sessionsTitle") }}</div>
          <div class="stat-value text-accent">{{ providerStats.sessions }}</div>
          <div class="stat-desc">
            {{ t("aiDashboard.stats.sessionsDesc", { provider: providerStats.activeProvider }) }}
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
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <span class="text-3xl" aria-hidden="true">{{ provider.icon }}</span>
                <div>
                  <h3 class="card-title text-lg">{{ provider.name }}</h3>
                  <p class="text-xs text-base-content/70">{{ provider.description }}</p>
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
                :aria-label="t('aiDashboard.providerCard.testAria', { provider: provider.name })"
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
                :aria-label="t('aiDashboard.providerCard.configureAria', { provider: provider.name })"
              >
                {{ t("aiDashboard.providerCard.configureButton") }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
