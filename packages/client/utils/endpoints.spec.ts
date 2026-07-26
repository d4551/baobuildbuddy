import { API_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import { describe, expect, it } from "vitest";
import {
  resolveApiBase,
  resolveApiEndpoint,
  resolveApiRouteBase,
  resolveBrowserApiFetchUrl,
} from "./endpoints";

describe("endpoint base resolution", () => {
  const requestUrl = new URL("http://localhost:3004/resume/preview");

  it("keeps the runtime api base for raw endpoint resolution", () => {
    expect(resolveApiBase(API_ENDPOINT_PREFIX, requestUrl)).toBe(
      `http://localhost:3004${API_ENDPOINT_PREFIX}`,
    );
  });

  it("strips the api suffix for grouped api clients", () => {
    expect(resolveApiRouteBase(API_ENDPOINT_PREFIX, requestUrl)).toBe("http://localhost:3004");
    expect(resolveApiRouteBase(`http://localhost:3002${API_ENDPOINT_PREFIX}`, requestUrl)).toBe(
      "http://localhost:3002",
    );
    expect(
      resolveApiRouteBase(`https://example.test/backend${API_ENDPOINT_PREFIX}`, requestUrl),
    ).toBe("https://example.test/backend");
  });

  it("still de-duplicates endpoint paths when the base already ends with api", () => {
    expect(
      resolveApiEndpoint(API_ENDPOINT_PREFIX, requestUrl, `${API_ENDPOINT_PREFIX}/settings`),
    ).toBe(`http://localhost:3004${API_ENDPOINT_PREFIX}/settings`);
  });

  it("rewrites absolute API export URLs to same-origin proxy paths in the browser", () => {
    const resumesExportPath = `${API_ENDPOINT_PREFIX}/resumes/abc/export`;
    const portfolioExportPath = `${API_ENDPOINT_PREFIX}/portfolio/export`;
    expect(
      resolveBrowserApiFetchUrl(
        `http://127.0.0.1:3000${resumesExportPath}`,
        new URL("http://127.0.0.1:3001/resume"),
      ),
    ).toBe(resumesExportPath);
    expect(
      resolveBrowserApiFetchUrl(
        `http://127.0.0.1:3001${portfolioExportPath}`,
        new URL("http://127.0.0.1:3001/portfolio"),
      ),
    ).toBe(portfolioExportPath);
  });
});
