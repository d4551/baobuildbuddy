import { describe, expect, test } from "bun:test";
import { collectStackingTokenViolationsForContent } from "./validate-stacking-tokens";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectStackingTokenViolationsForContent", () => {
  test("flags arbitrary z-[N] utilities", () => {
    const violations = collectStackingTokenViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="z-[999]"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("z-[999]"))).toBe(true);
  });

  test("flags raw z-index CSS literals", () => {
    const violations = collectStackingTokenViolationsForContent(
      CONSUMER_PATH,
      ".overlay { z-index: 40; }",
    );
    expect(violations.some((v) => v.message.includes("z-index"))).toBe(true);
  });

  test("allows Tailwind z-* scale and SSOT authority", () => {
    expect(
      collectStackingTokenViolationsForContent(
        CONSUMER_PATH,
        '<template><div class="z-40"></div></template>',
      ),
    ).toHaveLength(0);
    expect(
      collectStackingTokenViolationsForContent(
        "packages/client/assets/css/main.css",
        ".glass-modal-root { z-index: 50; }",
      ),
    ).toHaveLength(0);
  });
});
