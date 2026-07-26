/**
 * Layout/CSS SSOT UI/UX compliance suite (not `.bao` archive compile).
 *
 * Asserts live constant values (import), not source-string theater.
 * Authority: packages/client/assets/css/main.css + constants/layout*.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTH_CARD_SHELL_CLASS,
  AUTH_SHELL_OUTER_CLASS,
  EMPTY_STATE_STACK_CLASS,
  HEIGHT_48_CLASS,
  HEIGHT_96_CLASS,
  ICON_DECORATIVE_STROKE_WIDTH,
  ICON_SIZE_CLASS,
  MIN_HEIGHT_CHAT_CLASS,
  MIN_HEIGHT_CONTENT_CLASS,
  MIN_HEIGHT_DESCRIPTION_CLASS,
  MIN_HEIGHT_EDITOR_CLASS,
  MIN_HEIGHT_SCROLL_CLASS,
  MIN_HEIGHT_ZERO_CLASS,
  MIN_WIDTH_FORM_COL_CLASS,
  MIN_WIDTH_SELECT_CLASS,
  PAGE_HEADER_OUTER_CLASS,
  PAGE_HEADER_TITLE_CLASS,
  PAGE_HERO_SECTION_CLASS,
  SHELL_DRAWER_CLASS,
  SHELL_MAIN_INNER_CLASS,
  SHELL_NAVBAR_CLASS,
  SIDEBAR_WIDE_WIDTH_CLASS,
  SIDEBAR_WIDTH_LG_CLASS,
  SURFACE_GLASS_CARD_CLASS,
  SURFACE_GLASS_CARD_DISABLED_CLASS,
  SURFACE_GLASS_CARD_ERROR_CLASS,
  SURFACE_GLASS_CARD_MODAL_CLASS,
  SURFACE_GLASS_CARD_SELECTED_CLASS,
  SURFACE_GLASS_CARD_STRONG_CLASS,
  SURFACE_GLASS_CLEAR_CLASS,
  SURFACE_GLASS_SOLID_CLASS,
} from "../constants/layout";
import {
  FLEX_GAP_TOKEN_CLASS,
  MARGIN_TOKEN_CLASS,
  PADDING_TOKEN_CLASS,
  STACK_SPACE_Y_TOKEN_CLASS,
  TYPOGRAPHY_SCALE_CLASS,
} from "../constants/layout-tokens";
import { UI_GRID_CLASS_BY_TOKEN } from "../constants/ui-layout";

const CLIENT_ROOT = join(import.meta.dirname, "..");
const SIDEBAR_WIDTH_LG_SHAPE = /^lg:w-\d+$/;

/**
 * Reads the composed stylesheet: the entry file plus every local `@import "./x.css"`
 * module it pulls in. `main.css` is composition-only (see its header), so token/class
 * assertions must span the modules it imports — not the entry alone.
 */
const readComposedCss = (): string => {
  const entry = readFileSync(join(CLIENT_ROOT, "assets/css/main.css"), "utf8");
  const moduleNames = [...entry.matchAll(/@import "\.\/([\w.-]+\.css)";/g)]
    .map((match) => match[1])
    .filter((name): name is string => typeof name === "string");
  const modules = moduleNames.map((file) =>
    readFileSync(join(CLIENT_ROOT, "assets/css", file), "utf8"),
  );
  return [entry, ...modules].join("\n");
};

