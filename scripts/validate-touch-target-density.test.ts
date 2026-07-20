import { describe, expect, test } from "bun:test";
import { collectTouchTargetDensityViolations } from "./validate-touch-target-density";

describe("validate-touch-target-density", () => {
  test("bare btn-xs fails", () => {
    const violations = collectTouchTargetDensityViolations(
      "packages/client/pages/demo.vue",
      `<button class="btn btn-xs btn-ghost">x</button>`,
    );
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("btn-xs");
  });

  test("btn-xs with TOUCH_TARGET_MIN_CLASS nearby passes", () => {
    const violations = collectTouchTargetDensityViolations(
      "packages/client/pages/demo.vue",
      `<button class="btn btn-xs" :class="[TOUCH_TARGET_MIN_CLASS]">x</button>`,
    );
    expect(violations.length).toBe(0);
  });
});
