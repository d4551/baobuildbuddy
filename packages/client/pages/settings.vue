<script setup lang="ts">
import type { AppSettings, AutomationSettings } from "@bao/shared";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared";
import {
  type AIProviderType,
  AI_PROVIDER_CATALOG,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@bao/shared";

type SettingsWithFlags = AppSettings & {
  hasGeminiKey?: boolean;
  hasOpenaiKey?: boolean;
  hasClaudeKey?: boolean;
  hasHuggingfaceToken?: boolean;
  hasLocalKey?: boolean;
};

type ProviderField =
  | "localModelEndpoint"
  | "localModelName"
  | "geminiApiKey"
  | "openaiApiKey"
  | "claudeApiKey"
  | "huggingfaceToken";

type ProviderInputConfig = {
  id: AIProviderType;
  label: string;
  description: string;
  field: ProviderField;
  keyLabel: string;
  placeholder: string;
};

const { settings, fetchSettings, updateSettings, updateApiKeys, testApiKey, loading } =
  useSettings();
const { theme, toggleTheme } = useTheme();
const { $toast } = useNuxtApp();

const providerFieldById = {
  local: "localModelEndpoint",
  gemini: "geminiApiKey",
  openai: "openaiApiKey",
  claude: "claudeApiKey",
  huggingface: "huggingfaceToken",
} satisfies Record<AIProviderType, ProviderField>;

const providerInputs: ProviderInputConfig[] = AI_PROVIDER_CATALOG.map((provider) => {
  const placeholder =
    provider.id === "local"
      ? LOCAL_AI_DEFAULT_ENDPOINT
      : provider.id === "huggingface"
        ? "Enter Hugging Face token"
        : `Enter ${provider.name} API key`;

  return {
    id: provider.id,
    label: provider.name,
    description: provider.description,
    field: providerFieldById[provider.id],
    keyLabel:
      provider.id === "local" ? "Endpoint URL" : provider.requiresCredential ? "API Key" : "Token",
    placeholder,
  };
});

const apiKeys = reactive<Record<ProviderField, string>>({
  geminiApiKey: "",
  openaiApiKey: "",
  claudeApiKey: "",
  huggingfaceToken: "",
  localModelEndpoint: LOCAL_AI_DEFAULT_ENDPOINT,
  localModelName: LOCAL_AI_DEFAULT_MODEL,
});

const testResults = reactive<Record<AIProviderType, { valid: boolean } | null>>({
  local: null,
  gemini: null,
  openai: null,
  claude: null,
  huggingface: null,
});

const testingProvider = ref<AIProviderType | null>(null);

// Automation settings reactive state
const automationForm = reactive<AutomationSettings>({ ...DEFAULT_AUTOMATION_SETTINGS });

function getComputedSettings(): SettingsWithFlags | null {
  return settings.value as SettingsWithFlags | null;
}

onMounted(async () => {
  await fetchSettings();
  const current = settings.value;
  if (!current) return;

  apiKeys.localModelEndpoint = current.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT;
  apiKeys.localModelName = current.localModelName || LOCAL_AI_DEFAULT_MODEL;

  // Load automation settings
  if (current.automationSettings) {
    Object.assign(automationForm, current.automationSettings);
  }
});

function isProviderConfigured(providerId: AIProviderType): boolean {
  const current = getComputedSettings();
  if (!current) return false;

  if (providerId === "local") {
    return current.hasLocalKey ?? true;
  }
  if (providerId === "gemini") return !!current.hasGeminiKey;
  if (providerId === "openai") return !!current.hasOpenaiKey;
  if (providerId === "claude") return !!current.hasClaudeKey;
  return !!current.hasHuggingfaceToken;
}

async function handleTest(providerId: AIProviderType) {
  const testInput =
    providerId === "local"
      ? apiKeys.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT
      : apiKeys[providerFieldById[providerId]]?.trim();

  if (!testInput && providerId !== "local") return;

  testingProvider.value = providerId;
  testResults[providerId] = null;

  try {
    const result = await testApiKey(providerId, testInput);
    testResults[providerId] = result;
    if (result?.valid) {
      $toast.success("Connection successful");
    } else {
      $toast.error("Connection failed");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to test provider";
    $toast.error(message);
    testResults[providerId] = { valid: false };
  } finally {
    testingProvider.value = null;
  }
}

async function handleSaveKeys() {
  const payload: Record<string, string> = {
    localModelEndpoint: apiKeys.localModelEndpoint || LOCAL_AI_DEFAULT_ENDPOINT,
    localModelName: apiKeys.localModelName || LOCAL_AI_DEFAULT_MODEL,
  };

  if (apiKeys.geminiApiKey.trim()) payload.geminiApiKey = apiKeys.geminiApiKey.trim();
  if (apiKeys.openaiApiKey.trim()) payload.openaiApiKey = apiKeys.openaiApiKey.trim();
  if (apiKeys.claudeApiKey.trim()) payload.claudeApiKey = apiKeys.claudeApiKey.trim();
  if (apiKeys.huggingfaceToken.trim()) payload.huggingfaceToken = apiKeys.huggingfaceToken.trim();

  try {
    await updateApiKeys(payload);
    $toast.success("API keys saved");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save API keys";
    $toast.error(message);
  }
}

async function handleToggleTheme() {
  const nextTheme = theme.value === "bao-light" ? "bao-dark" : "bao-light";
  toggleTheme();

  try {
    await updateSettings({ theme: nextTheme });
    $toast.success("Theme saved");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save theme";
    $toast.error(message);
  }
}

async function handleSaveAutomation() {
  try {
    await updateSettings({ automationSettings: { ...automationForm } });
    $toast.success("Automation settings saved");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save automation settings";
    $toast.error(message);
  }
}
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Settings</h1>

    <LoadingSkeleton v-if="loading && !settings" :lines="8" />

    <div v-else class="space-y-8">
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Appearance</h2>
          <div class="flex items-center justify-between">
            <span>Theme</span>
            <label class="flex items-center gap-3 cursor-pointer">
              <span class="text-sm">Light</span>
              <input type="checkbox" class="toggle toggle-primary theme-controller" value="bao-dark" :checked="theme === 'bao-dark'" @change="handleToggleTheme" />
              <span class="text-sm">Dark</span>
            </label>
          </div>
        </div>
      </div>

      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">AI Providers</h2>
          <p class="text-sm text-base-content/70 mb-4">
            Local providers are preferred first. Add cloud credentials only for fallback or extra capacity.
          </p>

          <div class="space-y-6">
            <div
              v-for="provider in providerInputs"
              :key="provider.id"
              class="collapse collapse-arrow bg-base-100"
            >
              <input type="radio" name="provider-accordion" aria-label="Provider Accordion"/>
              <div class="collapse-title font-medium flex items-center gap-2">
                {{ provider.label }}
                <span v-if="isProviderConfigured(provider.id)" class="badge badge-success badge-xs">configured</span>
              </div>
              <div class="collapse-content space-y-3">
                <p class="text-sm text-base-content/60">{{ provider.description }}</p>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">{{ provider.keyLabel }}</legend>
                  <div class="join w-full">
                    <input
                      v-model="apiKeys[provider.field]"
                      :type="provider.id === 'local' ? 'text' : 'password'"
                      :placeholder="provider.placeholder"
                      class="input join-item w-full"
                      aria-label="provider.placeholder"/>
                    <button class="btn btn-outline join-item" @click="handleTest(provider.id)">
                      <span v-if="testingProvider === provider.id" class="loading loading-spinner loading-xs"></span>
                      Test
                    </button>
                  </div>
                </fieldset>
                <div v-if="provider.id === 'local'" class="fieldset">
                  <fieldset class="fieldset">
                    <legend class="fieldset-legend">Local model name</legend>
                    <input
                      v-model="apiKeys.localModelName"
                      type="text"
                      class="input w-full"
                      placeholder="e.g. llama3.2"
                      aria-label="e.g. llama3.2"/>
                  </fieldset>
                </div>
                <span
                  v-if="testResults[provider.id]"
                  class="badge"
                  :class="testResults[provider.id]?.valid ? 'badge-success' : 'badge-error'"
                >
                  {{ testResults[provider.id]?.valid ? "Connected" : "Failed" }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-actions mt-4">
            <button class="btn btn-primary" @click="handleSaveKeys">Save API keys</button>
          </div>
        </div>
      </div>

      <!-- Automation & RPA Settings -->
      <div class="card bg-base-200">
        <div class="card-body">
          <h2 class="card-title">Automation & RPA</h2>
          <p class="text-sm text-base-content/70 mb-4">
            Configure browser automation settings for job application RPA workflows.
          </p>

          <div class="space-y-4">
            <!-- Headless Mode -->
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium">Headless Mode</span>
                <p class="text-sm text-base-content/60">Run browser automation without visible window</p>
              </div>
              <input v-model="automationForm.headless" type="checkbox" class="toggle toggle-primary" aria-label="Headless"/>
            </div>

            <!-- Smart AI Selectors -->
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium">Smart AI Selectors</span>
                <p class="text-sm text-base-content/60">Use AI to detect form fields automatically</p>
              </div>
              <input v-model="automationForm.enableSmartSelectors" type="checkbox" class="toggle toggle-primary" aria-label="Enable Smart Selectors"/>
            </div>

            <!-- Auto-save Screenshots -->
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium">Auto-save Screenshots</span>
                <p class="text-sm text-base-content/60">Capture screenshots at each step of automation</p>
              </div>
              <input v-model="automationForm.autoSaveScreenshots" type="checkbox" class="toggle toggle-primary" aria-label="Auto Save Screenshots"/>
            </div>

            <div class="divider"></div>

            <!-- Default Timeout -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Default Timeout (seconds)</legend>
              <input
                v-model.number="automationForm.defaultTimeout"
                type="number"
                class="input w-full"
                min="5"
                max="120"
                placeholder="30"
                aria-label="30"/>
              <p class="text-xs text-base-content/50 mt-1">How long to wait for page elements (5-120 seconds)</p>
            </fieldset>

            <!-- Screenshot Retention -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Screenshot Retention (days)</legend>
              <input
                v-model.number="automationForm.screenshotRetention"
                type="number"
                class="input w-full"
                min="1"
                max="30"
                placeholder="7"
                aria-label="7"/>
              <p class="text-xs text-base-content/50 mt-1">How long to keep automation screenshots (1-30 days)</p>
            </fieldset>

            <!-- Max Concurrent Runs -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Max Concurrent Runs</legend>
              <input
                v-model.number="automationForm.maxConcurrentRuns"
                type="number"
                class="input w-full"
                min="1"
                max="5"
                placeholder="1"
                aria-label="1"/>
              <p class="text-xs text-base-content/50 mt-1">Maximum simultaneous automation runs (1-5)</p>
            </fieldset>

            <!-- Default Browser -->
            <fieldset class="fieldset">
              <legend class="fieldset-legend">Default Browser</legend>
              <select v-model="automationForm.defaultBrowser" class="select w-full" aria-label="Default Browser">
                <option value="chrome">Chrome</option>
                <option value="chromium">Chromium</option>
                <option value="edge">Edge</option>
              </select>
              <p class="text-xs text-base-content/50 mt-1">Browser to use for RPA automation</p>
            </fieldset>
          </div>

          <div class="card-actions mt-4">
            <button class="btn btn-primary" @click="handleSaveAutomation">Save Automation Settings</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
