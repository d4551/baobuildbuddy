import { describe, expect, it } from "bun:test";
import { collectPrimaryActionDensityViolations } from "./validate-primary-action-density";

describe("validate-primary-action-density", () => {
  it("flags btn-primary paired with btn-sm", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<button class="btn btn-primary btn-sm">Go</button>`,
    );
    expect(violations.some((v) => v.message.includes("btn-sm"))).toBe(true);
  });

  it("flags literal btn-primary in static class attributes", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<button class="btn btn-primary">Go</button>`,
    );
    expect(violations.some((v) => v.message.includes("PRIMARY_ACTION_CLASS"))).toBe(true);
  });

  it("flags literal btn-primary in script string defaults", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<script setup>\nconst x = { summaryClass: "btn btn-primary" };\n</script>`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  it("allows PRIMARY_ACTION_CLASS binding", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<button :class="PRIMARY_ACTION_CLASS">Go</button>`,
    );
    expect(violations).toEqual([]);
  });

  it("allows PRIMARY_ACTION_CLASS with extra modifiers", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<button :class="[PRIMARY_ACTION_CLASS, 'join-item']">Go</button>`,
    );
    expect(violations).toEqual([]);
  });

  it("allows PRIMARY_BUTTON_VARIANT_CLASS for segmented controls", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<button :class="{ [PRIMARY_BUTTON_VARIANT_CLASS]: isActive }">Go</button>`,
    );
    expect(violations).toEqual([]);
  });

  it("ignores btn-primary in HTML comments", () => {
    const violations = collectPrimaryActionDensityViolations(
      "x.vue",
      `<!-- legacy: class="btn btn-primary" --><button :class="PRIMARY_ACTION_CLASS">Go</button>`,
    );
    expect(violations).toEqual([]);
  });
});
