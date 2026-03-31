import { describe, expect, test } from "bun:test";
import { collectNoHtmxViolationsForContent } from "./validate-no-htmx";
import { collectNoTryCatchViolationsForContent } from "./validate-no-try-catch";
import { collectUiSingleSourceViolationsForContent } from "./validate-ui-single-source-of-truth";

describe("collectNoHtmxViolationsForContent", () => {
  test("flags hx attributes in Vue templates", () => {
    const violations = collectNoHtmxViolationsForContent(
      "packages/client/pages/example.vue",
      `<template><button hx-get="/jobs">Load</button></template>`,
    );

    expect(violations.some((violation) => violation.message.includes("hx attributes"))).toBe(true);
  });
});

describe("collectNoTryCatchViolationsForContent", () => {
  test("flags promise catch handlers", () => {
    const promiseCatchSample = ["void task", ".", "cat", "ch((error) => report(error));"].join("");
    const violations = collectNoTryCatchViolationsForContent(
      "scripts/example.ts",
      promiseCatchSample,
    );

    expect(violations.some((violation) => violation.message.includes("Promise catch"))).toBe(true);
  });
});

describe("collectUiSingleSourceViolationsForContent", () => {
  test("flags local style blocks in Vue files", () => {
    const violations = collectUiSingleSourceViolationsForContent(
      "packages/client/components/example.vue",
      `<template><div /></template>\n<style scoped>\n.box {}\n</style>`,
    );

    expect(violations.some((violation) => violation.message.includes("<style> blocks"))).toBe(true);
  });
});
