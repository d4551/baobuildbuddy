import { describe, expect, test } from "bun:test";
import { collectBadgeActionSsotViolationsForContent } from "./validate-badge-action-ssot";

describe("validate-badge-action-ssot", () => {
  test("flags raw badge class literals in Vue surfaces", () => {
    const violations = collectBadgeActionSsotViolationsForContent(
      "packages/client/components/example.vue",
      `<template><span class="badge badge-primary">x</span></template>`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("allows badge SSOT token modules", () => {
    const violations = collectBadgeActionSsotViolationsForContent(
      "packages/client/constants/layout-badges.ts",
      `export const BADGE_PRIMARY_CLASS = "badge badge-primary";`,
    );
    expect(violations).toEqual([]);
  });
});
