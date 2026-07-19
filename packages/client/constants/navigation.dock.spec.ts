import { describe, expect, it } from "vitest";
import {
  getDockNavigationItems,
  MOBILE_DOCK_MAX_ITEMS,
  NAVIGATION_ITEMS,
} from "./navigation";

describe("mobile dock navigation SSOT", () => {
  it("keeps dock at or under Apple HIG primary-destination cap", () => {
    const dock = getDockNavigationItems();
    expect(dock.length).toBeGreaterThan(0);
    expect(dock.length).toBeLessThanOrEqual(MOBILE_DOCK_MAX_ITEMS);
  });

  it("never flags more dock candidates than the cap without slice protection", () => {
    const flagged = NAVIGATION_ITEMS.filter((item) => item.includeInDock);
    expect(flagged.length).toBeLessThanOrEqual(MOBILE_DOCK_MAX_ITEMS);
  });

  it("includes core career destinations and excludes docs/API chrome", () => {
    const ids = getDockNavigationItems().map((item) => item.id);
    expect(ids).toContain("dashboard");
    expect(ids).toContain("jobs");
    expect(ids).toContain("settings");
    expect(ids).not.toContain("apiDocs");
  });
});
