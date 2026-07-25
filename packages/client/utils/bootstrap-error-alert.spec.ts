import { describe, expect, it } from "vitest";
import { hasBootstrapErrorRetry } from "./bootstrap-error-alert";

describe("hasBootstrapErrorRetry", () => {
  it("requires both label and aria label", () => {
    expect(hasBootstrapErrorRetry("Retry", "Retry bootstrap")).toBe(true);
    expect(hasBootstrapErrorRetry("Retry", "")).toBe(false);
    expect(hasBootstrapErrorRetry("", "Retry bootstrap")).toBe(false);
    expect(hasBootstrapErrorRetry("  ", "  ")).toBe(false);
  });
});
