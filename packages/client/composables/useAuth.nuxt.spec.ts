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

function getNuxtState<T>(key: string, initializer?: () => T) {
  if (!nuxtStateStore.has(key)) {
    nuxtStateStore.set(key, ref(initializer ? initializer() : undefined) as Ref<unknown>);
  }
  return nuxtStateStore.get(key) as Ref<T>;
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
  it("checkAuthStatus returns authRequired: false when api returns error", async () => {
    mockApi.auth.status.get.mockResolvedValueOnce({
      data: null,
      error: { value: "err" },
    });

    const { checkAuthStatus } = useAuth();
    const result = await checkAuthStatus();
    expect(result.authRequired).toBe(false);
    expect(result.configured).toBe(false);
  });

  it("checkAuthStatus returns data when api succeeds", async () => {
    mockApi.auth.status.get.mockResolvedValueOnce({
      data: { authRequired: true, configured: true },
      error: null,
    });

    const { checkAuthStatus } = useAuth();
    const result = await checkAuthStatus();
    expect(result.authRequired).toBe(true);
    expect(result.configured).toBe(true);
  });

  it("stores and retrieves the API key through Nuxt app injection", () => {
    const { getStoredApiKey: readApiKey, setStoredApiKey: persistApiKey } = useAuth();

    expect(readApiKey()).toBeNull();
    persistApiKey("abc");
    expect(readApiKey()).toBe("abc");
  });
});
