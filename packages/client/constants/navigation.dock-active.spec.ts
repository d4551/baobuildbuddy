import { describe, expect, it } from "vitest";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import {
  DOCK_NAVIGATION_IDS,
  getDockNavigationItems,
  isDockRouteActive,
  NAVIGATION_ITEMS,
} from "./navigation";

describe("dock section wayfinding", () => {
  it("activates ai-chat for AI section prefixes", () => {
    const aiChat = NAVIGATION_ITEMS.find((item) => item.id === "ai-chat");
    expect(aiChat).toBeTruthy();
    expect(isDockRouteActive(APP_ROUTES.aiChat, aiChat!)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.aiDashboard, aiChat!)).toBe(true);
  });

  it("still resolves automation routes for sidebar Work group (not dock)", () => {
    const automation = NAVIGATION_ITEMS.find((item) => item.id === "automation");
    expect(automation).toBeTruthy();
    expect(automation?.includeInDock).toBe(false);
    expect(isDockRouteActive(APP_ROUTES.automation, automation!)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationRuns, automation!)).toBe(true);
  });

  it("keeps dock composition as Home/Work/Create/AI/System", () => {
    const ids = getDockNavigationItems().map((item) => item.id);
    expect(ids).toEqual([...DOCK_NAVIGATION_IDS]);
  });
});