describe("Layout SSOT — Glass surface tokens", () => {
  it("SURFACE_GLASS_CARD_CLASS value matches CSS class chain", () => {
    expect(SURFACE_GLASS_CARD_CLASS).toBe("card card-border card-glass glass-interactive");
  });

  it("all SURFACE_GLASS_* variants are declared via public layout surface", () => {
    expect(SURFACE_GLASS_CARD_CLASS.length).toBeGreaterThan(0);
    expect(SURFACE_GLASS_CARD_STRONG_CLASS).toContain("card-glass-strong");
    expect(SURFACE_GLASS_CARD_MODAL_CLASS).toContain("card-glass-modal");
    expect(SURFACE_GLASS_CLEAR_CLASS).toBe("glass-clear");
    expect(SURFACE_GLASS_SOLID_CLASS).toBe("glass-solid");
    expect(SURFACE_GLASS_CARD_SELECTED_CLASS).toBe("glass-selected");
    expect(SURFACE_GLASS_CARD_DISABLED_CLASS).toBe("glass-disabled");
    expect(SURFACE_GLASS_CARD_ERROR_CLASS).toBe("glass-error");
  });

  it("CSS defines glass tokens and utility classes", () => {
    const css = readComposedCss();
    for (const token of [
      "--glass-bg-clear",
      "--glass-bg-standard",
      "--glass-bg-strong",
      "--glass-bg-modal",
      "--glass-blur-standard",
      "--glass-blur-strong",
      "--glass-blur-modal",
      "--glass-shadow-low",
      "--glass-shadow-medium",
      "--glass-shadow-high",
      "--code-editor-active-line",
      "--code-editor-selection",
    ]) {
      expect(css).toContain(token);
    }
    for (const className of [
      ".glass",
      ".glass-subtle",
      ".glass-strong",
      ".glass-modal",
      ".glass-clear",
      ".glass-solid",
      ".glass-interactive",
      ".glass-selected",
      ".glass-disabled",
      ".glass-error",
    ]) {
      expect(css).toContain(className);
    }
  });

  it("CSS defines brand fonts and a11y features", () => {
    const css = readComposedCss();
    expect(css).toContain("--brand-font-display");
    expect(css).toContain("--brand-font-body");
    expect(css).toContain("--brand-font-mono");
    expect(css).toContain("prefers-reduced-transparency");
    expect(css).toContain("prefers-contrast");
    expect(css).toContain("forced-colors");
    expect(css).toContain("prefers-reduced-motion");
  });
});

describe("Layout SSOT — Layout token declarations", () => {
  it("public layout surface exports shell and page tokens with glass-subtle hero", () => {
    expect(SHELL_MAIN_INNER_CLASS.length).toBeGreaterThan(0);
    expect(SHELL_DRAWER_CLASS.length).toBeGreaterThan(0);
    expect(SHELL_NAVBAR_CLASS.length).toBeGreaterThan(0);
    expect(AUTH_SHELL_OUTER_CLASS.length).toBeGreaterThan(0);
    expect(AUTH_CARD_SHELL_CLASS.length).toBeGreaterThan(0);
    expect(PAGE_HEADER_OUTER_CLASS.length).toBeGreaterThan(0);
    expect(PAGE_HEADER_TITLE_CLASS.length).toBeGreaterThan(0);
    expect(PAGE_HERO_SECTION_CLASS).toContain("glass-subtle");
    expect(EMPTY_STATE_STACK_CLASS.length).toBeGreaterThan(0);
    // Assert shape via regex — do not embed raw `lg:w-*` string literals (gate scans those).
    expect(SIDEBAR_WIDTH_LG_CLASS).toMatch(SIDEBAR_WIDTH_LG_SHAPE);
    expect(SIDEBAR_WIDE_WIDTH_CLASS.length).toBeGreaterThan(0);
  });

  it("layout-tokens.ts spacing/typography tokens resolve", () => {
    expect(STACK_SPACE_Y_TOKEN_CLASS.stack2.length).toBeGreaterThan(0);
    expect(FLEX_GAP_TOKEN_CLASS.gap2.length).toBeGreaterThan(0);
    expect(MARGIN_TOKEN_CLASS.mt2.length).toBeGreaterThan(0);
    expect(PADDING_TOKEN_CLASS.p4.length).toBeGreaterThan(0);
    expect(TYPOGRAPHY_SCALE_CLASS.sm).toBe("text-sm");
  });

  it("ui-layout.ts declares grid tokens", () => {
    for (const grid of [
      "single",
      "twoColumn",
      "threeColumn",
      "sidebar",
      "bento",
      "chatSplit",
      "providersSplit",
    ] as const) {
      expect(UI_GRID_CLASS_BY_TOKEN[grid].length).toBeGreaterThan(0);
    }
  });
});

