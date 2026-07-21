import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { safeParseJson } from "../packages/shared/src/utils/json";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

/**
 * Biome softener gate — forbids lint severity demotions and disabled groups.
 *
 * Binding: "off" and "warn" are always forbidden (no hide-the-sin).
 * Proven Biome tooling gaps may use "info" only (still reported, not CI-hidden):
 * - noUnused* on .vue (template-blind SFC analysis)
 * - noVueRefAsOperand (nursery FP on forEach)
 * - useVueMultiWordComponentNames on Nuxt pages/layouts/app/error
 * All other off|warn|info, linter disabled, maxLines>60 = softener = fail.
 */

const BIOME_CONFIG_PATH = "biome.json";
const MAX_LINES_PER_FUNCTION = 60;

/** Proven tooling gaps — may be "info" only, never off/warn. */
const TOOLING_GAP_INFO_RULES: ReadonlyArray<{
  readonly includesKey: string | null;
  readonly rulePaths: ReadonlySet<string>;
}> = [
  {
    includesKey: null,
    rulePaths: new Set(["nursery.noVueRefAsOperand"]),
  },
  {
    includesKey: "**/*.vue",
    rulePaths: new Set([
      "correctness.noUnusedImports",
      "correctness.noUnusedVariables",
      "correctness.noUnusedFunctionParameters",
      "nursery.noVueRefAsOperand",
    ]),
  },
  {
    includesKey: "**/app.vue,**/error.vue,**/layouts/**/*.vue,**/pages/**/*.vue",
    rulePaths: new Set(["style.useVueMultiWordComponentNames"]),
  },
];

const includesKeyFrom = (includes: JsonValue): string => {
  if (!Array.isArray(includes)) {
    return "";
  }
  return includes
    .filter((entry): entry is string => typeof entry === "string")
    .slice()
    .sort()
    .join(",");
};

const ROOT_RULES_PREFIX = /^linter\.rules\./u;
const OVERRIDE_RULES_PREFIX = /^overrides\[\d+\]\.linter\.rules\./u;
const LEVEL_SUFFIX = /\.level$/u;

const isToolingGapInfo = (includesKey: string | null, rulePath: string): boolean => {
  const normalizedPath = rulePath.replace(ROOT_RULES_PREFIX, "").replace(LEVEL_SUFFIX, "");
  const leaf = normalizedPath.split(".").pop() ?? normalizedPath;
  for (const gap of TOOLING_GAP_INFO_RULES) {
    if (gap.includesKey !== includesKey) {
      continue;
    }
    for (const path of gap.rulePaths) {
      if (path === normalizedPath || path.endsWith(`.${leaf}`) || path === leaf) {
        return true;
      }
    }
  }
  return false;
};

