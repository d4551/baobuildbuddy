import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import { useSettings } from "./useSettings";

const mockApi = {
  settings: {
    get: vi.fn(),
    put: vi.fn(),
    "api-keys": { put: vi.fn() },
    "test-api-key": { post: vi.fn() },
  },
};

mockNuxtImport("useApi", () => () => mockApi);

describe("useSettings", () => {
  it("fetchSettings sets loading and updates settings on success", async () => {
    const mockSettings = { id: "default", theme: "bao-light" };
    vi.mocked(mockApi.settings.get).mockResolvedValueOnce({ data: mockSettings, error: null });
    const { fetchSettings, settings, loading } = useSettings();
    await fetchSettings();
    expect(loading.value).toBe(false);
    expect(settings.value).toEqual(mockSettings);
  });

  it("fetchSettings keeps loading false when API errors", async () => {
    vi.mocked(mockApi.settings.get).mockResolvedValueOnce({ data: null, error: { value: "err" } });
    const { fetchSettings, loading } = useSettings();
    await expect(fetchSettings()).rejects.toThrow("Failed to fetch settings");
    expect(loading.value).toBe(false);
  });
});
