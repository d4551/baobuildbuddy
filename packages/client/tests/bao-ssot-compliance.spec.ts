/**
 * .bao SSOT UI/UX Compliance Test Suite
 *
 * Scans ALL Vue source files for violations of the canonical design system.
 * Authority: .bao glassmorphic material system in packages/client/assets/css/main.css
 * SSOT Tokens: packages/client/constants/layout.ts + ui-layout.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLIENT_ROOT, COMPONENTS_DIR, LAYOUTS_DIR, PAGES_DIR } from "./bao-ssot-helpers";
import { collectSourceFiles, scanFile } from "./bao-ssot-scanner";

// Helper: run scanner and build a results list
function scanDir(dir: string) {
  const files = collectSourceFiles(dir).filter((f) => f.endsWith(".vue"));
  return files
    .map((abs) => ({
      file: abs.replace(CLIENT_ROOT, "").replace(/^\//, ""),
      violations: scanFile(abs),
    }))
    .filter((r) => r.violations.length > 0);
}

function formatMessages(
  violations: { category: string; rule: string; evidence: string; fix: string }[],
) {
  return violations
    .map((v) => `  [${v.category}] ${v.rule}\n    at: ${v.evidence}\n    fix: ${v.fix}`)
    .join("\n");
}

describe(".bao SSOT UI/UX compliance — Pages", () => {
  const results = scanDir(PAGES_DIR);
  for (const r of results) {
    it(`${r.file} has zero .bao SSOT violations`, () => {
      expect(
        r.violations,
        `${r.file} has ${r.violations.length} violation(s):\n${formatMessages(r.violations)}`,
      ).toHaveLength(0);
    });
  }
  if (results.length === 0)
    it("all pages pass .bao SSOT compliance", () => expect(true).toBe(true));
});

describe(".bao SSOT UI/UX compliance — Components", () => {
  const results = scanDir(COMPONENTS_DIR);
  for (const r of results) {
    it(`${r.file} has zero .bao SSOT violations`, () => {
      expect(
        r.violations,
        `${r.file} has ${r.violations.length} violation(s):\n${formatMessages(r.violations)}`,
      ).toHaveLength(0);
    });
  }
  if (results.length === 0)
    it("all components pass .bao SSOT compliance", () => expect(true).toBe(true));
});

describe(".bao SSOT UI/UX compliance — Layouts", () => {
  const results = scanDir(LAYOUTS_DIR);
  for (const r of results) {
    it(`${r.file} has zero .bao SSOT violations`, () => {
      expect(
        r.violations,
        `${r.file} has ${r.violations.length} violation(s):\n${formatMessages(r.violations)}`,
      ).toHaveLength(0);
    });
  }
  if (results.length === 0)
    it("all layouts pass .bao SSOT compliance", () => expect(true).toBe(true));
});

describe(".bao SSOT UI/UX compliance — Glass surface consistency", () => {
  it("SURFACE_GLASS_CARD_CLASS is the canonical card surface and matches CSS", async () => {
    const { SURFACE_GLASS_CARD_CLASS } = await import("../constants/layout");
    expect(SURFACE_GLASS_CARD_CLASS).toBe("card card-border card-glass glass-interactive");
    const mainCSS = readFileSync(join(CLIENT_ROOT, "assets/css/main.css"), "utf8");
    expect(mainCSS).toContain(".card.card-glass");
    expect(mainCSS).toContain(".glass-interactive");
  });

  it("no page uses 'bg-base-100' directly on a card element (must use SSOT)", () => {
    const pageFiles = collectSourceFiles(PAGES_DIR).filter((f) => f.endsWith(".vue"));
    const violations: string[] = [];
    for (const abs of pageFiles) {
      const content = readFileSync(abs, "utf8");
      const rel = abs.replace(CLIENT_ROOT, "").replace(/^\//, "");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\bbg-base-100\b/.test(line) && /\bcard\b/.test(line)) {
          if (
            line.includes("SURFACE_GLASS") ||
            line.includes("glass") ||
            line.includes("// ssot-card")
          )
            continue;
          violations.push(`${rel}:${i + 1} → ${line.trim()}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("SURFACE_GLASS_CARD_SELECTED_CLASS is available", async () => {
    const { SURFACE_GLASS_CARD_SELECTED_CLASS } = await import("../constants/layout");
    expect(SURFACE_GLASS_CARD_SELECTED_CLASS).toBe("glass-selected");
    const mainCSS = readFileSync(join(CLIENT_ROOT, "assets/css/main.css"), "utf8");
    expect(mainCSS).toContain(".glass-selected");
  });

  it("SURFACE_GLASS_CARD_DISABLED_CLASS is available", async () => {
    const { SURFACE_GLASS_CARD_DISABLED_CLASS } = await import("../constants/layout");
    expect(SURFACE_GLASS_CARD_DISABLED_CLASS).toBe("glass-disabled");
    const mainCSS = readFileSync(join(CLIENT_ROOT, "assets/css/main.css"), "utf8");
    expect(mainCSS).toContain(".glass-disabled");
  });

  it("SURFACE_GLASS_CARD_ERROR_CLASS is available", async () => {
    const { SURFACE_GLASS_CARD_ERROR_CLASS } = await import("../constants/layout");
    expect(SURFACE_GLASS_CARD_ERROR_CLASS).toBe("glass-error");
    const mainCSS = readFileSync(join(CLIENT_ROOT, "assets/css/main.css"), "utf8");
    expect(mainCSS).toContain(".glass-error");
  });
});

describe(".bao SSOT UI/UX compliance — Icon registry", () => {
  it("icon-registry exports all expected icon names", async () => {
    const { APP_ICON_COMPONENTS, resolveAppIconComponent } = await import(
      "../components/icons/icon-registry"
    );
    const expectedIcons = [
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
    for (const name of expectedIcons) {
      expect(APP_ICON_COMPONENTS[name]).toBeDefined();
      expect(resolveAppIconComponent(name as any)).toBeDefined();
    }
  });

  it("every icon in the registry has a corresponding .vue file", async () => {
    const { existsSync } = require("node:fs") as typeof import("node:fs");
    const { APP_ICON_COMPONENTS } = await import("../components/icons/icon-registry");
    const iconsDir = join(CLIENT_ROOT, "components/icons");
    for (const [name] of Object.entries(APP_ICON_COMPONENTS)) {
      expect(existsSync(join(iconsDir, `${name}.vue`)), `Missing icon component: ${name}.vue`).toBe(
        true,
      );
    }
  });
});

describe(".bao SSOT UI/UX compliance — Token coverage", () => {
  it("all layout token categories are exported", async () => {
    const layout = await import("../constants/layout");
    expect(layout.SURFACE_GLASS_CARD_CLASS).toBeDefined();
    expect(layout.SURFACE_GLASS_CARD_STRONG_CLASS).toBeDefined();
    expect(layout.SURFACE_GLASS_CARD_MODAL_CLASS).toBeDefined();
    expect(layout.SURFACE_GLASS_CLEAR_CLASS).toBeDefined();
    expect(layout.SURFACE_GLASS_SOLID_CLASS).toBeDefined();
    expect(layout.SURFACE_GLASS_CARD_SELECTED_CLASS).toBeDefined();
    expect(layout.SURFACE_GLASS_CARD_DISABLED_CLASS).toBeDefined();
    expect(layout.SURFACE_GLASS_CARD_ERROR_CLASS).toBeDefined();
    expect(layout.SHELL_MAIN_INNER_CLASS).toBeDefined();
    expect(layout.TYPOGRAPHY_SCALE_CLASS).toBeDefined();
    expect(layout.ICON_SIZE_CLASS).toBeDefined();
    expect(layout.SHADOW_TOKEN_CLASS).toBeDefined();
    expect(layout.RADIUS_TOKEN_CLASS).toBeDefined();
  });

  it("all grid tokens are exported from ui-layout.ts", async () => {
    const uiLayout = await import("../constants/ui-layout");
    expect(uiLayout.UI_GRID_CLASS_BY_TOKEN).toBeDefined();
    expect(uiLayout.UI_GRID_CLASS_BY_TOKEN.single).toBeDefined();
    expect(uiLayout.UI_GRID_CLASS_BY_TOKEN.twoColumn).toBeDefined();
    expect(uiLayout.UI_GRID_CLASS_BY_TOKEN.threeColumn).toBeDefined();
    expect(uiLayout.UI_GRID_CLASS_BY_TOKEN.chatSplit).toBeDefined();
    expect(uiLayout.UI_GRID_CLASS_BY_TOKEN.providersSplit).toBeDefined();
  });

  it("glass CSS tokens exist in main.css for all material levels", () => {
    const mainCSS = readFileSync(join(CLIENT_ROOT, "assets/css/main.css"), "utf8");
    const glassTokens = ["--glass-bg-clear", "--glass-bg-strong", "--glass-blur-standard", "--glass-shadow-low", "--glass-shadow-medium"];
    for (const token of glassTokens) {
      expect(mainCSS).toContain(token);
    }
    const glassClasses = [".glass", ".glass-subtle", ".glass-strong", ".glass-modal", ".glass-clear", ".glass-solid", ".glass-interactive", ".glass-selected", ".glass-disabled", ".glass-error"];
    for (const cls of glassClasses) {
      expect(mainCSS).toContain(cls);
    }
    const a11yVars = ["--brand-font-display", "--brand-font-body", "--brand-font-mono", "prefers-reduced-transparency", "prefers-contrast", "forced-colors", "prefers-reduced-motion"];
    for (const v of a11yVars) {
      "--brand-font-body",
      "--brand-font-mono",
      "prefers-reduced-transparency",
      "prefers-contrast",
      "forced-colors",
      "prefers-reduced-motion",
    ]) {
      expect(mainCSS).toContain(v);
    }
  });
});
