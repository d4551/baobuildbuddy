import { APP_ROUTES } from "@bao/shared/constants/routes";
import { describe, expect, it } from "vitest";
import { normalizeRoutePath, resolveLongestMatchingSidebarNavItem } from "~/constants/navigation";

describe("navbar section crumbs (peer IA)", () => {
  it("resolves settings as a peer section without requiring dashboard parent", () => {
    const section = resolveLongestMatchingSidebarNavItem(APP_ROUTES.settings);
    expect(section?.id).toBe("settings");
    expect(normalizeRoutePath(section?.to ?? "")).toBe(APP_ROUTES.settings);
  });

  it("resolves automation as a peer work section", () => {
    const section = resolveLongestMatchingSidebarNavItem(APP_ROUTES.automation);
    expect(section?.id).toBe("automation");
  });
});
