import { describe, expect, test } from "bun:test";
import { collectLogicalCssViolationsForContent } from "./validate-logical-css";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";
const SSOT_PATH = "packages/client/constants/layout.ts";

describe("collectLogicalCssViolationsForContent", () => {
  test("flags physical text alignment utilities", () => {
    const violations = collectLogicalCssViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="text-left"></div><td class="text-right"></td></template>',
    );
    expect(violations.some((v) => v.message.includes("text-left"))).toBe(true);
    expect(violations.some((v) => v.message.includes("text-right"))).toBe(true);
  });

  test("flags physical margin/padding/inset utilities", () => {
    const violations = collectLogicalCssViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="ml-2 mr-auto pl-4 pr-10 left-2 right-1.5"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("ml-2"))).toBe(true);
    expect(violations.some((v) => v.message.includes("mr-auto"))).toBe(true);
    expect(violations.some((v) => v.message.includes("pl-4"))).toBe(true);
    expect(violations.some((v) => v.message.includes("pr-10"))).toBe(true);
    expect(violations.some((v) => v.message.includes("left-2"))).toBe(true);
    expect(violations.some((v) => v.message.includes("right-1.5"))).toBe(true);
  });

  test("does not flag JS identifiers or French words with accent boundaries", () => {
    const violations = collectLogicalCssViolationsForContent(
      "packages/client/locales/fr-FR/catalog.ts",
      [
        'previousAria: "Page précédente des offres",',
        ".sort((left, right) => right.score - left.score)",
      ].join("\n"),
    );
    expect(violations).toHaveLength(0);
  });

  test("does not flag TypeScript parameter type annotations named left/right", () => {
    const violations = collectLogicalCssViolationsForContent(
      "packages/client/pages/automation/runs/index.vue",
      [
        "function compareRunsForSort(",
        "  left: RpaRunExecutionEnvelope,",
        "  right: RpaRunExecutionEnvelope,",
        "): number {",
        "  return left.id.localeCompare(right.id);",
        "}",
      ].join("\n"),
    );
    expect(violations).toHaveLength(0);
  });

  test("still flags CSS left/right property declarations with values", () => {
    const violations = collectLogicalCssViolationsForContent(
      CONSUMER_PATH,
      "<style>.panel { left: 0; right: auto; }</style>",
    );
    expect(violations.some((v) => v.message.includes("left:"))).toBe(true);
    expect(violations.some((v) => v.message.includes("right:"))).toBe(true);
  });

  test("allows logical utilities", () => {
    const violations = collectLogicalCssViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="ms-2 me-auto ps-4 pe-10 start-2 end-1.5 text-start text-end"></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("exempts SSOT authority files", () => {
    const violations = collectLogicalCssViolationsForContent(
      SSOT_PATH,
      'export const FAB_POSITION_CLASS = "left-6 bottom-24";',
    );
    expect(violations).toHaveLength(0);
  });
});
