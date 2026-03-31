import { API_ENDPOINT_PREFIX } from "@bao/shared/constants/endpoints";
import { describe, expect, it } from "vitest";
import { resolveTreatyBase } from "./treaty-base";

describe("treaty base resolution", () => {
  const requestUrl = new URL("http://localhost:3004/resume/preview?id=resume-1");

  it("uses the request origin when the configured base is the shared api prefix", () => {
    expect(resolveTreatyBase(API_ENDPOINT_PREFIX, requestUrl)).toBe("http://localhost:3004");
  });

  it("strips a trailing api segment from absolute backends", () => {
    expect(resolveTreatyBase(`http://localhost:3002${API_ENDPOINT_PREFIX}`, requestUrl)).toBe(
      "http://localhost:3002",
    );
  });

  it("preserves upstream path prefixes before api", () => {
    expect(
      resolveTreatyBase(`https://example.test/backend${API_ENDPOINT_PREFIX}`, requestUrl),
    ).toBe("https://example.test/backend");
  });

  it("leaves non api-suffixed paths intact", () => {
    expect(resolveTreatyBase("https://example.test/backend", requestUrl)).toBe(
      "https://example.test/backend",
    );
  });
});
