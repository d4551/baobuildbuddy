import { describe, expect, test } from "bun:test";
import { collectInsetPanelSsotViolationsForContent } from "./validate-inset-panel-ssot";

describe("validate-inset-panel-ssot", () => {
  test("flags raw inset panel class strings", () => {
    const violations = collectInsetPanelSsotViolationsForContent(
      "packages/client/components/example.vue",
      `<template><div class="rounded-box border border-base-300 bg-base-100">x</div></template>`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("allows SSOT owner modules", () => {
    const violations = collectInsetPanelSsotViolationsForContent(
      "packages/client/constants/layout-shell.ts",
      `export const INSET_PANEL_CLASS = "rounded-box border border-base-300 bg-base-100";`,
    );
    expect(violations).toEqual([]);
  });
});
