import { APP_ROUTES } from "@bao/shared/constants/routes";
import { describe, expect, it } from "vitest";
import {
  DOCK_NAVIGATION_IDS,
  getDockNavigationItems,
  isDockRouteActive,
  NAVIGATION_ITEMS,
} from "./navigation";

describe("dock section wayfinding", () => {
  it("activates ai-chat for AI section prefixes", () => {
    const aiChat = NAVIGATION_ITEMS.find((item) => item.id === "ai-chat");
    expect(aiChat, "ai-chat nav item missing from NAVIGATION_ITEMS").toBeDefined();
    expect(isDockRouteActive(APP_ROUTES.aiChat, aiChat!)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.aiDashboard, aiChat!)).toBe(true);
  });

  it("activates Jobs dock for automation Work-section routes (automation not in dock)", () => {
    const jobs = NAVIGATION_ITEMS.find((item) => item.id === "jobs");
    const automation = NAVIGATION_ITEMS.find((item) => item.id === "automation");
    expect(jobs, "jobs nav item missing from NAVIGATION_ITEMS").toBeDefined();
    expect(automation, "automation nav item missing from NAVIGATION_ITEMS").toBeDefined();
    expect(automation!.includeInDock).toBe(false);
    expect(jobs!.includeInDock).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automation, jobs!)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationRuns, jobs!)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationJobApply, jobs!)).toBe(true);
  });

  it("keeps dock composition as Home/Work/Create/AI/System", () => {
    const ids = getDockNavigationItems().map((item) => item.id);
    expect(ids).toEqual([...DOCK_NAVIGATION_IDS]);
  });
});
