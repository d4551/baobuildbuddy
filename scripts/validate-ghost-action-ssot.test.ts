import { describe, expect, test } from "bun:test";
import { collectGhostActionSsotViolationsForContent } from "./validate-ghost-action-ssot";

describe("validate-ghost-action-ssot", () => {
  test("flags raw btn-ghost literals", () => {
    const violations = collectGhostActionSsotViolationsForContent(
      "packages/client/components/example.vue",
      `<template><button class="btn btn-ghost">Menu</button></template>`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("allows GHOST_ACTION token modules", () => {
    const violations = collectGhostActionSsotViolationsForContent(
      "packages/client/constants/layout-tokens.ts",
      `export const GHOST_ACTION_CLASS = "btn btn-ghost h-11 min-h-11";`,
    );
    expect(violations).toEqual([]);
  });
});
