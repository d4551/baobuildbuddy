<script setup lang="ts">
import type { AppSettings } from "@bao/shared";
import { type AIProviderType, AI_PROVIDER_CATALOG } from "@bao/shared";

type SettingsWithFlags = AppSettings & {
  hasGeminiKey?: boolean;
  hasOpenaiKey?: boolean;
  hasClaudeKey?: boolean;
  hasHuggingfaceToken?: boolean;
  hasLocalKey?: boolean;
};

type ModelProviderResponse = {
  id: string;
  name: string;
  models: string[];
  available: boolean;
  health: "healthy" | "degraded" | "down" | "unconfigured";
};

type ModelsResponse = {
  providers: ModelProviderResponse[];
  preferredProvider?: AIProviderType;
  configuredProviders?: AIProviderType[];
};

type UsageResponse = {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  sessions: number;
  recentActivity: Array<{ timestamp: string; role: string; sessionId: string }>;
};

type ProviderConfig = {
  id: AIProviderType;
  name: string;
  description: string;
  icon: string;
  models: string[];
  available: boolean;
  health: "healthy" | "degraded" | "down" | "unconfigured";
};

type DashboardStats = {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  activeProvider: string;
  sessions: number;
};

const { settings, fetchSettings } = useSettings();
const api = useApi();

const providerStats = ref<DashboardStats | null>(null);
const providers = ref<ProviderConfig[]>([]);
const loading = ref(false);
const testingProvider = ref<AIProviderType | null>(null);
const testResults = reactive<Record<AIProviderType, { valid: boolean; message: string } | null>>({
  local: null,
  gemini: null,
  openai: null,
  claude: null,
  huggingface: null,
});

const selectedProvider = ref<AIProviderType>("local");
const selectedModel = ref("");

const providerDescriptionById = new Map(
  AI_PROVIDER_CATALOG.map((provider) => [provider.id, provider.description] as const),
);
const providerIconById = new Map(
  AI_PROVIDER_CATALOG.map((provider) => [provider.id, provider.icon] as const),
);
const providerModelsById = new Map(
  AI_PROVIDER_CATALOG.map((provider) => [provider.id, [...provider.modelHints]] as const),
);

function getSettingsFlags(): SettingsWithFlags | null {
  return settings.value as SettingsWithFlags | null;
}

function isProviderConfigured(providerId: AIProviderType): boolean {
  const current = getSettingsFlags();
  if (!current) return false;

  if (providerId === "local") {
    return current.hasLocalKey ?? true;
  }
  if (providerId === "gemini") return !!current.hasGeminiKey;
  if (providerId === "openai") return !!current.hasOpenaiKey;
  if (providerId === "claude") return !!current.hasClaudeKey;
  return !!current.hasHuggingfaceToken;
}

onMounted(() => {
  void fetchSettings();
  void fetchProviderStats();
});

async function fetchProviderStats() {
  loading.value = true;
  try {
    const [usageResult, modelsResult] = await Promise.all([
      api.ai.usage.get() as Promise<{ data: UsageResponse; error?: { message?: string } | null }>,
      api.ai.models.get() as Promise<{ data: ModelsResponse; error?: { message?: string } | null }>,
    ]);

    if (usageResult.error) {
      throw new Error("Failed to fetch AI usage");
    }

    const usageData = usageResult.data;
    providerStats.value = {
      totalRequests: usageData.totalMessages || 0,
      successRate: usageData.totalMessages
        ? Math.round((usageData.assistantMessages / Math.max(usageData.userMessages, 1)) * 100)
        : 0,
      averageResponseTime: 0,
      activeProvider: usageData.recentActivity ? "local" : "none",
      sessions: usageData.sessions || 0,
    };

    const modelData = modelsResult.data;
    const activeProvider = modelData?.preferredProvider || "local";

    providers.value = (modelData?.providers || []).map((provider) => ({
      id: provider.id as AIProviderType,
      name: provider.name || provider.id,
      description: providerDescriptionById.get(provider.id as AIProviderType) || "",
      icon: providerIconById.get(provider.id as AIProviderType) || "💠",
      models: provider.models || providerModelsById.get(provider.id as AIProviderType) || [],
      available: provider.available,
      health: provider.health,
    }));

    if (!providerStats.value.activeProvider) {
      providerStats.value.activeProvider = activeProvider;
    }

    const selected = providers.value.find((provider) => provider.id === activeProvider);
    if (selected) {
      selectedProvider.value = selected.id;
      selectedModel.value = selected.models[0] || "";
    } else {
      selectedProvider.value = "local";
      selectedModel.value = providerModelsById.get("local")?.[0] || "";
    }
  } catch {
    const { $toast } = useNuxtApp();
    $toast.error("Failed to load AI statistics");

    providers.value = AI_PROVIDER_CATALOG.map((provider) => ({
      id: provider.id,
      name: provider.name,
      description: provider.description,
      icon: provider.icon,
      models: [...provider.modelHints],
      available: false,
      health: "unconfigured",
    }));
    providerStats.value = {
      totalRequests: 0,
      successRate: 0,
      averageResponseTime: 0,
      activeProvider: "local",
      sessions: 0,
    };
    selectedProvider.value = "local";
    selectedModel.value = providerModelsById.get("local")?.[0] || "";
  } finally {
    loading.value = false;
  }
}

