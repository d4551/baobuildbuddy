import { describe, expect, it } from "vitest";
import { buildApiProxyWildcardTarget, normalizeApiProxyTarget } from "./api-proxy-target";

describe("api proxy target normalization", () => {
  it("preserves the api suffix for absolute proxy targets", () => {
    expect(normalizeApiProxyTarget("http://localhost:3002/api")).toBe("http://localhost:3002/api");
    expect(normalizeApiProxyTarget("http://localhost:3002/api/")).toBe("http://localhost:3002/api");
  });

  it("appends the api suffix when the target path does not include it", () => {
    expect(normalizeApiProxyTarget("http://localhost:3002")).toBe("http://localhost:3002/api");
    expect(normalizeApiProxyTarget("http://localhost:3002/")).toBe("http://localhost:3002/api");
    expect(normalizeApiProxyTarget("https://example.test/backend")).toBe(
      "https://example.test/backend/api",
    );
  });
});

describe("api proxy wildcard target", () => {
  it("builds wildcard targets without duplicating the api prefix", () => {
    expect(buildApiProxyWildcardTarget("http://localhost:3002")).toBe(
      "http://localhost:3002/api/**",
    );
    expect(buildApiProxyWildcardTarget("http://localhost:3002/api")).toBe(
      "http://localhost:3002/api/**",
    );
  });
});