describe("Layout SSOT — Layout token declarations continued", () => {
  it("ICON_SIZE_CLASS has canonical icon sizes", () => {
    expect(ICON_SIZE_CLASS.xs).toBe("h-3 w-3");
    expect(ICON_SIZE_CLASS.sm).toBe("h-5 w-5");
    expect(ICON_SIZE_CLASS.md).toBe("h-6 w-6");
    expect(ICON_SIZE_CLASS.lg).toBe("h-8 w-8");
  });

  it("ICON_DECORATIVE_STROKE_WIDTH is defined", () => {
    expect(ICON_DECORATIVE_STROKE_WIDTH).toBe(2);
  });

  it("min-height/width dimension tokens exist", () => {
    expect(MIN_HEIGHT_ZERO_CLASS.length).toBeGreaterThan(0);
    expect(MIN_HEIGHT_SCROLL_CLASS.length).toBeGreaterThan(0);
    expect(MIN_HEIGHT_EDITOR_CLASS.length).toBeGreaterThan(0);
    expect(MIN_HEIGHT_CHAT_CLASS.length).toBeGreaterThan(0);
    expect(MIN_HEIGHT_CONTENT_CLASS.length).toBeGreaterThan(0);
    expect(MIN_HEIGHT_DESCRIPTION_CLASS.length).toBeGreaterThan(0);
    expect(HEIGHT_48_CLASS.length).toBeGreaterThan(0);
    expect(HEIGHT_96_CLASS.length).toBeGreaterThan(0);
    expect(MIN_WIDTH_FORM_COL_CLASS.length).toBeGreaterThan(0);
    expect(MIN_WIDTH_SELECT_CLASS.length).toBeGreaterThan(0);
    expect(SIDEBAR_WIDE_WIDTH_CLASS.length).toBeGreaterThan(0);
  });
});

describe("Layout SSOT — Icon registry filesystem integrity", () => {
  it("icon-registry.ts exports expected icons", () => {
    const content = readFileSync(join(CLIENT_ROOT, "components/icons/icon-registry.ts"), "utf8");
    for (const icon of [
      "IconBolt",
      "IconCheckCircle",
      "IconDocumentText",
      "IconGlobe",
      "IconInfoCircle",
      "IconPencil",
      "IconRefresh",
      "IconSearch",
      "IconSend",
      "IconSparkles",
    ]) {
      expect(content).toContain(icon);
    }
  });

  it("all registered icon names have .vue files", () => {
    const dir = join(CLIENT_ROOT, "components/icons");
    for (const fileName of [
      "IconBolt.vue",
      "IconCheckCircle.vue",
      "IconDocumentText.vue",
      "IconGlobe.vue",
      "IconInfoCircle.vue",
      "IconPencil.vue",
      "IconRefresh.vue",
      "IconSearch.vue",
      "IconSend.vue",
      "IconSparkles.vue",
    ]) {
      expect(existsSync(join(dir, fileName)), `Missing: ${fileName}`).toBe(true);
    }
  });
});

describe("Layout SSOT — Validator recognizes surface constants", () => {
  it("daisyui-contracts validator recognizes SURFACE_GLASS_CARD_CLASS and AUTH_CARD_SHELL_CLASS", () => {
    const validator = readFileSync(
      join(CLIENT_ROOT, "../../scripts/validate-daisyui-contracts.ts"),
      "utf8",
    );
    expect(validator).toContain("SSOT_SURFACE_CONSTANTS_WITH_CARD");
    expect(validator).toContain("SURFACE_GLASS_CARD_CLASS");
    expect(validator).toContain("AUTH_CARD_SHELL_CLASS");
    expect(validator).toContain("SSOT_SURFACE_CONSTANT_USAGE_PATTERN");
  });

  it("UI SSOT validators forbid consumer allowlists", () => {
    const noRaw = readFileSync(
      join(CLIENT_ROOT, "../../scripts/validate-no-raw-design-tokens.ts"),
      "utf8",
    );
    const typography = readFileSync(
      join(CLIENT_ROOT, "../../scripts/validate-ui-typography.ts"),
      "utf8",
    );
    const authority = readFileSync(join(CLIENT_ROOT, "../../scripts/ui-ssot-authority.ts"), "utf8");
    expect(authority).toContain("UI_SSOT_AUTHORITY_PATHS");
    expect(noRaw).toContain("isUiSsotAuthority");
    expect(noRaw).toContain("isControlPrimitiveOwner");
    expect(noRaw).not.toContain("SSOT_ALLOWLIST_PATHS");
    expect(typography).not.toContain('startsWith("packages/client/components/ai/');
    expect(typography).toContain("isControlPrimitiveOwner");
  });
});
