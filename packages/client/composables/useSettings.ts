import type { AppSettings } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { computed, readonly } from "vue";
import { toAppSettings } from "./api-normalizers";
import { useNuxtState } from "./nuxtRuntime";
import { useApi } from "./useApi";

type ApiClient = ReturnType<typeof useApi>;
type UpdateSettingsInput = NonNullable<Parameters<ApiClient["settings"]["put"]>[0]>;
type UpdateApiKeysInput = NonNullable<Parameters<ApiClient["settings"]["api-keys"]["put"]>[0]>;
type TestApiKeyInput = NonNullable<Parameters<ApiClient["settings"]["test-api-key"]["post"]>[0]>;

/**
 * Provides accessors and mutators for global app settings.
 *
 * @returns State and actions for reading/updating settings and API keys.
 */
export function useSettings() {
  const api = useApi();
  const settings = useNuxtState<AppSettings | null>(STATE_KEYS.APP_SETTINGS, () => null);
  const loading = useNuxtState(STATE_KEYS.SETTINGS_LOADING, () => false);
  const isAiConfigurationIncomplete = computed(() => {
    if (!settings.value) {
      return false;
    }

    const hasLocalConfig =
      settings.value.hasLocalKey ??
      Boolean(settings.value.localModelEndpoint?.trim() && settings.value.localModelName?.trim());
    const hasCloudProvider =
      Boolean(settings.value.hasGeminiKey) ||
      Boolean(settings.value.hasOpenaiKey) ||
      Boolean(settings.value.hasClaudeKey) ||
      Boolean(settings.value.hasHuggingfaceToken);

    return !hasLocalConfig && !hasCloudProvider;
  });

  async function fetchSettings() {
    loading.value = true;
    try {
      const { data, error } = await api.settings.get();
      if (error) throw new Error("Failed to fetch settings");
      const normalized = toAppSettings(data);
      if (!normalized) throw new Error("Invalid settings payload");
      settings.value = normalized;
    } finally {
      loading.value = false;
    }
  }

  async function updateSettings(updates: UpdateSettingsInput) {
    loading.value = true;
    try {
      const { error } = await api.settings.put(updates);
      if (error) throw new Error("Failed to update settings");
      await fetchSettings();
    } finally {
      loading.value = false;
    }
  }

  async function updateApiKeys(keys: UpdateApiKeysInput) {
    loading.value = true;
    try {
      const { error } = await api.settings["api-keys"].put(keys);
      if (error) throw new Error("Failed to update API keys");
      await fetchSettings();
    } finally {
      loading.value = false;
    }
  }

  async function testApiKey(provider: TestApiKeyInput["provider"], key: string) {
    const { data, error } = await api.settings["test-api-key"].post({ provider, key });
    if (error) return { valid: false, provider };
    if (!data || typeof data.valid !== "boolean") {
      return { valid: false, provider };
    }
    return { valid: data.valid, provider };
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    isAiConfigurationIncomplete: readonly(isAiConfigurationIncomplete),
    fetchSettings,
    updateSettings,
    updateApiKeys,
    testApiKey,
  };
}
