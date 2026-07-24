import { describe, expect, it } from "bun:test";
import { collectKeyboardNavParityViolations } from "./validate-keyboard-nav-parity";

describe("validate-keyboard-nav-parity", () => {
  it("flags sidebar item without shortcut", () => {
    const violations = collectKeyboardNavParityViolations({
      navigationSource: `
export const NAVIGATION_ITEMS = [
  {
    id: "jobs",
    labelKey: "nav.jobs",
    iconPath: "x",
    to: "/jobs",
    includeInSidebar: true,
    includeInDock: true,
  },
];`,
      shortcutSource: `export const KEYBOARD_ROUTE_SHORTCUTS = [
  { id: "dashboard", prefix: "g", key: "d", to: "/" },
] as const;`,
    });
    expect(violations.some((v) => v.message.includes('"jobs"'))).toBe(true);
  });

  it("allows keyboardOptional sidebar items", () => {
    const violations = collectKeyboardNavParityViolations({
      navigationSource: `
export const NAVIGATION_ITEMS = [
  {
    id: "ai-dashboard",
    labelKey: "nav.aiDashboard",
    iconPath: "x",
    to: "/ai/dashboard",
    includeInSidebar: true,
    includeInDock: false,
    keyboardOptional: true,
  },
];`,
      shortcutSource: `export const KEYBOARD_ROUTE_SHORTCUTS = [] as const;`,
    });
    expect(violations).toEqual([]);
  });

  it("passes when shortcut covers sidebar id", () => {
    const violations = collectKeyboardNavParityViolations({
      navigationSource: `
export const NAVIGATION_ITEMS = [
  {
    id: "jobs",
    labelKey: "nav.jobs",
    iconPath: "x",
    to: "/jobs",
    includeInSidebar: true,
    includeInDock: true,
  },
];`,
      shortcutSource: `export const KEYBOARD_ROUTE_SHORTCUTS = [
  { id: "jobs", prefix: "g", key: "j", to: "/jobs" },
] as const;`,
    });
    expect(violations).toEqual([]);
  });
});
