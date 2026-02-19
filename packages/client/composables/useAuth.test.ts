import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";

const mockApi = {
  auth: {
    status: { get: vi.fn() },
    init: { post: vi.fn() },
  },
};

mockNuxtImport("useApi", () => () => mockApi);

describe("useAuth", () => {
  it("checkAuthStatus returns authRequired: false when api returns error", async () => {
    vi.mocked(mockApi.auth.status.get).mockResolvedValueOnce({
      data: null,
      error: { value: "err" },
    });
    const { checkAuthStatus } = useAuth();
    const result = await checkAuthStatus();
    expect(result.authRequired).toBe(false);
    expect(result.configured).toBe(false);
  });

  it("checkAuthStatus returns data when api succeeds", async () => {
    vi.mocked(mockApi.auth.status.get).mockResolvedValueOnce({
      data: { authRequired: true, configured: true },
      error: null,
    });
    const { checkAuthStatus } = useAuth();
    const result = await checkAuthStatus();
    expect(result.authRequired).toBe(true);
    expect(result.configured).toBe(true);
  });
});
