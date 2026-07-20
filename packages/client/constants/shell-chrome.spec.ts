import { describe, expect, it } from "vitest";
import { CHAT_COMPOSER_STICKY_CLASS, FLOATING_CHAT_PANEL_SIZE_CLASS } from "./chat";
import {
  EMPTY_STATE_STACK_CLASS,
  SECTION_RAIL_LABEL_CLASS,
  SHELL_FLOATING_CHAT_STACK_CLASS,
  SHELL_MAIN_INNER_CLASS,
  SHELL_SIDEBAR_MENU_CLASS,
} from "./layout";

describe("shell chrome SSOT (dock/FAB/touch)", () => {
  it("reserves FAB end-inset and taller dock clearance on main rail", () => {
    expect(SHELL_MAIN_INNER_CLASS.includes("pe-16")).toBe(true);
    expect(SHELL_MAIN_INNER_CLASS.includes("pb-36")).toBe(true);
  });

  it("forbids menu-sm on sidebar (touch floor via item tokens)", () => {
    expect(SHELL_SIDEBAR_MENU_CLASS.includes("menu-sm")).toBe(false);
    expect(SHELL_SIDEBAR_MENU_CLASS.includes("menu")).toBe(true);
  });

  it("keeps floating chat stack viewport-bounded on small screens", () => {
    expect(SHELL_FLOATING_CHAT_STACK_CLASS.includes("inset-x-4")).toBe(true);
    expect(SHELL_FLOATING_CHAT_STACK_CLASS.includes("100vw")).toBe(true);
  });

  it("keeps floating panel width inside the stack (no max-w-md hang)", () => {
    expect(FLOATING_CHAT_PANEL_SIZE_CLASS.includes("max-w-full")).toBe(true);
    expect(/\bmax-w-md\b/u.test(FLOATING_CHAT_PANEL_SIZE_CLASS)).toBe(false);
  });

  it("sticks full-page chat composer above the mobile dock", () => {
    expect(CHAT_COMPOSER_STICKY_CLASS.includes("sticky")).toBe(true);
    expect(CHAT_COMPOSER_STICKY_CLASS.includes("bottom-20")).toBe(true);
  });

  it("keeps empty-state density compact so shell padding clears dock", () => {
    expect(EMPTY_STATE_STACK_CLASS.includes("pb-12")).toBe(true);
    expect(EMPTY_STATE_STACK_CLASS.includes("py-8")).toBe(true);
  });

  it("exposes truncated visible section-rail labels", () => {
    expect(SECTION_RAIL_LABEL_CLASS.includes("truncate")).toBe(true);
    expect(SECTION_RAIL_LABEL_CLASS.includes("max-w-20")).toBe(true);
  });
});
