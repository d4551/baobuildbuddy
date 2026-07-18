import { describe, expect, test } from "bun:test";
import { collectTypographyViolationsForContent } from "./validate-ui-typography";

const CONSUMER_PATH = "packages/client/pages/index.vue";
const SSOT_LAYOUT_PATH = "packages/client/constants/layout.ts";

describe("collectTypographyViolationsForContent", () => {
  test("flags raw text-xl", () => {
    const violations = collectTypographyViolationsForContent(
      CONSUMER_PATH,
      '<template><h2 class="text-xl">Title</h2></template>',
    );
    expect(violations.some((v) => v.message.includes("text-xl"))).toBe(true);
  });

  test("flags raw font-bold", () => {
    const violations = collectTypographyViolationsForContent(
      CONSUMER_PATH,
      '<template><h2 class="font-bold">Title</h2></template>',
    );
    expect(violations.some((v) => v.message.includes("font-bold"))).toBe(true);
  });

  test("flags raw leading-tight", () => {
    const violations = collectTypographyViolationsForContent(
      CONSUMER_PATH,
      '<template><p class="leading-tight">x</p></template>',
    );
    expect(violations.some((v) => v.message.includes("leading-tight"))).toBe(true);
  });

  test("allows text-sm (semantic helper)", () => {
    const violations = collectTypographyViolationsForContent(
      CONSUMER_PATH,
      '<template><p class="text-sm">x</p></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows text-muted / text-secondary / text-primary", () => {
    const violations = collectTypographyViolationsForContent(
      CONSUMER_PATH,
      '<template><p class="text-muted text-secondary text-primary">x</p></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows SSOT layout constants to define typography scale", () => {
    const violations = collectTypographyViolationsForContent(
      SSOT_LAYOUT_PATH,
      'export const X = "text-2xl font-bold";',
    );
    expect(violations).toHaveLength(0);
  });
});
