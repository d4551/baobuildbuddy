import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { safeParseJson } from "../packages/shared/src/utils/json";
import {
  MAX_LINES_PER_FUNCTION_CEILING,
  validateGroupRatchets,
} from "./utils/biome-softener-ratchet";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

/**
 * Biome softener gate — zero-tolerance for severity demotions or disabled rules.
 *
 * Binding contract (no allowlist, no "tooling gap" excuse):
 * - "off" forbidden everywhere.
 * - "warn" forbidden everywhere.
 * - "info" forbidden everywhere. Use "error" or delete the rule.
 * - linter.enabled=false forbidden at root and in overrides.
 * - maxLines ceiling > 60 forbidden.
 * - html.experimentalFullSupportEnabled must be true (required for Vue/Svelte/Astro
 *   template binding tracking; without it noUnusedVariables produces false positives
 *   that historically justified "info" demotions — closing that escape hatch).
 *
 * Rules intentionally absent because the upstream tool cannot support them on this
 * stack are documented in scripts/docs/biome-tailwind-incompatibility.md and tracked
 * in validate-biome-no-softenings.test.ts. Adding them back at any severity below
 * "error" is a softener. Adding them at "error" without the upstream fix is a
 * false-positive generator and also rejected.
 */

const BIOME_CONFIG_PATH = "biome.json";
const MAX_LINES_PER_FUNCTION = MAX_LINES_PER_FUNCTION_CEILING;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const isRecord = (value: JsonValue): value is { [key: string]: JsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const pushViolation = (violations: ValidationViolation[], message: string): void => {
  violations.push({ filePath: BIOME_CONFIG_PATH, line: 1, message });
};

const inspectLevelObject = (
  value: { [key: string]: JsonValue },
  nextPath: string,
  violations: ValidationViolation[],
): void => {
  const level = value.level;
  if (level === "off" || level === "warn" || level === "info") {
    pushViolation(
      violations,
      `Softening forbidden at ${nextPath}.level=${JSON.stringify(level)}. Use "error"/"on". Zero info allowlist.`,
    );
  }
  if (
    keyOf(value) === "noExcessiveLinesPerFunction" &&
    isRecord(value.options) &&
    typeof value.options.maxLines === "number" &&
    value.options.maxLines > MAX_LINES_PER_FUNCTION
  ) {
    pushViolation(
      violations,
      `Ceiling exploit at ${nextPath}.options.maxLines=${String(value.options.maxLines)} (max ${String(MAX_LINES_PER_FUNCTION)}).`,
    );
  }
};

const keyOf = (value: { [key: string]: JsonValue }): string =>
  typeof value.rule === "string" ? value.rule : "";

const walkRuleEntry = (
  key: string,
  value: JsonValue,
  path: string,
  violations: ValidationViolation[],
): void => {
  const nextPath = `${path}.${key}`;
  if (key === "preset" || key === "recommended") {
    return;
  }
  if (value === "off" || value === "warn" || value === "info") {
    pushViolation(
      violations,
      `Softening forbidden at ${nextPath}=${JSON.stringify(value)}. Use "error". Zero info allowlist. Never off/warn/info.`,
    );
    return;
  }
  if (isRecord(value) && "level" in value) {
    if (typeof value.rule !== "string") {
      (value as { rule: string }).rule = key;
    }
    inspectLevelObject(value, nextPath, violations);
    return;
  }
  if (isRecord(value)) {
    walkRules(value, nextPath, violations);
  }
};

const walkRules = (rules: JsonValue, path: string, violations: ValidationViolation[]): void => {
  if (!isRecord(rules)) {
    return;
  }
  for (const [key, value] of Object.entries(rules)) {
    walkRuleEntry(key, value, path, violations);
  }
};

const validateDomains = (domains: JsonValue, violations: ValidationViolation[]): void => {
  if (!isRecord(domains)) {
    pushViolation(
      violations,
      "linter.domains must enable vue/drizzle/project/test/playwright/types.",
    );
    return;
  }
  const requiredDomains: Record<string, string> = {
    // recommended — not all: domains.vue=all enables useVueVapor (Nuxt SSR incompatible).
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
  };
  for (const [domain, expected] of Object.entries(requiredDomains)) {
    if (domains[domain] !== expected) {
      pushViolation(
        violations,
        `linter.domains.${domain} must be ${JSON.stringify(expected)} (got ${JSON.stringify(domains[domain])}).`,
      );
    }
  }
};

const validateHtmlSupport = (config: JsonValue, violations: ValidationViolation[]): void => {
  if (!isRecord(config) || !isRecord(config.html)) {
    pushViolation(
      violations,
      "html.experimentalFullSupportEnabled must be true (Vue/Svelte/Astro template binding tracking; closes info-demotion escape hatch).",
    );
    return;
  }
  if (config.html.experimentalFullSupportEnabled !== true) {
    pushViolation(
      violations,
      "html.experimentalFullSupportEnabled must be true (required to keep noUnusedVariables/noUnusedImports at error without false positives).",
    );
  }
};

const validateRulesRatchet = (
  rules: { [key: string]: JsonValue },
  violations: ValidationViolation[],
): void => {
  if (rules.preset !== "recommended") {
    pushViolation(
      violations,
      'linter.rules.preset must be "recommended" (stack-scoped; domains supply framework depth).',
    );
  }
  walkRules(rules, "linter.rules", violations);
  const requiredErrorGroups = ["a11y", "performance", "security", "suspicious"] as const;
  for (const group of requiredErrorGroups) {
    const value = rules[group];
    if (value !== "error" && !isRecord(value)) {
      pushViolation(
        violations,
        `linter.rules.${group} must be "error" or a rule object with error-level rules.`,
      );
    }
  }
  validateGroupRatchets(rules, violations, BIOME_CONFIG_PATH, (message) => {
    pushViolation(violations, message);
  });
};

/**
 * Constant-definition files are the SSOT owners of numeric literals.
 * noMagicNumbers must stay "error" everywhere else; only these globs may mute it.
 * Contract: docs/STACK-CONTRACT.md + scripts/docs/biome-tailwind-incompatibility.md
 */
const MAGIC_NUMBER_DEFINITION_GLOBS = new Set([
  "**/constants/**",
  "packages/client/constants/**",
  "packages/shared/src/constants/**",
]);

/**
 * Nuxt route/layout filenames are single-segment by router contract; Biome keys
 * filenames (not defineOptions). Scoped mute only — see
 * docs/ssot-ledger/cycle-2026-07-22/contract-escalation-vue-multiword-nuxt-routes.md
 */
const NUXT_ROUTE_FILE_GLOBS = new Set([
  "packages/client/pages/**/*.vue",
  "packages/client/layouts/**/*.vue",
  "packages/client/error.vue",
]);

const isSingleStyleRuleOffOverride = (
  override: { [key: string]: JsonValue },
  allowedGlobs: Set<string>,
  ruleName: string,
): boolean => {
  const includes = override.includes;
  if (!Array.isArray(includes) || includes.length === 0) {
    return false;
  }
  if (!includes.every((entry) => typeof entry === "string" && allowedGlobs.has(entry))) {
    return false;
  }
  const rules = isRecord(override.linter) ? override.linter.rules : null;
  if (!isRecord(rules) || !isRecord(rules.style)) {
    return false;
  }
  const styleKeys = Object.keys(rules.style);
  if (styleKeys.length !== 1 || styleKeys[0] !== ruleName) {
    return false;
  }
  if (rules.style[ruleName] !== "off") {
    return false;
  }
  const ruleGroups = Object.keys(rules);
  return ruleGroups.length === 1 && ruleGroups[0] === "style";
};

const isMagicNumberDefinitionOverride = (override: { [key: string]: JsonValue }): boolean =>
  isSingleStyleRuleOffOverride(override, MAGIC_NUMBER_DEFINITION_GLOBS, "noMagicNumbers");

const isNuxtRouteMultiWordOverride = (override: { [key: string]: JsonValue }): boolean =>
  isSingleStyleRuleOffOverride(override, NUXT_ROUTE_FILE_GLOBS, "useVueMultiWordComponentNames");

const validateOverrides = (overrides: JsonValue, violations: ValidationViolation[]): void => {
  if (!Array.isArray(overrides)) {
    pushViolation(violations, "biome.json overrides must be an array.");
    return;
  }
  for (const [index, override] of overrides.entries()) {
    if (!isRecord(override)) {
      pushViolation(violations, `overrides[${index}] must be an object.`);
      continue;
    }
    if (isMagicNumberDefinitionOverride(override) || isNuxtRouteMultiWordOverride(override)) {
      continue;
    }
    const overrideLinter = override.linter;
    if (isRecord(overrideLinter)) {
      if (overrideLinter.enabled === false) {
        pushViolation(
          violations,
          `overrides[${index}] linter.enabled=false is forbidden (mute-the-files softener).`,
        );
      }
      if (isRecord(overrideLinter.rules)) {
        walkRules(overrideLinter.rules, `overrides[${index}].linter.rules`, violations);
      }
    }
  }
};

export const collectBiomeSofteningViolationsForContent = (
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const config = safeParseJson(content);
  if (!isRecord(config)) {
    return [
      {
        filePath: BIOME_CONFIG_PATH,
        line: 1,
        message: "biome.json must be a JSON object.",
      },
    ];
  }

  validateHtmlSupport(config, violations);

  const linter = config.linter;
  if (!isRecord(linter)) {
    pushViolation(violations, "biome.json must define linter configuration.");
    return violations;
  }

  if (linter.enabled === false) {
    pushViolation(violations, "Root linter.enabled=false is forbidden softener.");
  }

  validateDomains(linter.domains, violations);

  const rules = linter.rules;
  if (!isRecord(rules)) {
    pushViolation(violations, "linter.rules must be configured.");
  } else {
    validateRulesRatchet(rules, violations);
  }

  validateOverrides(config.overrides, violations);
  return violations;
};

const collectViolations = (): ValidationViolation[] => {
  const absolutePath = resolve(process.cwd(), BIOME_CONFIG_PATH);
  const content = readFileSync(absolutePath, "utf8");
  return collectBiomeSofteningViolationsForContent(content);
};

if (import.meta.main) {
  await reportViolations(
    "Biome softener validation failed:",
    collectViolations(),
    "Biome softener validation passed.",
  );
}
