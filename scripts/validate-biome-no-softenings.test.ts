import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { collectBiomeSofteningViolationsForContent } from "./validate-biome-no-softenings";

const VALID_BIOME = readFileSync(new URL("../biome.json", import.meta.url), "utf8");

describe("collectBiomeSofteningViolationsForContent: accepts the repo biome.json without softenings", () => {
  test("accepts the repo biome.json without softenings", () => {
    const violations = collectBiomeSofteningViolationsForContent(VALID_BIOME);
    expect(violations).toHaveLength(0);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags root linter.enabled=false", () => {
  test("flags root linter.enabled=false", () => {
    const violations = collectBiomeSofteningViolationsForContent(
      JSON.stringify({
        linter: {
          enabled: false,
          domains: {
            vue: "all",
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
        },
        overrides: [],
      }),
    );
    expect(violations.some((v) => v.message.includes("linter.enabled=false"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: allows vue tooling gap info (never off) in repo biome.json", () => {
  test("allows vue tooling gap info (never off) in repo biome.json", () => {
    const violations = collectBiomeSofteningViolationsForContent(VALID_BIOME);
    expect(violations).toHaveLength(0);
    expect(VALID_BIOME.includes('"noVueRefAsOperand": "info"')).toBe(true);
    expect(VALID_BIOME.includes('"noUnusedImports": "info"')).toBe(true);
    expect(VALID_BIOME.includes('"noUnusedImports": "off"')).toBe(false);
    expect(VALID_BIOME.includes(': "off"')).toBe(false);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags vue unused-import off as softener", () => {
  test("flags vue unused-import off as softener", () => {
    const sample = VALID_BIOME.replaceAll('"noUnusedImports": "info"', '"noUnusedImports": "off"');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noUnusedImports"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags server-path unused-import off (real softener)", () => {
  test("flags server-path unused-import off (real softener)", () => {
    const base = JSON.parse(VALID_BIOME) as {
      linter: unknown;
      overrides: unknown[];
      [key: string]: unknown;
    };
    const sample = JSON.stringify({
      ...base,
      overrides: [
        {
          includes: ["**/packages/server/**/*.ts"],
          linter: {
            rules: {
              correctness: {
                noUnusedImports: "off",
              },
            },
          },
        },
      ],
    });
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noUnusedImports"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags overrides that disable the linter for vue", () => {
  test("flags overrides that disable the linter for vue", () => {
    const violations = collectBiomeSofteningViolationsForContent(
      JSON.stringify({
        linter: {
          enabled: true,
          domains: {
            vue: "all",
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
        },
        overrides: [{ includes: ["**/*.vue"], linter: { enabled: false } }],
      }),
    );
    expect(violations.some((v) => v.message.includes("linter.enabled=false"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags noBarrelFile info demotion", () => {
  test("flags noBarrelFile info demotion as softener", () => {
    const sample = VALID_BIOME.replaceAll('"noBarrelFile": "error"', '"noBarrelFile": "info"');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noBarrelFile"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags complexity cognitive info demotion", () => {
  test("flags noExcessiveCognitiveComplexity info demotion as softener", () => {
    const sample = VALID_BIOME.replaceAll(
      '"noExcessiveCognitiveComplexity": "error"',
      '"noExcessiveCognitiveComplexity": "info"',
    );
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noExcessiveCognitiveComplexity"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags maxLines ceiling raise", () => {
  test("flags maxLines>60 as softener", () => {
    const sample = VALID_BIOME.replaceAll('"maxLines": 60', '"maxLines": 120');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("maxLines"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags noVoid demotion", () => {
  test("flags noVoid info demotion as softener", () => {
    const sample = VALID_BIOME.replaceAll('"noVoid": "error"', '"noVoid": "info"');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("noVoid"))).toBe(true);
  });
});

describe("collectBiomeSofteningViolationsForContent: flags a11y group off", () => {
  test("flags a11y off as softener", () => {
    const sample = VALID_BIOME.replaceAll('"a11y": "error"', '"a11y": "off"');
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(violations.some((v) => v.message.includes("a11y") || v.message.includes("off"))).toBe(
      true,
    );
  });
});
