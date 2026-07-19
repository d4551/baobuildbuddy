import { describe, expect, test } from "bun:test";
import { collectUiLayoutTokenViolationsForContent } from "./validate-ui-layout-tokens";

const PAGE_PATH = "packages/client/pages/example.vue";
const COMPONENT_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectUiLayoutTokenViolationsForContent", () => {
  test("flags inline shadow tokens in component templates", () => {
    const violations = collectUiLayoutTokenViolationsForContent(
      COMPONENT_PATH,
      '<template><div class="card border border-base-300 shadow-lg"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("shadow-lg"))).toBe(true);
  });

  test("flags inline radius tokens in component templates", () => {
    const violations = collectUiLayoutTokenViolationsForContent(
      COMPONENT_PATH,
      '<template><div class="rounded-2xl"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("rounded-2xl"))).toBe(true);
  });

  test("flags page width literals in pages", () => {
    const violations = collectUiLayoutTokenViolationsForContent(
      PAGE_PATH,
      '<template><div class="max-w-7xl"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("Page width literals"))).toBe(true);
  });

  test("flags ad-hoc grid breakpoint classes outside SectionGrid", () => {
    const violations = collectUiLayoutTokenViolationsForContent(
      COMPONENT_PATH,
      '<template><div class="grid grid-cols-1 gap-4 md:grid-cols-2"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("SectionGrid"))).toBe(true);
  });

  test("allows SSOT source files to define shadow and radius tokens", () => {
    const violations = collectUiLayoutTokenViolationsForContent(
      "packages/client/constants/layout.ts",
      'export const AUTH_CARD_SHELL_CLASS = "card w-full max-w-md bg-base-100 shadow-lg";',
    );
    expect(violations).toHaveLength(0);
  });

  test("softening regression: flags shadow-sm not just shadow-lg", () => {
    const violations = collectUiLayoutTokenViolationsForContent(
      COMPONENT_PATH,
      '<template><div class="card shadow-sm"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("shadow-sm"))).toBe(true);
  });

  test("softening regression: flags rounded-full not just rounded-2xl", () => {
    const violations = collectUiLayoutTokenViolationsForContent(
      COMPONENT_PATH,
      '<template><div class="rounded-full"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("rounded-full"))).toBe(true);
  });
});
