/**
 * Biome UI/complexity ratchet predicates — extracted so softener gate stays ≤400 lines.
 */
import type { ValidationViolation } from "./validation-helpers";

export type SoftenerJsonValue =
  | null
  | boolean
  | number
  | string
  | SoftenerJsonValue[]
  | { [key: string]: SoftenerJsonValue };

export const isSoftenerRecord = (
  value: SoftenerJsonValue,
): value is { [key: string]: SoftenerJsonValue } =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const MAX_LINES_PER_FUNCTION = 60;

const requireRuleError = (
  group: { [key: string]: SoftenerJsonValue },
  ruleName: string,
  path: string,
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  if (group[ruleName] !== "error") {
    violations.push({
      filePath: biomePath,
      line: 1,
      message: `${path}.${ruleName} must be "error" (info/off/warn/delete is softener).`,
    });
  }
};

export const validateComplexityRatchet = (
  complexity: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  if (complexity.noVoid !== "error") {
    violations.push({
      filePath: biomePath,
      line: 1,
      message: 'linter.rules.complexity.noVoid must be "error".',
    });
  }
  if (complexity.noExcessiveCognitiveComplexity !== "error") {
    violations.push({
      filePath: biomePath,
      line: 1,
      message:
        'linter.rules.complexity.noExcessiveCognitiveComplexity must be "error" (info/off/warn/delete is softener).',
    });
  }
  requireRuleError(
    complexity,
    "noUselessContinue",
    "linter.rules.complexity",
    violations,
    biomePath,
  );
  requireRuleError(
    complexity,
    "noUselessStringConcat",
    "linter.rules.complexity",
    violations,
    biomePath,
  );
  const linesPerFn = complexity.noExcessiveLinesPerFunction;
  const linesOk =
    isSoftenerRecord(linesPerFn) &&
    linesPerFn.level === "error" &&
    isSoftenerRecord(linesPerFn.options) &&
    linesPerFn.options.maxLines === MAX_LINES_PER_FUNCTION;
  if (!linesOk) {
    violations.push({
      filePath: biomePath,
      line: 1,
      message: `linter.rules.complexity.noExcessiveLinesPerFunction must be error with maxLines=${String(MAX_LINES_PER_FUNCTION)} (info/off/warn/delete/ceiling-raise is softener).`,
    });
  }
};

export const validateStyleUiRatchet = (
  style: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  for (const ruleName of [
    "noNestedTernary",
    "useDefaultSwitchClause",
    "useCollapsedElseIf",
    "useArrayLiterals",
  ] as const) {
    requireRuleError(style, ruleName, "linter.rules.style", violations, biomePath);
  }
};

export const validateSuspiciousUiRatchet = (
  suspicious: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  requireRuleError(
    suspicious,
    "noConstantBinaryExpressions",
    "linter.rules.suspicious",
    violations,
    biomePath,
  );
  requireRuleError(
    suspicious,
    "noImplicitAnyLet",
    "linter.rules.suspicious",
    violations,
    biomePath,
  );
};

export const validateNurseryUiRatchet = (
  nursery: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  requireRuleError(
    nursery,
    "useExhaustiveSwitchCases",
    "linter.rules.nursery",
    violations,
    biomePath,
  );
  const sorted = nursery.useSortedClasses;
  const sortedOk =
    isSoftenerRecord(sorted) &&
    sorted.level === "error" &&
    isSoftenerRecord(sorted.options) &&
    Array.isArray(sorted.options.attributes) &&
    sorted.options.attributes.includes("class");
  if (!sortedOk) {
    violations.push({
      filePath: biomePath,
      line: 1,
      message:
        'linter.rules.nursery.useSortedClasses must be error with options.attributes including "class" (UI class SSOT).',
    });
  }
};

export const validateGroupRatchets = (
  rules: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
  push: (message: string) => void,
): void => {
  const complexity = rules.complexity;
  if (!isSoftenerRecord(complexity)) {
    push("linter.rules.complexity must be a rule object with noVoid/complexity ceilings.");
  } else {
    validateComplexityRatchet(complexity, violations, biomePath);
  }
  const style = rules.style;
  if (!isSoftenerRecord(style)) {
    push("linter.rules.style must be a rule object with UI/control ratchets.");
  } else {
    validateStyleUiRatchet(style, violations, biomePath);
  }
  const suspicious = rules.suspicious;
  if (!isSoftenerRecord(suspicious)) {
    push("linter.rules.suspicious must be a rule object.");
  } else {
    validateSuspiciousUiRatchet(suspicious, violations, biomePath);
  }
  const performance = rules.performance;
  if (!isSoftenerRecord(performance) || performance.noBarrelFile !== "error") {
    push(
      'linter.rules.performance.noBarrelFile must be "error" (info/off/warn/delete is softener).',
    );
  }
  const nursery = rules.nursery;
  if (!isSoftenerRecord(nursery)) {
    push(
      "linter.rules.nursery must opt into floating-promise / vue / drizzle / playwright / UI gates.",
    );
  } else {
    if (nursery.noVueRefAsOperand === "off") {
      push("linter.rules.nursery.noVueRefAsOperand cannot be off.");
    }
    validateNurseryUiRatchet(nursery, violations, biomePath);
  }
};

export const MAX_LINES_PER_FUNCTION_CEILING = MAX_LINES_PER_FUNCTION;
