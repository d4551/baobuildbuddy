import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Ref, ref } from "vue";

const nuxtStateStore = new Map<string, Ref<unknown>>();
let storedApiKey: string | null = null;
const mockApi = {
  auth: {
    status: { get: vi.fn() },
    init: { post: vi.fn() },
  },
};

function getNuxtState<T>(key: string, initializer?: () => T): Ref<T> {
  const existing = nuxtStateStore.get(key);
  if (existing) {
    return existing as Ref<T>;
  }
  const created: Ref<unknown> = ref(initializer ? initializer() : undefined);
  nuxtStateStore.set(key, created);
  return created as Ref<T>;
}

function resetNuxtState() {
  nuxtStateStore.clear();
  storedApiKey = null;
}

vi.mock("./nuxtRuntime", () => ({
  useNuxtRuntimeApp: () => ({
    $getStoredApiKey: () => storedApiKey,
    $setStoredApiKey: (apiKey: string | null) => {
      storedApiKey = apiKey;
    },
  }),
  useNuxtState: getNuxtState,
}));

vi.mock("./useApi", () => ({
  useApi: () => mockApi,
}));

const { useAuth } = await import("./useAuth");

beforeEach(() => {
  vi.clearAllMocks();
  resetNuxtState();
});

describe("useAuth", () => {
  it("checkAuthStatus fails closed when api status is unavailable", async () => {
    mockApi.auth.status.get.mockResolvedValueOnce({
      data: null,
      error: { value: "err" },
    });

    const { checkAuthStatus } = useAuth();
    const result = await checkAuthStatus();
    expect(result.authRequired).toBe(true);
    expect(result.configured).toBe(false);
    expect(result.bootstrapRequired).toBe(true);
    expect(result.setupTokenConfigured).toBe(false);
  });

  it("checkAuthStatus returns data when api succeeds", async () => {
    mockApi.auth.status.get.mockResolvedValueOnce({
      data: {
        authRequired: true,
        configured: true,
        bootstrapRequired: false,
        setupTokenConfigured: true,
      },
      error: null,
    });

    const { checkAuthStatus } = useAuth();
    const result = await checkAuthStatus();
    expect(result.authRequired).toBe(true);
    expect(result.configured).toBe(true);
    expect(result.bootstrapRequired).toBe(false);
    expect(result.setupTokenConfigured).toBe(true);
  });

  it("passes setupToken to auth init requests", async () => {
    mockApi.auth.init.post.mockResolvedValueOnce({
      data: { configured: true, apiKey: "bao_test", message: "ok" },
      error: null,
    });

    const { initAuth } = useAuth();
    const result = await initAuth("setup-token");

    expect(mockApi.auth.init.post).toHaveBeenCalledWith({ setupToken: "setup-token" });
    expect(result.apiKey).toBe("bao_test");
  });

  it("stores and retrieves the API key through Nuxt app injection", () => {
    const { getStoredApiKey: readApiKey, setStoredApiKey: persistApiKey } = useAuth();

    expect(readApiKey()).toBeNull();
    persistApiKey("abc");
    expect(readApiKey()).toBe("abc");
  });
});
