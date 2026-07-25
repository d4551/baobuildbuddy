import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { collectBiomeSofteningViolationsForContent } from "./validate-biome-no-softenings";

/**
 * Hardened fixture (lint-harden cutover target). Live biome.json is still ratcheted
 * separately — these tests must not claim tip-of-main is zero-softener.
 */
const HARDENED_BIOME = readFileSync(
  new URL("./fixtures/biome-zero-softenings.fixture.json", import.meta.url),
  "utf8",
);

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

describe("collectBiomeSofteningViolationsForContent: hardened fixture", () => {
  test("fixture passes with zero violations", () => {
    expect(collectBiomeSofteningViolationsForContent(HARDENED_BIOME)).toHaveLength(0);
  });

  test("fixture contains zero info/warn/off softeners", () => {
    expect(HARDENED_BIOME.includes(': "info"')).toBe(false);
    expect(HARDENED_BIOME.includes(': "warn"')).toBe(false);
    expect(HARDENED_BIOME.includes('"level": "info"')).toBe(false);
    expect(HARDENED_BIOME.includes('"level": "warn"')).toBe(false);
    expect(HARDENED_BIOME.includes('"level": "off"')).toBe(false);
    expect((HARDENED_BIOME.match(/: "off"/g) ?? []).length).toBe(0);
  });

  test("fixture keeps multiword at error with Nuxt-reserved ignores", () => {
    expect(HARDENED_BIOME.includes('"useVueMultiWordComponentNames"')).toBe(true);
    expect(HARDENED_BIOME.includes('"index"')).toBe(true);
    expect(HARDENED_BIOME.includes('"[id]"')).toBe(true);
  });

  test("fixture enables html.experimentalFullSupportEnabled", () => {
    expect(HARDENED_BIOME.includes('"experimentalFullSupportEnabled": true')).toBe(true);
  });

  test("fixture omits Tailwind-incompatible class rules", () => {
    expect(HARDENED_BIOME.includes("noUndeclaredClasses")).toBe(false);
    expect(HARDENED_BIOME.includes("noUnusedClasses")).toBe(false);
  });

  test("fixture uses vue recommended domain (not all/vapor)", () => {
    expect(HARDENED_BIOME.includes("useVueVapor")).toBe(false);
    expect(HARDENED_BIOME.includes('"vue": "recommended"')).toBe(true);
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

  test("flags override rule off", () => {
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
});

describe("collectBiomeSofteningViolationsForContent: flags demotions on fixture", () => {
  test("flags noUnusedImports info demotion", () => {
    const sample = HARDENED_BIOME.replaceAll(
      '"noUnusedImports": "error"',
      '"noUnusedImports": "info"',
    );
    expect(
      collectBiomeSofteningViolationsForContent(sample).some((v) =>
        v.message.includes("noUnusedImports"),
      ),
    ).toBe(true);
  });

  test("flags noBarrelFile info demotion", () => {
    const sample = HARDENED_BIOME.replaceAll('"noBarrelFile": "error"', '"noBarrelFile": "info"');
    expect(
      collectBiomeSofteningViolationsForContent(sample).some((v) =>
        v.message.includes("noBarrelFile"),
      ),
    ).toBe(true);
  });

  test("flags maxLines ceiling raise", () => {
    const sample = HARDENED_BIOME.replaceAll('"maxLines": 60', '"maxLines": 120');
    expect(
      collectBiomeSofteningViolationsForContent(sample).some((v) => v.message.includes("maxLines")),
    ).toBe(true);
  });

  test("flags noMagicNumbers demotion", () => {
    const sample = HARDENED_BIOME.replaceAll(
      '"noMagicNumbers": "error"',
      '"noMagicNumbers": "off"',
    );
    expect(
      collectBiomeSofteningViolationsForContent(sample).some((v) =>
        v.message.includes("noMagicNumbers"),
      ),
    ).toBe(true);
  });

  test("flags noUndeclaredClasses demotion when added below error", () => {
    const sample = HARDENED_BIOME.replaceAll(
      '"noFloatingPromises": "error"',
      '"noFloatingPromises": "error", "noUndeclaredClasses": "off"',
    );
    expect(
      collectBiomeSofteningViolationsForContent(sample).some((v) =>
        v.message.includes("noUndeclaredClasses"),
      ),
    ).toBe(true);
  });
});
