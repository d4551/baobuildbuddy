import type { AppSettings } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

/**
 * Settings and API key management composable.
 */
export function useSettings() {
  const api = useApi();
  const settings = useState<AppSettings | null>(STATE_KEYS.APP_SETTINGS, () => null);
  const loading = useState(STATE_KEYS.SETTINGS_LOADING, () => false);

  async function fetchSettings() {
    loading.value = true;
    try {
      const { data, error } = await api.settings.get();
      if (error) throw new Error("Failed to fetch settings");
      settings.value = data as AppSettings;
    } finally {
      loading.value = false;
    }
  }

  async function updateSettings(updates: Partial<AppSettings>) {
    loading.value = true;
    try {
      const { error } = await api.settings.put(updates);
      if (error) throw new Error("Failed to update settings");
      await fetchSettings();
    } finally {
      loading.value = false;
    }
  }

  async function updateApiKeys(keys: Record<string, string>) {
    loading.value = true;
    try {
      const { error } = await api.settings["api-keys"].put(keys);
      if (error) throw new Error("Failed to update API keys");
      await fetchSettings();
    } finally {
      loading.value = false;
    }
  }

  async function testApiKey(provider: string, key: string) {
    const { data, error } = await api.settings["test-api-key"].post({ provider, key });
    if (error) return { valid: false, provider };
    return data as { valid: boolean; provider: string };
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    fetchSettings,
    updateSettings,
    updateApiKeys,
    testApiKey,
  };
}
