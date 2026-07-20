import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Biome softener gate — forbids lint severity demotions and disabled groups.
 *
 * Binding: lazy overrides that set rules to "off"/"warn" or disable the linter
 * hide UI/UX, wiring, and security sins. Allowed exceptions are documented below
 * and must stay narrowly scoped.
 */

const BIOME_CONFIG_PATH = "biome.json";
const ALLOWED_OFF_RULES_FOR_VUE_TEMPLATE_BLINDNESS = new Set([
  "noUnusedImports",
  "noUnusedVariables",
  "noUnusedFunctionParameters",
]);

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const isRecord = (value: JsonValue): value is { [key: string]: JsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const walkRules = (
  rules: JsonValue,
  path: string,
  violations: ValidationViolation[],
  allowOffRules: Set<string>,
): void => {
  if (!isRecord(rules)) {
    return;
  }
  for (const [key, value] of Object.entries(rules)) {
    const nextPath = `${path}.${key}`;
    if (key === "preset" || key === "recommended") {
      continue;
    }
    if (value === "off" || value === "warn") {
      if (value === "off" && allowOffRules.has(key)) {
        continue;
      }
      violations.push({
        filePath: BIOME_CONFIG_PATH,
        line: 1,
        message: `Softening forbidden at ${nextPath}=${JSON.stringify(value)}. Use "error" or fix the code.`,
      });
      continue;
    }
    if (isRecord(value) && "level" in value) {
      const level = value.level;
      if (level === "off" || level === "warn") {
        violations.push({
          filePath: BIOME_CONFIG_PATH,
          line: 1,
          message: `Softening forbidden at ${nextPath}.level=${JSON.stringify(level)}. Use "error"/"on".`,
        });
      }
      continue;
    }
    if (isRecord(value)) {
      walkRules(value, nextPath, violations, allowOffRules);
    }
  }
};

export const collectBiomeSofteningViolationsForContent = (
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const config = JSON.parse(content) as JsonValue;
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
    violations.push({
      filePath: BIOME_CONFIG_PATH,
      line: 1,
      message: "biome.json must define linter configuration.",
    });
    return violations;
  }

  if (linter.enabled === false) {
    violations.push({
      filePath: BIOME_CONFIG_PATH,
      line: 1,
      message: 'Root linter.enabled=false is forbidden softener.',
    });
  }

  const domains = linter.domains;
  if (!isRecord(domains)) {
    violations.push({
      filePath: BIOME_CONFIG_PATH,
      line: 1,
      message: "linter.domains must enable vue/drizzle/project/test/playwright/types.",
    });
  } else {
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
        violations.push({
          filePath: BIOME_CONFIG_PATH,
          line: 1,
          message: `linter.domains.${domain} must be ${JSON.stringify(expected)} (got ${JSON.stringify(domains[domain])}).`,
        });
      }
    }
  }

  const rules = linter.rules;
  if (!isRecord(rules)) {
    violations.push({
      filePath: BIOME_CONFIG_PATH,
      line: 1,
      message: "linter.rules must be configured.",
    });
  } else {
    if (rules.preset !== "recommended") {
      violations.push({
        filePath: BIOME_CONFIG_PATH,
        line: 1,
        message: 'linter.rules.preset must be "recommended" (stack-scoped; domains supply framework depth).',
      });
    }
    walkRules(rules, "linter.rules", violations, new Set());
    const requiredErrorGroups = ["a11y", "performance", "security", "suspicious"] as const;
    for (const group of requiredErrorGroups) {
      const value = rules[group];
      if (value !== "error" && !isRecord(value)) {
        violations.push({
          filePath: BIOME_CONFIG_PATH,
          line: 1,
          message: `linter.rules.${group} must be "error" or a rule object with error-level rules.`,
        });
      }
    }
    if (!isRecord(rules.nursery)) {
      violations.push({
        filePath: BIOME_CONFIG_PATH,
        line: 1,
        message: "linter.rules.nursery must opt into floating-promise / vue / drizzle / playwright gates.",
      });
    }
  }

  const overrides = config.overrides;
  if (!Array.isArray(overrides)) {
    violations.push({
      filePath: BIOME_CONFIG_PATH,
      line: 1,
      message: "biome.json overrides must be an array.",
    });
    return violations;
  }

  for (const [index, override] of overrides.entries()) {
    if (!isRecord(override)) {
      violations.push({
        filePath: BIOME_CONFIG_PATH,
        line: 1,
        message: `overrides[${index}] must be an object.`,
      });
      continue;
    }
    const overrideLinter = override.linter;
    if (!isRecord(overrideLinter)) {
      continue;
    }
    if (overrideLinter.enabled === false) {
      violations.push({
        filePath: BIOME_CONFIG_PATH,
        line: 1,
        message: `overrides[${index}] linter.enabled=false is forbidden (was used to mute .vue).`,
      });
    }
    const includes = override.includes;
    const includeList = Array.isArray(includes)
      ? includes.filter((item): item is string => typeof item === "string")
      : [];
    const isVueOnly =
      includeList.length > 0 && includeList.every((item) => item.includes("*.vue"));
    const allowOff = isVueOnly ? ALLOWED_OFF_RULES_FOR_VUE_TEMPLATE_BLINDNESS : new Set<string>();
    if (isRecord(overrideLinter.rules)) {
      walkRules(overrideLinter.rules, `overrides[${index}].linter.rules`, violations, allowOff);
    }
  }

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
