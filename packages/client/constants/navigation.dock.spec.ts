import { describe, expect, it } from "vitest";
import {
  DOCK_NAVIGATION_IDS,
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

  it("uses the canonical Home/Work/Create/AI/System dock set", () => {
    expect(getDockNavigationItems().map((item) => item.id)).toEqual([...DOCK_NAVIGATION_IDS]);
  });

  it("never flags more dock candidates than the cap without slice protection", () => {
    const flagged = NAVIGATION_ITEMS.filter((item) => item.includeInDock);
    expect(flagged.length).toBeLessThanOrEqual(MOBILE_DOCK_MAX_ITEMS);
  });

  it("excludes automation and docs from the dock", () => {
    const ids = getDockNavigationItems().map((item) => item.id);
    expect(ids).not.toContain("automation");
    expect(ids).not.toContain("apiDocs");
  });
});
