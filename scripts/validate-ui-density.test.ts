import { describe, expect, test } from "bun:test";
import { collectDensityViolationsForContent } from "./validate-ui-density";

const CONSUMER_PATH = "packages/client/components/dashboard/ExampleWidget.vue";

describe("collectDensityViolationsForContent", () => {
  test("flags cramped row: flex + gap-1 without wrap guard", () => {
    const violations = collectDensityViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="flex gap-1"><span>a</span><span>b</span><span>c</span></div></template>',
    );
    expect(violations.some((v) => v.message.includes("Cramped row"))).toBe(true);
  });

  test("allows cramped row with flex-wrap guard", () => {
    const violations = collectDensityViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="flex flex-wrap gap-1"><span>a</span></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows cramped row with overflow-hidden guard", () => {
    const violations = collectDensityViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="flex gap-1 overflow-hidden"><span>a</span></div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("flags verbose button label alongside icon", () => {
    const violations = collectDensityViolationsForContent(
      CONSUMER_PATH,
      "<template><button><svg></svg>Refresh AI Provider Dashboard Analytics Now</button></template>",
    );
    expect(violations.some((v) => v.message.includes("verbose label"))).toBe(true);
  });

  test("allows short button label with icon", () => {
    const violations = collectDensityViolationsForContent(
      CONSUMER_PATH,
      "<template><button><svg></svg>Refresh</button></template>",
    );
    expect(violations).toHaveLength(0);
  });
});
