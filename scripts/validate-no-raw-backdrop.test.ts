import { describe, expect, test } from "bun:test";
import { collectRawBackdropViolationsForContent } from "./validate-no-raw-backdrop";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectRawBackdropViolationsForContent", () => {
  test("flags backdrop-blur utilities", () => {
    const violations = collectRawBackdropViolationsForContent(
      CONSUMER_PATH,
      '<template><div class="backdrop-blur-md"></div></template>',
    );
    expect(violations.some((v) => v.message.includes("backdrop-blur"))).toBe(true);
  });

  test("flags raw backdrop-filter CSS", () => {
    const violations = collectRawBackdropViolationsForContent(
      CONSUMER_PATH,
      ".panel { backdrop-filter: blur(8px); }",
    );
    expect(violations.some((v) => v.message.includes("backdrop-filter"))).toBe(true);
  });

  test("allows SSOT authority glass definitions", () => {
    const violations = collectRawBackdropViolationsForContent(
      "packages/client/assets/css/main.css",
      ".glass-subtle { backdrop-filter: blur(var(--glass-blur-subtle)); }",
    );
    expect(violations).toHaveLength(0);
  });
});
