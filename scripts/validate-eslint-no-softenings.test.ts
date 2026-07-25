import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { collectEslintSofteningViolationsForContent } from "./validate-eslint-no-softenings";

const LIVE_ESLINT = readFileSync(
  new URL("../packages/client/eslint.config.js", import.meta.url),
  "utf8",
);

describe("validate-eslint-no-softenings", () => {
  test("flags severity softens on banned rules", () => {
    const violations = collectEslintSofteningViolationsForContent(
      "packages/client/eslint.config.mjs",
      `export default [{ rules: { "vue/multi-word-component-names": "off" } }];`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("live eslint.config.js still has softeners (ratchet owns growth; zero-cutover not claimed)", () => {
    const violations = collectEslintSofteningViolationsForContent(
      "packages/client/eslint.config.js",
      LIVE_ESLINT,
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});
