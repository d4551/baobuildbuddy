import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { collectBiomeSofteningViolationsForContent } from "./validate-biome-no-softenings";

const VALID_BIOME = readFileSync(new URL("../biome.json", import.meta.url), "utf8");

const BASE_LINTER = {
  enabled: true,
  domains: {
    vue: "recommended",
    drizzle: "all",
    project: "recommended",
    test: "recommended",
    playwright: "all",
    types: "recommended",
    react: "none",
    qwik: "none",
    next: "none",
    solid: "none",
    svelte: "none",
  },
  rules: { preset: "recommended", a11y: "error", nursery: {} },
} as const;

describe("collectBiomeSofteningViolationsForContent: repo biome.json is fully hardened", () => {
  test("repo biome.json passes with zero violations", () => {
    const violations = collectBiomeSofteningViolationsForContent(VALID_BIOME);
    expect(violations).toHaveLength(0);
  });

  test("repo biome.json contains zero info/warn/off softeners", () => {
    expect(VALID_BIOME.includes(': "info"')).toBe(false);
    expect(VALID_BIOME.includes(': "warn"')).toBe(false);
    expect(VALID_BIOME.includes('"level": "info"')).toBe(false);
    expect(VALID_BIOME.includes('"level": "warn"')).toBe(false);
    expect(VALID_BIOME.includes('"level": "off"')).toBe(false);
    expect(VALID_BIOME.includes('"noMagicNumbers": "off"')).toBe(false);
    expect(VALID_BIOME.includes('"useVueMultiWordComponentNames": "off"')).toBe(false);
    const offMatches = VALID_BIOME.match(/: "off"/g) ?? [];
    expect(offMatches).toHaveLength(0);
  });

  test("repo biome.json keeps multiword at error with Nuxt-reserved ignores only", () => {
    expect(VALID_BIOME.includes('"useVueMultiWordComponentNames"')).toBe(true);
    expect(VALID_BIOME.includes('"ignores"')).toBe(true);
    expect(VALID_BIOME.includes('"index"')).toBe(true);
    expect(VALID_BIOME.includes('"default"')).toBe(true);
    expect(VALID_BIOME.includes('"error"')).toBe(true);
    expect(VALID_BIOME.includes('"[id]"')).toBe(true);
  });

  test("repo biome.json enables html.experimentalFullSupportEnabled", () => {
    expect(VALID_BIOME.includes('"experimentalFullSupportEnabled": true')).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags core config demotions", () => {
  test("flags root linter.enabled=false", () => {
    const violations = collectBiomeSofteningViolationsForContent(
      JSON.stringify({
        html: { experimentalFullSupportEnabled: true },
        linter: { ...BASE_LINTER, enabled: false },
        overrides: [],
      }),
    );
    expect(violations.some((v) => v.message.includes("linter.enabled=false"))).toBe(true);
  });

  test("flags missing html.experimentalFullSupportEnabled", () => {
    const violations = collectBiomeSofteningViolationsForContent(
      JSON.stringify({ linter: BASE_LINTER, overrides: [] }),
    );
    expect(violations.some((v) => v.message.includes("experimentalFullSupportEnabled"))).toBe(true);
  });

  test("flags html.experimentalFullSupportEnabled=false", () => {
    const violations = collectBiomeSofteningViolationsForContent(
      JSON.stringify({
        html: { experimentalFullSupportEnabled: false },
        linter: BASE_LINTER,
        overrides: [],
      }),
    );
    expect(violations.some((v) => v.message.includes("experimentalFullSupportEnabled"))).toBe(true);
  });

  test("flags override linter.enabled=false", () => {
    const violations = collectBiomeSofteningViolationsForContent(
      JSON.stringify({
        html: { experimentalFullSupportEnabled: true },
        linter: BASE_LINTER,
        overrides: [{ includes: ["**/*.vue"], linter: { enabled: false } }],
      }),
    );
    expect(violations.some((v) => v.message.includes("linter.enabled=false"))).toBe(true);
  });

  test("flags override rule off (anywhere, zero allowlist)", () => {
    const violations = collectBiomeSofteningViolationsForContent(
      JSON.stringify({
        html: { experimentalFullSupportEnabled: true },
        linter: BASE_LINTER,
        overrides: [
          {
            includes: ["**/packages/server/**/*.ts"],
            linter: { rules: { correctness: { noUnusedImports: "off" } } },
          },
        ],
      }),
    );
    expect(violations.some((v) => v.message.includes("noUnusedImports"))).toBe(true);
  });

  test("flags a11y group off", () => {
    const sample = VALID_BIOME.replaceAll('"a11y": {', '"a11y": "off", "_x": {');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("a11y") || v.message.includes("off"))).toBe(
      true,
    );
  });
});