/** Documented info-only tooling gaps (never off/warn). */
const ALLOWED_INFO_RULES = new Set([
  "noUnusedImports",
  "noUnusedVariables",
  "noUnusedFunctionParameters",
  "useVueMultiWordComponentNames",
  "noVueRefAsOperand",
  "noExcessiveCognitiveComplexity",
  "noExcessiveLinesPerFunction",
  "noBarrelFile",
]);

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const isRecord = (value: JsonValue): value is { [key: string]: JsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const inspectInfoSeverity = (
  key: string,
  nextPath: string,
  includesKey: string | null,
  violations: ValidationViolation[],
): void => {
  const shortPath = nextPath.replace(ROOT_RULES_PREFIX, "").replace(OVERRIDE_RULES_PREFIX, "");
  if (!ALLOWED_INFO_RULES.has(key) || !isToolingGapInfo(includesKey, shortPath)) {
    pushViolation(
      violations,
      `Severity info at ${nextPath} is forbidden outside documented tooling-gap allowlist (vue unused / Nuxt multiword / noVueRefAsOperand).`,
    );
  }
};

const inspectLevelObject = (
  key: string,
  value: { [key: string]: JsonValue },
  nextPath: string,
  violations: ValidationViolation[],
): void => {
  const level = value.level;
  if (level === "off" || level === "warn") {
    pushViolation(
      violations,
      `Softening forbidden at ${nextPath}.level=${JSON.stringify(level)}. Use "error"/"on".`,
    );
  }
  if (level === "info" && !ALLOWED_INFO_RULES.has(key)) {
    pushViolation(
      violations,
      `Severity info at ${nextPath}.level is forbidden outside documented allowlist.`,
    );
  }
  if (
    key === "noExcessiveLinesPerFunction" &&
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

const walkRuleEntry = (
  key: string,
  value: JsonValue,
  path: string,
  violations: ValidationViolation[],
  includesKey: string | null,
): void => {
  const nextPath = `${path}.${key}`;
  if (key === "preset" || key === "recommended") {
    return;
  }
  if (value === "off" || value === "warn") {
    pushViolation(
      violations,
      `Softening forbidden at ${nextPath}=${JSON.stringify(value)}. Use "error" (or documented "info" tooling-gap only). Never off/warn.`,
    );
    return;
  }
  if (value === "info") {
    inspectInfoSeverity(key, nextPath, includesKey, violations);
    return;
  }
  if (isRecord(value) && "level" in value) {
    inspectLevelObject(key, value, nextPath, violations);
    return;
  }
  if (isRecord(value)) {
    walkRules(value, nextPath, violations, includesKey);
  }
};

const walkRules = (
  rules: JsonValue,
  path: string,
  violations: ValidationViolation[],
  includesKey: string | null,
): void => {
  if (!isRecord(rules)) {
    return;
  }
  for (const [key, value] of Object.entries(rules)) {
    walkRuleEntry(key, value, path, violations, includesKey);
  }
};

const pushViolation = (violations: ValidationViolation[], message: string): void => {
  violations.push({ filePath: BIOME_CONFIG_PATH, line: 1, message });
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

const validateComplexityRatchet = (
  complexity: { [key: string]: JsonValue },
  violations: ValidationViolation[],
): void => {
  if (complexity.noVoid !== "error") {
    pushViolation(violations, 'linter.rules.complexity.noVoid must be "error".');
  }
  if (complexity.noExcessiveCognitiveComplexity !== "error") {
    pushViolation(
      violations,
      'linter.rules.complexity.noExcessiveCognitiveComplexity must be "error" (info/off/warn/delete is softener).',
    );
  }
  const linesPerFn = complexity.noExcessiveLinesPerFunction;
  const linesOk =
    isRecord(linesPerFn) &&
    linesPerFn.level === "error" &&
    isRecord(linesPerFn.options) &&
    linesPerFn.options.maxLines === MAX_LINES_PER_FUNCTION;
  if (!linesOk) {
    pushViolation(
      violations,
      `linter.rules.complexity.noExcessiveLinesPerFunction must be error with maxLines=${String(MAX_LINES_PER_FUNCTION)} (info/off/warn/delete/ceiling-raise is softener).`,
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
  walkRules(rules, "linter.rules", violations, null);
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
  if (!isRecord(rules.nursery)) {
    pushViolation(
      violations,
      "linter.rules.nursery must opt into floating-promise / vue / drizzle / playwright gates.",
    );
  }
  const complexity = rules.complexity;
  if (!isRecord(complexity)) {
    pushViolation(
      violations,
      "linter.rules.complexity must be a rule object with noVoid/complexity ceilings.",
    );
  } else {
    validateComplexityRatchet(complexity, violations);
  }
  const performance = rules.performance;
  if (
    !isRecord(performance) ||
    (performance.noBarrelFile !== "error" && performance.noBarrelFile !== "info")
  ) {
    pushViolation(
      violations,
      'linter.rules.performance.noBarrelFile must be "error" or "info" (off/warn/delete is softener).',
    );
  }
  const nursery = rules.nursery;
  if (isRecord(nursery) && nursery.noVueRefAsOperand === "off") {
    pushViolation(violations, "linter.rules.nursery.noVueRefAsOperand cannot be off.");
  }
};

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
    const overrideLinter = override.linter;
    if (!isRecord(overrideLinter)) {
      continue;
    }
    if (overrideLinter.enabled === false) {
      pushViolation(
        violations,
        `overrides[${index}] linter.enabled=false is forbidden (was used to mute .vue).`,
      );
    }
    const key = includesKeyFrom(override.includes);
    if (isRecord(overrideLinter.rules)) {
      walkRules(overrideLinter.rules, `overrides[${index}].linter.rules`, violations, key);
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
