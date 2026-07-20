import { describe, expect, it } from "vitest";
import {
  getDockNavigationItems,
  isDockRouteActive,
  NAVIGATION_ITEMS,
} from "./navigation";

describe("dock section wayfinding", () => {
  it("activates ai-chat for /ai/* prefixes", () => {
    const aiChat = NAVIGATION_ITEMS.find((item) => item.id === "ai-chat");
    expect(aiChat).toBeTruthy();
    expect(isDockRouteActive("/ai/chat", aiChat!)).toBe(true);
    expect(isDockRouteActive("/ai/dashboard", aiChat!)).toBe(true);
  });

  it("activates automation for nested run routes", () => {
    const automation = NAVIGATION_ITEMS.find((item) => item.id === "automation");
    expect(automation).toBeTruthy();
    expect(isDockRouteActive("/automation", automation!)).toBe(true);
    expect(isDockRouteActive("/automation/runs", automation!)).toBe(true);
    expect(isDockRouteActive("/automation/job-apply", automation!)).toBe(true);
  });

  it("keeps dock composition under Apple HIG cap with AI + Automation", () => {
    const ids = getDockNavigationItems().map((item) => item.id);
    expect(ids).toEqual(["dashboard", "jobs", "ai-chat", "automation", "settings"]);
  });
});
