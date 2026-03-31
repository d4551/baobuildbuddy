import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Ref, ref } from "vue";
import type { JobTaxonomySettings } from "@bao/shared/types/jobs-taxonomy";

const nuxtStateStore = new Map<string, Ref<unknown>>();
const mockApi = {
  settings: {
    get: vi.fn(),
    put: vi.fn(),
    "job-taxonomy": { put: vi.fn() },
    "api-keys": { put: vi.fn() },
    "test-api-key": { post: vi.fn() },
  },
};

function getNuxtState<T>(key: string, initializer?: () => T) {
  if (!nuxtStateStore.has(key)) {
    nuxtStateStore.set(key, ref(initializer ? initializer() : undefined) as Ref<unknown>);
  }
  return nuxtStateStore.get(key) as Ref<T>;
}

function resetNuxtState() {
  nuxtStateStore.clear();
}

vi.mock("./nuxtRuntime", () => ({
  useNuxtRuntimeApp: () => ({}),
  useNuxtState: getNuxtState,
}));

vi.mock("./useApi", () => ({
  useApi: () => mockApi,
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

const { useSettings } = await import("./useSettings");

beforeEach(() => {
  vi.clearAllMocks();
  resetNuxtState();
});

describe("useSettings fetchSettings", () => {
  it("fetchSettings sets loading and updates settings on success", async () => {
    const mockSettings = { id: "default", theme: "corporate" };
    mockApi.settings.get.mockResolvedValueOnce({ data: mockSettings, error: null });

    const { fetchSettings, settings, loading, chatRoutingPreference, localProviderState } =
      useSettings();

    await fetchSettings();
    expect(loading.value).toBe(false);
    expect(settings.value).toMatchObject({
      id: "default",
      theme: "corporate",
      language: "en-US",
      notifications: {
        achievements: true,
        dailyChallenges: true,
        levelUp: true,
        jobAlerts: true,
      },
    });
    expect(settings.value?.preferredProvider).toBeDefined();
    expect(settings.value?.aiRouting?.chat?.provider).toBeDefined();
    expect(chatRoutingPreference.value.provider).toBe(settings.value?.aiRouting.chat.provider);
    expect(localProviderState.value.endpoint).toBe("http://localhost:11434/v1");
  });

  it("fetchSettings keeps loading false when API errors", async () => {
    mockApi.settings.get.mockResolvedValueOnce({ data: null, error: { value: "err" } });

    const { fetchSettings, loading } = useSettings();

    await expect(fetchSettings()).rejects.toThrow("apiErrors.settings.fetchFailed");
    expect(loading.value).toBe(false);
  });
});

describe("useSettings ai diagnostics", () => {
  it("treats unhealthy local diagnostics as incomplete when no cloud provider is configured", async () => {
    mockApi.settings.get.mockResolvedValueOnce({
      data: {
        id: "default",
        theme: "corporate",
        localModelEndpoint: "http://localhost:11434/v1",
        hasLocalKey: true,
        providerDiagnostics: {
          local: {
            provider: "local",
            code: "unreachable",
            checkedAt: "2026-03-24T00:00:00.000Z",
            message: "Endpoint did not respond",
          },
        },
      },
      error: null,
    });

    const { fetchSettings, isAiConfigurationIncomplete } = useSettings();

    await fetchSettings();
    expect(isAiConfigurationIncomplete.value).toBe(true);
  });
});

describe("useSettings job taxonomy", () => {
  it("updates job taxonomy through the dedicated settings endpoint", async () => {
    const mockSettings = {
      id: "default",
      theme: "corporate",
      jobTaxonomy: { keywords: [], studioRules: [] },
    };
    mockApi.settings["job-taxonomy"].put.mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });
    mockApi.settings.get.mockResolvedValueOnce({ data: mockSettings, error: null });

    const { updateJobTaxonomy } = useSettings();
    const payload: JobTaxonomySettings = {
      keywords: [
        {
          id: "role:graphics-programmer",
          category: "role",
          label: "Graphics Programmer",
          synonyms: [],
          sortOrder: 0,
          enabled: true,
        },
      ],
      studioRules: [],
    };

    await updateJobTaxonomy(payload);
    expect(mockApi.settings["job-taxonomy"].put).toHaveBeenCalledWith(payload);
    expect(mockApi.settings.get).toHaveBeenCalled();
  });
});
