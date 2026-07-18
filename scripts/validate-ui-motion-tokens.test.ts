import { describe, expect, test } from "bun:test";
import { collectMotionTokenViolationsForContent } from "./validate-ui-motion-tokens";

const CONSUMER_PATH = "packages/client/components/dashboard/ExampleWidget.vue";
const SSOT_CSS_PATH = "packages/client/assets/css/main.css";
const SSOT_LAYOUT_PATH = "packages/client/constants/layout.ts";

describe("collectMotionTokenViolationsForContent", () => {
  test("flags raw duration-200 utility", () => {
    const violations = collectMotionTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="transition-colors duration-200"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("duration-200"))).toBe(true);
  });

  test("flags raw ease-in-out utility", () => {
    const violations = collectMotionTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="transition-colors ease-in-out"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("ease-in-out"))).toBe(true);
  });

  test("flags transition-all", () => {
    const violations = collectMotionTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="transition-all"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("transition-all"))).toBe(true);
  });

  test("flags animate-spin / animate-pulse", () => {
    const violations = collectMotionTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="animate-spin"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("animate-spin"))).toBe(true);
  });

  test("allows SSOT CSS variable motion tokens", () => {
    const violations = collectMotionTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="transition-[width] duration-[var(--motion-fast)] ease-[var(--ease-response)]"></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows SSOT source files to define motion tokens", () => {
    const violations = collectMotionTokenViolationsForContent(
      SSOT_CSS_PATH,
      ":root { --motion-fast: 120ms; } .x { transition: opacity var(--motion-fast) var(--ease-enter); }",
    );
    expect(violations).toHaveLength(0);
  });

  test("allows SSOT layout constants to reference motion tokens", () => {
    const violations = collectMotionTokenViolationsForContent(
      SSOT_LAYOUT_PATH,
      'export const X = "duration-[var(--motion-fast)] ease-[var(--ease-response)]";',
    );
    expect(violations).toHaveLength(0);
  });
});
