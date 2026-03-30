import type { AppSettings } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { computed, readonly } from "vue";
import { useI18n } from "vue-i18n";
import { toAppSettings } from "./api-normalizer-settings";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";
import { useNuxtState } from "./nuxtRuntime";
import { useApi } from "./useApi";
import {
  type ClientProviderTestResult,
  resolveAIRoutingPreference,
  resolveLocalProviderState,
  resolveProviderDiagnostics,
} from "~/utils/ai-control-plane";

type ApiClient = ReturnType<typeof useApi>;
type UpdateSettingsInput = NonNullable<Parameters<ApiClient["settings"]["put"]>[0]>;
type UpdateApiKeysInput = NonNullable<Parameters<ApiClient["settings"]["api-keys"]["put"]>[0]>;
type TestApiKeyInput = NonNullable<Parameters<ApiClient["settings"]["test-api-key"]["post"]>[0]>;
type ProviderTestResult = ClientProviderTestResult & {
  provider: TestApiKeyInput["provider"];
};

interface SettingsContext {
  api: ApiClient;
  t: ReturnType<typeof useI18n>["t"];
  settings: ReturnType<typeof useNuxtState<AppSettings | null>>;
  loading: ReturnType<typeof useNuxtState<boolean>>;
}

function createAiConfigurationIncompleteComputed(
  settings: ReturnType<typeof useNuxtState<AppSettings | null>>,
) {
  return computed(() => {
    if (!settings.value) {
      return false;
    }

    const localConfigured =
      settings.value.hasLocalKey ??
      Boolean(settings.value.localModelEndpoint?.trim());
    const localDiagnosticCode = settings.value.providerDiagnostics?.local?.code;
    const hasLocalConfig =
      localConfigured &&
      (localDiagnosticCode ? localDiagnosticCode === "healthy" : localConfigured);
    const hasCloudProvider =
      Boolean(settings.value.hasGeminiKey) ||
      Boolean(settings.value.hasOpenaiKey) ||
      Boolean(settings.value.hasClaudeKey) ||
      Boolean(settings.value.hasHuggingfaceToken);

    return !(hasLocalConfig || hasCloudProvider);
  });
}

function createChatRoutingPreferenceComputed(
  settings: ReturnType<typeof useNuxtState<AppSettings | null>>,
) {
  return computed(() => resolveAIRoutingPreference(settings.value, "chat"));
}

function createProviderDiagnosticsComputed(
  settings: ReturnType<typeof useNuxtState<AppSettings | null>>,
) {
  return computed(() => resolveProviderDiagnostics(settings.value));
}

function createLocalProviderStateComputed(
  settings: ReturnType<typeof useNuxtState<AppSettings | null>>,
) {
  return computed(() => resolveLocalProviderState({ settings: settings.value }));
}

function createSettingsActions(context: SettingsContext) {
  const fetchSettings = async () =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.settings.get();
      assertApiResponse(error, context.t("apiErrors.settings.fetchFailed"));
      const normalized = requireValue(
        toAppSettings(data),
        context.t("apiErrors.settings.invalidPayload"),
      );
      context.settings.value = normalized;
    });

  const updateSettings = async (updates: UpdateSettingsInput) =>
    withLoadingState(context.loading, async () => {
      const { error } = await context.api.settings.put(updates);
      assertApiResponse(error, context.t("apiErrors.settings.updateFailed"));
      await fetchSettings();
    });

  const updateApiKeys = async (keys: UpdateApiKeysInput) =>
    withLoadingState(context.loading, async () => {
      const { error } = await context.api.settings["api-keys"].put(keys);
      assertApiResponse(error, context.t("apiErrors.settings.updateApiKeysFailed"));
      await fetchSettings();
    });

  const testApiKey = async (
    provider: TestApiKeyInput["provider"],
    key: string,
    model?: string,
  ): Promise<ProviderTestResult> => {
    const { data, error } = await context.api.settings["test-api-key"].post({ provider, key, model });
    if (error || !data || typeof data.valid !== "boolean") {
      return { valid: false, provider, diagnosticCode: "error" };
    }
    return {
      valid: data.valid,
      provider,
      diagnosticCode: typeof data.diagnosticCode === "string" ? data.diagnosticCode : undefined,
      message: typeof data.message === "string" ? data.message : undefined,
      availableModels: Array.isArray(data.availableModels)
        ? data.availableModels.filter((value): value is string => typeof value === "string")
        : undefined,
      selectedModel: typeof data.selectedModel === "string" ? data.selectedModel : undefined,
    };
  };

  return {
    fetchSettings,
    updateSettings,
    updateApiKeys,
    testApiKey,
  };
}

/**
 * Provides accessors and mutators for global app settings.
 *
 * @returns State and actions for reading/updating settings and API keys.
 */
export function useSettings() {
  const context: SettingsContext = {
    api: useApi(),
    t: useI18n().t,
    settings: useNuxtState<AppSettings | null>(STATE_KEYS.APP_SETTINGS, () => null),
    loading: useNuxtState(STATE_KEYS.SETTINGS_LOADING, () => false),
  };

  const isAiConfigurationIncomplete = createAiConfigurationIncompleteComputed(context.settings);
  const chatRoutingPreference = createChatRoutingPreferenceComputed(context.settings);
  const providerDiagnostics = createProviderDiagnosticsComputed(context.settings);
  const localProviderState = createLocalProviderStateComputed(context.settings);
  const actions = createSettingsActions(context);

  return {
    settings: readonly(context.settings),
    loading: readonly(context.loading),
    isAiConfigurationIncomplete: readonly(isAiConfigurationIncomplete),
    chatRoutingPreference: readonly(chatRoutingPreference),
    providerDiagnostics: readonly(providerDiagnostics),
    localProviderState: readonly(localProviderState),
    ...actions,
  };
}
