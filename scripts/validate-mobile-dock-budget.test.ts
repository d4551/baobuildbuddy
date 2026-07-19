import { describe, expect, test } from "bun:test";
import { collectMobileDockBudgetViolations } from "./validate-mobile-dock-budget";

describe("validate-mobile-dock-budget", () => {
  test("current navigation dock budget is within the SSOT cap", () => {
    expect(collectMobileDockBudgetViolations()).toEqual([]);
  });
});