describe("collectBiomeSofteningViolationsForContent: flags noUnusedImports demotions", () => {
  test("flags noUnusedImports info demotion (zero info allowlist)", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noUnusedImports": "error"',
      '"noUnusedImports": "info"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noUnusedImports"))).toBe(true);
  });

  test("flags noUnusedImports warn demotion", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noUnusedImports": "error"',
      '"noUnusedImports": "warn"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noUnusedImports"))).toBe(true);
  });

  test("flags noUnusedImports off demotion", () => {
    const sample = VALID_BIOME.replaceAll('"noUnusedImports": "error"', '"noUnusedImports": "off"');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noUnusedImports"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags vue and complexity demotions", () => {
  test("flags useVueMultiWordComponentNames info demotion (zero info allowlist)", () => {
    const sample = VALID_BIOME.replaceAll(
      '"useVueMultiWordComponentNames": {\n          "level": "error"',
      '"useVueMultiWordComponentNames": {\n          "level": "info"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("useVueMultiWordComponentNames"))).toBe(true);
  });

  test("flags noVueRefAsOperand info demotion (zero info allowlist)", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noVueRefAsOperand": "error"',
      '"noVueRefAsOperand": "info"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noVueRefAsOperand"))).toBe(true);
  });

  test("flags noBarrelFile info demotion", () => {
    const sample = VALID_BIOME.replaceAll('"noBarrelFile": "error"', '"noBarrelFile": "info"');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noBarrelFile"))).toBe(true);
  });

  test("flags complexity cognitive info demotion", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noExcessiveCognitiveComplexity": "error"',
      '"noExcessiveCognitiveComplexity": "info"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noExcessiveCognitiveComplexity"))).toBe(true);
  });

  test("flags maxLines ceiling raise", () => {
    const sample = VALID_BIOME.replaceAll('"maxLines": 60', '"maxLines": 120');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("maxLines"))).toBe(true);
  });

  test("flags noVoid demotion", () => {
    const sample = VALID_BIOME.replaceAll('"noVoid": "error"', '"noVoid": "info"');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noVoid"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags style rule demotions", () => {
  test("flags noMagicNumbers demotion (industry best practice)", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noMagicNumbers": "error"',
      '"noMagicNumbers": "off"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noMagicNumbers"))).toBe(true);
  });

  test("flags noShoutyConstants demotion", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noShoutyConstants": "error"',
      '"noShoutyConstants": "off"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noShoutyConstants"))).toBe(true);
  });

  test("flags noCommonJs demotion", () => {
    const sample = VALID_BIOME.replaceAll('"noCommonJs": "error"', '"noCommonJs": "off"');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noCommonJs"))).toBe(true);
  });

  test("flags useThrowOnlyError demotion", () => {
    const sample = VALID_BIOME.replaceAll(
      '"useThrowOnlyError": "error"',
      '"useThrowOnlyError": "off"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("useThrowOnlyError"))).toBe(true);
  });

  test("flags noEmptyBlockStatements demotion", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noEmptyBlockStatements": "error"',
      '"noEmptyBlockStatements": "off"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noEmptyBlockStatements"))).toBe(true);
  });

  test("flags noTemplateCurlyInString demotion", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noTemplateCurlyInString": "error"',
      '"noTemplateCurlyInString": "off"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noTemplateCurlyInString"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags class rule demotions", () => {
  test("flags noUndeclaredClasses demotion", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noFloatingPromises": "error"',
      '"noFloatingPromises": "error", "noUndeclaredClasses": "off"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noUndeclaredClasses"))).toBe(true);
  });

  test("flags noUnusedClasses demotion", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noFloatingPromises": "error"',
      '"noFloatingPromises": "error", "noUnusedClasses": "off"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noUnusedClasses"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: intentional repo omissions", () => {
  test("repo biome.json intentionally omits noUndeclaredClasses/noUnusedClasses (Tailwind incompatibility)", () => {
    expect(VALID_BIOME.includes("noUndeclaredClasses")).toBe(false);
    expect(VALID_BIOME.includes("noUnusedClasses")).toBe(false);
  });

  test("repo biome.json intentionally omits useVueVapor (Nuxt SSR incompatibility)", () => {
    expect(VALID_BIOME.includes("useVueVapor")).toBe(false);
    expect(VALID_BIOME.includes('"vue": "all"')).toBe(false);
    expect(VALID_BIOME.includes('"vue": "recommended"')).toBe(true);
  });
});
