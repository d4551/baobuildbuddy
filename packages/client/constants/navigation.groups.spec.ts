import { describe, expect, it } from "vitest";
import { getSidebarNavigationGroups, NAVIGATION_GROUP_IDS, NAVIGATION_ITEMS } from "./navigation";

describe("sidebar navigation groups SSOT", () => {
  it("assigns every sidebar item a known groupId", () => {
    for (const item of NAVIGATION_ITEMS.filter((entry) => entry.includeInSidebar)) {
      expect(NAVIGATION_GROUP_IDS.includes(item.groupId)).toBe(true);
    }
  });

  it("returns non-empty Work/Create/Intelligence/System groups", () => {
    const groups = getSidebarNavigationGroups();
    expect(groups.map((group) => group.id)).toEqual([...NAVIGATION_GROUP_IDS]);
    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it("places AI chat before AI dashboard in intelligence", () => {
    const intelligence = getSidebarNavigationGroups().find((group) => group.id === "intelligence");
    expect(intelligence?.items.map((item) => item.id)).toEqual(["ai-chat", "ai-dashboard"]);
  });
});
