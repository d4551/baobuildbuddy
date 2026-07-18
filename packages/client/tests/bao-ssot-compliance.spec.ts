/**
 * .bao SSOT UI/UX Compliance Test Suite
 *
 * Authority: .bao glassmorphic material system in packages/client/assets/css/main.css
 * SSOT Tokens: packages/client/constants/layout.ts + layout-tokens.ts + ui-layout.ts
 *
 * These tests verify the SSOT infrastructure exists and is correct.
 * Violation scanning is done by the validate:* scripts in the lint pipeline,
 * not by runtime tests (Vue SFCs require Vite plugin config for import).
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CLIENT_ROOT = join(import.meta.dirname, "..");

// ── Glass surface consistency ────────────────────────────────────────

describe(".bao SSOT — Glass surface tokens", () => {
  it("SURFACE_GLASS_CARD_CLASS value matches CSS class chain", () => {
    const content = readFileSync(join(CLIENT_ROOT, "constants/layout.ts"), "utf8");
    expect(content).toContain(
      'SURFACE_GLASS_CARD_CLASS = "card card-border card-glass glass-interactive"',
    );
  });

  it("all SURFACE_GLASS_* variants are declared in layout.ts", () => {
    const content = readFileSync(join(CLIENT_ROOT, "constants/layout.ts"), "utf8");
    const variants = [
      "SURFACE_GLASS_CARD_CLASS",
      "SURFACE_GLASS_CARD_STRONG_CLASS",
      "SURFACE_GLASS_CARD_MODAL_CLASS",
      "SURFACE_GLASS_CLEAR_CLASS",
      "SURFACE_GLASS_SOLID_CLASS",
      "SURFACE_GLASS_CARD_SELECTED_CLASS",
      "SURFACE_GLASS_CARD_DISABLED_CLASS",
      "SURFACE_GLASS_CARD_ERROR_CLASS",
    ];
    for (const v of variants) {
      expect(content, `Missing: ${v}`).toContain(v);
    }
  });

  it("CSS defines glass tokens and utility classes", () => {
    const css = readFileSync(join(CLIENT_ROOT, "assets/css/main.css"), "utf8");
    const tokens = [
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
    ];
    const classes = [
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
    ];
    for (const t of tokens) expect(css).toContain(t);
    for (const c of classes) expect(css).toContain(c);
  });

  it("CSS defines brand fonts and a11y features", () => {
    const css = readFileSync(join(CLIENT_ROOT, "assets/css/main.css"), "utf8");
    expect(css).toContain("--brand-font-display");
    expect(css).toContain("--brand-font-body");
    expect(css).toContain("--brand-font-mono");
    expect(css).toContain("prefers-reduced-transparency");
    expect(css).toContain("prefers-contrast");
    expect(css).toContain("forced-colors");
    expect(css).toContain("prefers-reduced-motion");
  });
});

// ── Token coverage ────────────────────────────────────────────────────

describe(".bao SSOT — Layout token declarations", () => {
  it("layout.ts declares shell and page tokens", () => {
    const content = readFileSync(join(CLIENT_ROOT, "constants/layout.ts"), "utf8");
    const tokens = [
      "SHELL_MAIN_INNER_CLASS",
      "SHELL_DRAWER_CLASS",
      "SHELL_NAVBAR_CLASS",
      "AUTH_SHELL_OUTER_CLASS",
      "AUTH_CARD_SHELL_CLASS",
      "PAGE_HEADER_OUTER_CLASS",
      "PAGE_HEADER_TITLE_CLASS",
      "PAGE_HERO_SECTION_CLASS",
      "EMPTY_STATE_STACK_CLASS",
      "SIDEBAR_WIDTH_LG_CLASS",
    ];
    for (const t of tokens) expect(content, `Missing: ${t}`).toContain(t);
  });

  it("layout-tokens.ts declares spacing/typography tokens", () => {
    const content = readFileSync(join(CLIENT_ROOT, "constants/layout-tokens.ts"), "utf8");
    expect(content).toContain("STACK_SPACE_Y_TOKEN_CLASS");
    expect(content).toContain("FLEX_GAP_TOKEN_CLASS");
    expect(content).toContain("MARGIN_TOKEN_CLASS");
    expect(content).toContain("PADDING_TOKEN_CLASS");
    expect(content).toContain("TYPOGRAPHY_SCALE_CLASS");
  });

  it("ui-layout.ts declares grid tokens", () => {
    const content = readFileSync(join(CLIENT_ROOT, "constants/ui-layout.ts"), "utf8");
    const grids = [
      "single",
      "twoColumn",
      "threeColumn",
      "sidebar",
      "bento",
      "chatSplit",
      "providersSplit",
    ];
    for (const g of grids) {
      expect(content, `Missing grid: ${g}`).toContain(g);
    }
  });

  it("ICON_SIZE_CLASS has canonical icon sizes", () => {
    const content = readFileSync(join(CLIENT_ROOT, "constants/layout.ts"), "utf8");
    expect(content).toContain('xs: "h-3 w-3"');
    expect(content).toContain('sm: "h-5 w-5"');
    expect(content).toContain('md: "h-6 w-6"');
    expect(content).toContain('lg: "h-8 w-8"');
  });

  it("ICON_DECORATIVE_STROKE_WIDTH is defined", () => {
    const content = readFileSync(join(CLIENT_ROOT, "constants/layout.ts"), "utf8");
    expect(content).toContain("ICON_DECORATIVE_STROKE_WIDTH = 2");
  });

  it("min-height/width dimension tokens exist", () => {
    const content = readFileSync(join(CLIENT_ROOT, "constants/layout.ts"), "utf8");
    const tokens = [
      "MIN_HEIGHT_ZERO_CLASS",
      "MIN_HEIGHT_SCROLL_CLASS",
      "MIN_HEIGHT_EDITOR_CLASS",
      "MIN_HEIGHT_CHAT_CLASS",
      "MIN_HEIGHT_CONTENT_CLASS",
      "MIN_HEIGHT_DESCRIPTION_CLASS",
      "HEIGHT_48_CLASS",
      "HEIGHT_96_CLASS",
      "MIN_WIDTH_FORM_COL_CLASS",
      "MIN_WIDTH_SELECT_CLASS",
      "SIDEBAR_WIDE_WIDTH_CLASS",
    ];
    for (const t of tokens) expect(content, `Missing: ${t}`).toContain(t);
  });
});

// ── Icon registry ─────────────────────────────────────────────────────
// We verify via filesystem since importing Vue SFCs in vitest needs plugin config.

describe(".bao SSOT — Icon registry filesystem integrity", () => {
  it("icon-registry.ts exports expected icons", () => {
    const content = readFileSync(join(CLIENT_ROOT, "components/icons/icon-registry.ts"), "utf8");
    const icons = [
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
    ];
    for (const i of icons) expect(content).toContain(i);
  });

  it("all registered icon names have .vue files", () => {
    const dir = join(CLIENT_ROOT, "components/icons");
    const files = [
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
    ];
    for (const f of files) {
      expect(existsSync(join(dir, f)), `Missing: ${f}`).toBe(true);
    }
  });
});

// ── daisyUI contract validator recognized SSOT surface constants ──────

describe(".bao SSOT — Validator recognizes surface constants", () => {
  it("daisyui-contracts validator recognizes SURFACE_GLASS_CARD_CLASS", () => {
    const validator = readFileSync(
      join(CLIENT_ROOT, "../../scripts/validate-daisyui-contracts.ts"),
      "utf8",
    );
    expect(validator).toContain("SSOT_SURFACE_CONSTANTS_WITH_CARD");
    expect(validator).toContain("SURFACE_GLASS_CARD_CLASS");
    expect(validator).toContain("SSOT_SURFACE_CONSTANT_USAGE_PATTERN");
  });

  it("no-raw-design-tokens validator has expanded SSOT allowlist", () => {
    const validator = readFileSync(
      join(CLIENT_ROOT, "../../scripts/validate-no-raw-design-tokens.ts"),
      "utf8",
    );
    expect(validator).toContain("layout-tokens.ts");
    expect(validator).toContain("chat.ts");
  });
});
