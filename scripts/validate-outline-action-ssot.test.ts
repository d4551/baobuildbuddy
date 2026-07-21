import { describe, expect, test } from "bun:test";
import { collectOutlineActionSsotViolationsForContent } from "./validate-outline-action-ssot";

describe("validate-outline-action-ssot", () => {
  test("flags raw btn-outline literals", () => {
    const violations = collectOutlineActionSsotViolationsForContent(
      "packages/client/components/example.vue",
      `<template><button class="btn btn-outline">Go</button></template>`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("allows OUTLINE_ACTION token modules", () => {
    const violations = collectOutlineActionSsotViolationsForContent(
      "packages/client/constants/layout-tokens.ts",
      `export const OUTLINE_ACTION_CLASS = "btn btn-outline h-11 min-h-11";`,
    );
    expect(violations).toEqual([]);
  });
});
