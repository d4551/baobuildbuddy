import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { collectBiomeSofteningViolationsForContent } from "./validate-biome-no-softenings";

const VALID_BIOME = readFileSync(new URL("../biome.json", import.meta.url), "utf8");

describe("collectBiomeSofteningViolationsForContent", () => {
  test("accepts the repo biome.json without softenings", () => {
    const violations = collectBiomeSofteningViolationsForContent(VALID_BIOME);
    expect(violations).toHaveLength(0);
  });

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

  test("flags rule severity demoted to warn/off outside vue unused allowlist", () => {
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
          rules: {
            preset: "recommended",
            a11y: "error",
            suspicious: { noConsole: "warn" },
            nursery: {},
          },
        },
        overrides: [],
      }),
    );
    expect(violations.some((v) => v.message.includes("noConsole") && v.message.includes("warn"))).toBe(
      true,
    );
  });

  test("allows vue-only unused-import off override", () => {
    const base = JSON.parse(VALID_BIOME) as {
      linter: unknown;
      overrides: unknown[];
      [key: string]: unknown;
    };
    const sample = JSON.stringify({
      ...base,
      overrides: [
        {
          includes: ["**/*.vue"],
          linter: {
            rules: {
              correctness: {
                noUnusedImports: "off",
                noUnusedVariables: "off",
                noUnusedFunctionParameters: "off",
              },
            },
          },
        },
      ],
    });
    const violations = collectBiomeSofteningViolationsForContent(sample);
    expect(
      violations.some(
        (v) =>
          v.message.includes("noUnusedImports") ||
          v.message.includes("noUnusedVariables") ||
          v.message.includes("noUnusedFunctionParameters"),
      ),
    ).toBe(false);
  });

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
