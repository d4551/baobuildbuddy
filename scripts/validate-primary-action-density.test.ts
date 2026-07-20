import { describe, expect, it } from "bun:test";
import { collectPrimaryActionDensityViolations } from "./validate-primary-action-density";

describe("validate-primary-action-density", () => {
  it("flags btn-primary paired with btn-sm", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<button class="btn btn-primary btn-sm">Go</button>`,
    );
    expect(violations.length).toBe(1);
  });

  it("allows PRIMARY_ACTION_CLASS / touch-floor primary", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<button class="btn btn-primary h-11 min-h-11">Go</button>`,
    );
    expect(violations).toEqual([]);
  });
});
