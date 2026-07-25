import { describe, expect, it } from "bun:test";
import { collectOutlineActionDensityViolations } from "./validate-outline-action-density";

describe("validate-outline-action-density", () => {
  it("flags literal btn-outline in class attributes", () => {
    const violations = collectOutlineActionDensityViolations(
      "x.vue",
      `<button class="btn btn-outline">Go</button>`,
    );
    expect(violations.some((v) => v.message.includes("OUTLINE_ACTION_CLASS"))).toBe(true);
  });

  it("flags literal btn-soft", () => {
    const violations = collectOutlineActionDensityViolations(
      "x.vue",
      `<button class="btn btn-soft">Go</button>`,
    );
    expect(violations.some((v) => v.message.includes("SOFT_ACTION_CLASS"))).toBe(true);
  });

  it("allows OUTLINE_ACTION_CLASS binding", () => {
    const violations = collectOutlineActionDensityViolations(
      "x.vue",
      `<button :class="OUTLINE_ACTION_CLASS">Go</button>`,
    );
    expect(violations).toEqual([]);
  });

  it("allows SOFT_ACTION_CLASS binding", () => {
    const violations = collectOutlineActionDensityViolations(
      "x.vue",
      `<button :class="[SOFT_ACTION_CLASS]">Go</button>`,
    );
    expect(violations).toEqual([]);
  });

  it("softening regression: flags outline in script string defaults", () => {
    const violations = collectOutlineActionDensityViolations(
      "x.vue",
      `<script setup>\nconst x = { summaryClass: "btn btn-outline" };\n</script>`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
