import { describe, expect, test } from "bun:test";
import { collectMissingLayoutTokenImportViolationsForContent } from "./validate-layout-token-imports";

describe("collectMissingLayoutTokenImportViolationsForContent", () => {
  test("flags STACK_SPACE_Y_TOKEN_CLASS used without import", () => {
    const violations = collectMissingLayoutTokenImportViolationsForContent(
      "packages/client/components/settings/Example.vue",
      [
        "<script setup lang=\"ts\">",
        "import { FLEX_GAP_TOKEN_CLASS } from \"~/constants/layout\";",
        "</script>",
        "<template>",
        '  <div :class="[STACK_SPACE_Y_TOKEN_CLASS.stack1]"></div>',
        "</template>",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("STACK_SPACE_Y_TOKEN_CLASS"))).toBe(true);
  });

  test("allows imported tokens", () => {
    const violations = collectMissingLayoutTokenImportViolationsForContent(
      "packages/client/error.vue",
      [
        "<script setup lang=\"ts\">",
        "import { STACK_SPACE_Y_TOKEN_CLASS, TYPOGRAPHY_SCALE_CLASS } from \"~/constants/layout\";",
        "</script>",
        "<template>",
        '  <h1 :class="[TYPOGRAPHY_SCALE_CLASS.xl4]">x</h1>',
        "</template>",
      ].join("\n"),
    );
    expect(violations).toHaveLength(0);
  });
});
