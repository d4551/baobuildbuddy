import { describe, expect, test } from "bun:test";
import { collectEslintSofteningViolationsForContent } from "./validate-eslint-no-softenings";

describe("validate-eslint-no-softenings", () => {
  test("flags severity softens on banned rules", () => {
    const violations = collectEslintSofteningViolationsForContent(
      "packages/client/eslint.config.mjs",
      `export default [{ rules: { "vue/multi-word-component-names": "off" } }];`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
