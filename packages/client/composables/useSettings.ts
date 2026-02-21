import type { AppSettings } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";
import { computed, readonly } from "vue";
import { useI18n } from "vue-i18n";
import { toAppSettings } from "./api-normalizers";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";
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
  const { t } = useI18n();
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
    return withLoadingState(loading, async () => {
      const { data, error } = await api.settings.get();
      assertApiResponse(error, t("apiErrors.settings.fetchFailed"));
      const normalized = requireValue(toAppSettings(data), t("apiErrors.settings.invalidPayload"));
      settings.value = normalized;
    });
  }

  async function updateSettings(updates: UpdateSettingsInput) {
    return withLoadingState(loading, async () => {
      const { error } = await api.settings.put(updates);
      assertApiResponse(error, t("apiErrors.settings.updateFailed"));
      await fetchSettings();
    });
  }

  async function updateApiKeys(keys: UpdateApiKeysInput) {
    return withLoadingState(loading, async () => {
      const { error } = await api.settings["api-keys"].put(keys);
      assertApiResponse(error, t("apiErrors.settings.updateApiKeysFailed"));
      await fetchSettings();
    });
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
