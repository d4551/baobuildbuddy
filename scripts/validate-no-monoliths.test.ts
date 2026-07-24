import { describe, expect, test } from "bun:test";
import { collectMonolithViolationsForContent } from "./validate-no-monoliths";
import {
  HTTP_BAD_REQUEST as HTTP_STATUS_BAD_REQUEST,
  HTTP_INTERNAL_ERROR as HTTP_STATUS_INTERNAL_SERVER_ERROR,
} from "./constants/numeric-literals";
const NUM_450 = 450;

const COMPONENT_PATH = "packages/client/components/example/ExampleWidget.vue";
const TS_PATH = "packages/server/src/routes/example.ts";

describe("collectMonolithViolationsForContent", () => {
  test("flags a vue file exceeding 350 lines", () => {
    const content = `<template>\n${"  <div />\n".repeat(HTTP_STATUS_BAD_REQUEST)}</template>`;
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
    const content = `<template>\n${"  <div />\n".repeat(HTTP_STATUS_INTERNAL_SERVER_ERROR)}</template>`;
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
