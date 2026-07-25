import { APP_ROUTES } from "@bao/shared/constants/routes";
import { describe, expect, it } from "vitest";
import {
  DOCK_NAVIGATION_IDS,
  getDockNavigationItems,
  isDockRouteActive,
  NAVIGATION_ITEMS,
  type NavigationItem,
} from "./navigation";

const requireNavItem = (id: string): NavigationItem => {
  const item = NAVIGATION_ITEMS.find((candidate) => candidate.id === id);
  expect(item, `${id} nav item missing from NAVIGATION_ITEMS`).toBeDefined();
  if (!item) {
    throw new Error(`${id} nav item missing from NAVIGATION_ITEMS`);
  }
  return item;
};

describe("dock section wayfinding", () => {
  it("activates ai-chat for AI section prefixes", () => {
    const aiChat = requireNavItem("ai-chat");
    expect(isDockRouteActive(APP_ROUTES.aiChat, aiChat)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.aiDashboard, aiChat)).toBe(true);
  });

  it("activates Jobs dock for automation Work-section routes (automation not in dock)", () => {
    const jobs = requireNavItem("jobs");
    const automation = requireNavItem("automation");
    expect(automation.includeInDock).toBe(false);
    expect(jobs.includeInDock).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automation, jobs)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationRuns, jobs)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationJobApply, jobs)).toBe(true);
  });

  it("keeps dock composition as Home/Work/Create/AI/System", () => {
    const ids = getDockNavigationItems().map((item) => item.id);
    expect(ids).toEqual([...DOCK_NAVIGATION_IDS]);
  });
});
