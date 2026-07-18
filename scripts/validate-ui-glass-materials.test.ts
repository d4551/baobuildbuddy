import { describe, expect, test } from "bun:test";
import { collectGlassMaterialViolationsForContent } from "./validate-ui-glass-materials";

const CONSUMER_PATH = "packages/client/components/dashboard/ExampleWidget.vue";

describe("collectGlassMaterialViolationsForContent", () => {
  test("flags card with shadow but no glass class", () => {
    const violations = collectGlassMaterialViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="card card-border shadow-lg"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("glass material class"))).toBe(true);
  });

  test("flags bespoke panel surface (bg-base + shadow + border)", () => {
    const violations = collectGlassMaterialViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="bg-base-100 shadow-lg border-base-300 p-4"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("Bespoke panel surface"))).toBe(true);
  });

  test("flags interactive card without glass-interactive mixin", () => {
    const violations = collectGlassMaterialViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="card card-glass" @click="onClick">x</div></template>',
    );
    expect(violations.some((v) => v.message.includes("glass-interactive"))).toBe(true);
  });

  test("allows card with card-glass + glass-interactive on @click", () => {
    const violations = collectGlassMaterialViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="card card-glass glass-interactive" @click="onClick">x</div></template>',
    );
    expect(violations).toHaveLength(0);
  });

  test("allows card-glass-strong without interactive mixin (non-interactive)", () => {
    const violations = collectGlassMaterialViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="card card-glass-strong">static</div></template>',
    );
    expect(violations).toHaveLength(0);
  });
});