async function handleTestProvider(providerId: AIProviderType) {
  testingProvider.value = providerId;
  testResults[providerId] = null;

  try {
    const { data, error } = await api.ai.chat.post({
      message: "Hello, this is a connectivity test. Reply with OK.",
      sessionId: `test-${providerId}-${Date.now()}`,
    });
    const isSuccessful = !error && Boolean((data as { message?: string } | undefined)?.message);
    testResults[providerId] = {
      valid: isSuccessful,
      message: isSuccessful ? "Connection successful" : "Connection failed",
    };
  } catch {
    testResults[providerId] = { valid: false, message: "Connection failed" };
  } finally {
    testingProvider.value = null;
  }
}

async function handleSetPreference() {
  if (!selectedProvider.value) return;
  const { $toast } = useNuxtApp();

  try {
    const { error } = await api.settings.put({
      preferredProvider: selectedProvider.value,
      preferredModel: selectedModel.value,
    });
    if (error) {
      throw new Error("Failed to save preference");
    }
    $toast.success("AI preference saved");
    await fetchProviderStats();
  } catch {
    $toast.error("Failed to save AI preference");
  }
}

watch(selectedProvider, (provider) => {
  const currentProvider = providers.value.find((item) => item.id === provider);
  selectedModel.value = currentProvider?.models[0] || providerModelsById.get(provider)?.[0] || "";
});
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">AI Dashboard</h1>

    <LoadingSkeleton v-if="loading && !providerStats" :lines="8" />

    <div v-else class="space-y-6">
      <div v-if="providerStats" class="stats stats-vertical lg:stats-horizontal w-full bg-base-200">
        <div class="stat">
          <div class="stat-title">Total Requests</div>
          <div class="stat-value text-primary">{{ providerStats.totalRequests }}</div>
          <div class="stat-desc">API calls made</div>
        </div>
        <div class="stat">
          <div class="stat-title">Success Rate</div>
          <div class="stat-value text-success">{{ providerStats.successRate }}%</div>
          <div class="stat-desc">Successful responses</div>
        </div>
        <div class="stat">
          <div class="stat-title">Avg Response Time</div>
          <div class="stat-value text-secondary">{{ providerStats.averageResponseTime }}s</div>
          <div class="stat-desc">Time to complete</div>
        </div>
        <div class="stat">
          <div class="stat-title">Active Provider</div>
          <div class="stat-value text-accent text-xl">{{ providerStats.activeProvider }}</div>
          <div class="stat-desc">Current default</div>
        </div>
      </div>

      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Set Provider Preference</h2>
          <p class="text-sm text-base-content/70 mb-4">Choose your preferred AI provider and model.</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Provider</legend>
              <select v-model="selectedProvider" class="select w-full" aria-label="Selected Provider">
                <option value="">Select provider</option>
                <option
                  v-for="provider in providers"
                  :key="provider.id"
                  :value="provider.id"
                  :disabled="!isProviderConfigured(provider.id)"
                >
                  {{ provider.name }} {{ isProviderConfigured(provider.id) ? "" : "(Not configured)" }}
                </option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">Model</legend>
              <select v-model="selectedModel" class="select w-full" :disabled="!selectedProvider" aria-label="Selected Model">
                <option value="">Select model</option>
                <option v-for="model in providers.find((item) => item.id === selectedProvider)?.models || []" :key="model" :value="model">
                  {{ model }}
                </option>
              </select>
            </fieldset>
          </div>

          <div class="card-actions mt-4">
            <button class="btn btn-primary" :disabled="!selectedProvider || !selectedModel" @click="handleSetPreference">
              Save Preference
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="provider in providers" :key="provider.id" class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <span class="text-3xl">{{ provider.icon }}</span>
                <div>
                  <h3 class="card-title text-lg">{{ provider.name }}</h3>
                  <p class="text-xs text-base-content/60">{{ provider.description }}</p>
                </div>
              </div>
              <span
                v-if="isProviderConfigured(provider.id)"
                class="badge badge-success"
              >
                Configured
              </span>
              <span v-else class="badge badge-ghost">Not set</span>
            </div>

            <div class="flex items-center gap-2">
              <span
                class="badge"
                :class="provider.available ? 'badge-success' : 'badge-neutral'"
              >
                {{ provider.available ? "Available" : "Unavailable" }}
              </span>
              <span class="badge badge-outline">
                {{ provider.health }}
              </span>
            </div>

            <div v-if="testResults[provider.id]" class="alert" :class="testResults[provider.id]?.valid ? 'alert-success' : 'alert-error'">
              <span>{{ testResults[provider.id]?.message }}</span>
            </div>

            <div class="card-actions justify-end">
              <button
                class="btn btn-outline btn-sm"
                :disabled="!isProviderConfigured(provider.id) || testingProvider === provider.id"
                @click="handleTestProvider(provider.id)"
              >
                <span v-if="testingProvider === provider.id" class="loading loading-spinner loading-xs"></span>
                Test Connection
              </button>
              <NuxtLink to="/settings" class="btn btn-primary btn-sm">
                Configure
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
