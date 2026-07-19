import { describe, expect, test } from "bun:test";
import { collectResponsiveOverflowViolationsForContent } from "./validate-ui-responsive-overflow";

const CONSUMER_PATH = "packages/client/components/dashboard/ExampleWidget.vue";
const SSOT_LAYOUT_PATH = "packages/client/constants/layout.ts";

describe("collectResponsiveOverflowViolationsForContent", () => {
  test("flags fixed width w-64 without min-w-0 or max-w guard", () => {
    const violations = collectResponsiveOverflowViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="flex w-64"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("w-64"))).toBe(true);
  });

  test("allows w-64 with min-w-0 guard", () => {
    const violations = collectResponsiveOverflowViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="flex w-64 min-w-0"></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows w-full", () => {
    const violations = collectResponsiveOverflowViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="w-full"></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("flags fixed height h-64 on content block", () => {
    const violations = collectResponsiveOverflowViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="h-64"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("h-64"))).toBe(true);
  });

  test("flags grid-cols-4 without responsive guard", () => {
    const violations = collectResponsiveOverflowViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="grid grid-cols-4"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("grid-cols-4"))).toBe(true);
  });

  test("allows grid-cols-1 sm:grid-cols-4", () => {
    const violations = collectResponsiveOverflowViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="grid grid-cols-1 sm:grid-cols-4"></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows SSOT layout constants to define fixed widths", () => {
    const violations = collectResponsiveOverflowViolationsForContent(
      SSOT_LAYOUT_PATH,
      'export const X = "lg:w-64 shrink-0";',
    );
    expect(violations).toHaveLength(0);
  });
});
