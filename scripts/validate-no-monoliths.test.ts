import { describe, expect, test } from "bun:test";
import { collectMonolithViolationsForContent } from "./validate-no-monoliths";

const NUM_450 = 450;
/** Just over the 350-line Vue ceiling enforced by validate-no-monoliths. */
const LINES_OVER_VUE_LIMIT = 400;
/** Comfortably over the Vue ceiling, used by the softening-regression cases. */
const LINES_WELL_OVER_VUE_LIMIT = 500;

const COMPONENT_PATH = "packages/client/components/example/ExampleWidget.vue";
const TS_PATH = "packages/server/src/routes/example.ts";

describe("collectMonolithViolationsForContent", () => {
  test("flags a vue file exceeding 350 lines", () => {
    const content = `<template>\n${"  <div />\n".repeat(LINES_OVER_VUE_LIMIT)}</template>`;
    const violations = collectMonolithViolationsForContent(COMPONENT_PATH, content);
    expect(violations.some((v) => v.message.includes("File exceeds"))).toBe(true);
  });

  test("flags a typescript file exceeding 400 lines", () => {
    const content = "// long\n".repeat(NUM_450);
    const violations = collectMonolithViolationsForContent(TS_PATH, content);
    expect(violations.some((v) => v.message.includes("File exceeds"))).toBe(true);
  });

  test("flags a function body exceeding 80 lines", () => {
    const lines = [
      "function long() {",
      ...Array.from({ length: 90 }, (_, i) => `  const v${i} = ${i};`),
      "}",
    ];
    const violations = collectMonolithViolationsForContent(TS_PATH, lines.join("\n"));
    expect(violations.some((v) => v.message.includes("Function body"))).toBe(true);
  });

  test("passes short files", () => {
    const content = "export const x = 1;\n";
    const violations = collectMonolithViolationsForContent(TS_PATH, content);
    expect(violations).toHaveLength(0);
  });

  test("softening regression: does not skip vue monoliths", () => {
    const content = `<template>\n${"  <div />\n".repeat(LINES_WELL_OVER_VUE_LIMIT)}</template>`;
    const violations = collectMonolithViolationsForContent(COMPONENT_PATH, content);
    expect(violations.length).toBeGreaterThan(0);
  });

  test("softening regression: does not skip oversized functions with arrow syntax", () => {
    const lines = [
      "const handler = () => {",
      ...Array.from({ length: 90 }, (_, i) => `  const v${i} = ${i};`),
      "};",
    ];
    const violations = collectMonolithViolationsForContent(TS_PATH, lines.join("\n"));
    expect(violations.some((v) => v.message.includes("Function body"))).toBe(true);
  });
});
