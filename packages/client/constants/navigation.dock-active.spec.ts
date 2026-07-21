import { APP_ROUTES } from "@bao/shared/constants/routes";
import { describe, expect, it } from "vitest";
import { getDockNavigationItems, isDockRouteActive, NAVIGATION_ITEMS } from "./navigation";

const getNavigationItem = (id: string) => {
  const navigationItem = NAVIGATION_ITEMS.find((item) => item.id === id);
  expect(navigationItem).toBeDefined();
  if (!navigationItem) {
    throw new Error(`Expected navigation item ${id}`);
  }
  return navigationItem;
};

describe("dock section wayfinding", () => {
  it("activates ai-chat for AI section prefixes", () => {
    const aiChat = getNavigationItem("ai-chat");
    expect(isDockRouteActive(APP_ROUTES.aiChat, aiChat)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.aiDashboard, aiChat)).toBe(true);
  });

  it("activates automation for nested run routes", () => {
    const automation = getNavigationItem("automation");
    expect(isDockRouteActive(APP_ROUTES.automation, automation)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationRuns, automation)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationJobApply, automation)).toBe(true);
  });

  it("keeps dock composition under Apple HIG cap with AI + Automation", () => {
    const ids = getDockNavigationItems().map((item) => item.id);
    expect(ids).toEqual(["dashboard", "jobs", "ai-chat", "automation", "settings"]);
  });
});
