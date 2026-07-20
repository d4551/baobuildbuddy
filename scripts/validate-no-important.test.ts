import { describe, expect, test } from "bun:test";
import { collectImportantViolationsForContent } from "./validate-no-important";

describe("collectImportantViolationsForContent", () => {
  test("flags !important outside CSS SSOT", () => {
    const violations = collectImportantViolationsForContent(
      "packages/client/components/example/ExampleWidget.vue",
      "<style scoped>.box { color: red !important; }</style>",
    );
    expect(violations.some((v) => v.message.includes("!important"))).toBe(true);
  });

  test("allows !important in main.css SSOT", () => {
    const violations = collectImportantViolationsForContent(
      "packages/client/assets/css/main.css",
      ".glass-solid { backdrop-filter: none !important; }",
    );
    expect(violations).toHaveLength(0);
  });
});
