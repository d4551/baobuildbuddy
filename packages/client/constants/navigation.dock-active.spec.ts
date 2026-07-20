import { describe, expect, it } from "vitest";
import { APP_ROUTES } from "@bao/shared/constants/routes";
import {
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

  it("activates automation for nested run routes", () => {
    const automation = NAVIGATION_ITEMS.find((item) => item.id === "automation");
    expect(automation).toBeTruthy();
    expect(isDockRouteActive(APP_ROUTES.automation, automation!)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationRuns, automation!)).toBe(true);
    expect(isDockRouteActive(APP_ROUTES.automationJobApply, automation!)).toBe(true);
  });

  it("keeps dock composition under Apple HIG cap with AI + Automation", () => {
    const ids = getDockNavigationItems().map((item) => item.id);
    expect(ids).toEqual(["dashboard", "jobs", "ai-chat", "automation", "settings"]);
  });
});
