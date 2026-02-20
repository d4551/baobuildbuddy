import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Ref, ref } from "vue";

const nuxtStateStore = new Map<string, Ref<unknown>>();
const mockApi = {
  settings: {
    get: vi.fn(),
    put: vi.fn(),
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

const { useSettings } = await import("./useSettings");

beforeEach(() => {
  vi.clearAllMocks();
  resetNuxtState();
});

describe("useSettings", () => {
  it("fetchSettings sets loading and updates settings on success", async () => {
    const mockSettings = { id: "default", theme: "bao-light" };
    mockApi.settings.get.mockResolvedValueOnce({ data: mockSettings, error: null });

    const { fetchSettings, settings, loading } = useSettings();

    await fetchSettings();
    expect(loading.value).toBe(false);
    expect(settings.value).toMatchObject({
      id: "default",
      theme: "bao-light",
      language: "en",
      notifications: {
        achievements: true,
        dailyChallenges: true,
        levelUp: true,
        jobAlerts: true,
      },
    });
    expect(settings.value?.preferredProvider).toBeDefined();
  });

  it("fetchSettings keeps loading false when API errors", async () => {
    mockApi.settings.get.mockResolvedValueOnce({ data: null, error: { value: "err" } });

    const { fetchSettings, loading } = useSettings();

    await expect(fetchSettings()).rejects.toThrow("Failed to fetch settings");
    expect(loading.value).toBe(false);
  });
});
