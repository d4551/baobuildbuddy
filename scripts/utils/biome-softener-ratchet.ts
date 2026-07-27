/**
 * Biome UI/complexity ratchet predicates — extracted so softener gate stays ≤400 lines.
 */
import {
  validateStyleAdditionsRatchet,
  validateSuspiciousAdditionsRatchet,
} from "./biome-softener-ratchet-v2";
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

export const requireRuleError = (
  group: { [key: string]: SoftenerJsonValue },
  ruleName: string,
  path: string,
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  const value = group[ruleName];
  const isStringError = value === "error";
  const isObjectError = isSoftenerRecord(value) && value.level === "error";
  if (!isStringError && !isObjectError) {
    violations.push({
      filePath: biomePath,
      line: 1,
      message: `${path}.${ruleName} must be "error" or { level: "error" } (info/off/warn/delete is softener).`,
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
  requireRuleError(
    complexity,
    "noImplicitCoercions",
    "linter.rules.complexity",
    violations,
    biomePath,
  );
  const implicitCoercions = complexity.noImplicitCoercions;
  const implicitCoercionsOk =
    isSoftenerRecord(implicitCoercions) &&
    implicitCoercions.level === "error" &&
    isSoftenerRecord(implicitCoercions.options) &&
    implicitCoercions.options.allowDoubleNegation === false;
  if (!implicitCoercionsOk) {
    violations.push({
      filePath: biomePath,
      line: 1,
      message:
        "linter.rules.complexity.noImplicitCoercions must be error with allowDoubleNegation=false (no implicit type coercion shorthand).",
    });
  }
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
    "noNonNullAssertion",
    "noUselessElse",
    "useConst",
    "useTemplate",
    "useExportType",
    "useImportType",
    "useNodejsImportProtocol",
    "useNumberNamespace",
    "useShorthandFunctionType",
    "useDefaultParameterLast",
    "useExponentiationOperator",
    "useAsConstAssertion",
    "useEnumInitializers",
    "useDefaultSwitchClause",
    "useCollapsedElseIf",
    "useArrayLiterals",
    "useVueMultiWordComponentNames",
    "useVueDefineMacrosOrder",
    "useVueHyphenatedAttributes",
  ] as const) {
    requireRuleError(style, ruleName, "linter.rules.style", violations, biomePath);
  }
};

export const validateSuspiciousUiRatchet = (
  suspicious: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  for (const ruleName of [
    "noConsole",
    "noDebugger",
    "noExplicitAny",
    "noSkippedTests",
    "noFocusedTests",
    "noExportsInTest",
    "noAlert",
    "noDocumentCookie",
    "noConstantBinaryExpressions",
    "noImplicitAnyLet",
    "noShadowRestrictedNames",
  ] as const) {
    requireRuleError(suspicious, ruleName, "linter.rules.suspicious", violations, biomePath);
  }
};

export const validateCorrectnessUiRatchet = (
  correctness: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  for (const ruleName of [
    "noUnusedImports",
    "noUnusedVariables",
    "noUnusedFunctionParameters",
    "noUnusedPrivateClassMembers",
    "noUnusedLabels",
    "useExhaustiveDependencies",
    "useHookAtTopLevel",
    "useJsxKeyInIterable",
  ] as const) {
    requireRuleError(correctness, ruleName, "linter.rules.correctness", violations, biomePath);
  }
};

export const validateSecurityUiRatchet = (
  security: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  if (!isSoftenerRecord(security.noSecrets) || security.noSecrets.level !== "error") {
    violations.push({
      filePath: biomePath,
      line: 1,
      message: "linter.rules.security.noSecrets must be error (entropy gate).",
    });
  }
  requireRuleError(
    security,
    "noDangerouslySetInnerHtml",
    "linter.rules.security",
    violations,
    biomePath,
  );
  requireRuleError(security, "noGlobalEval", "linter.rules.security", violations, biomePath);
};

export const validateA11yRatchet = (
  a11y: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  const requiredA11y = [
    "noAccessKey",
    "noAmbiguousAnchorText",
    "noAriaHiddenOnFocusable",
    "noAriaUnsupportedElements",
    "noAutofocus",
    "noDistractingElements",
    "noHeaderScope",
    "noInteractiveElementToNoninteractiveRole",
    "noLabelWithoutControl",
    "noNoninteractiveElementInteractions",
    "noNoninteractiveElementToInteractiveRole",
    "noNoninteractiveTabindex",
    "noPositiveTabindex",
    "noRedundantAlt",
    "noRedundantRoles",
    "noStaticElementInteractions",
    "noSvgWithoutTitle",
    "useAltText",
    "useAnchorContent",
    "useAriaActivedescendantWithTabindex",
    "useAriaPropsForRole",
    "useAriaPropsSupportedByRole",
    "useButtonType",
    "useFocusableInteractive",
    "useGenericFontNames",
    "useHeadingContent",
    "useHtmlLang",
    "useIframeTitle",
    "useKeyWithClickEvents",
    "useKeyWithMouseEvents",
    "useMediaCaption",
    "useSemanticElements",
    "useValidAnchor",
    "useValidAriaProps",
    "useValidAriaRole",
    "useValidAriaValues",
    "useValidAutocomplete",
    "useValidLang",
  ] as const;
  for (const ruleName of requiredA11y) {
    requireRuleError(a11y, ruleName, "linter.rules.a11y", violations, biomePath);
  }
};

export const validateNurseryUiRatchet = (
  nursery: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
): void => {
  const requiredNursery = [
    "noFloatingPromises",
    "noMisusedPromises",
    "useAwaitThenable",
    "noVueImportCompilerMacros",
    "noVueRefAsOperand",
    "noVueVOnNumberValues",
    "useVueNextTickPromise",
    "noDrizzleDeleteWithoutWhere",
    "noDrizzleUpdateWithoutWhere",
    "useExhaustiveSwitchCases",
    "noInlineStyles",
    "useIframeSandbox",
    "useScopedStyles",
    "noExcessiveNestedCallbacks",
    "noExcessiveSelectorClasses",
    "noPlaywrightElementHandle",
    "noPlaywrightEval",
    "noPlaywrightForceOption",
    "noPlaywrightMissingAwait",
    "noPlaywrightNetworkidle",
    "noPlaywrightPagePause",
    "noPlaywrightUselessAwait",
    "noPlaywrightWaitForTimeout",
  ] as const;
  for (const ruleName of requiredNursery) {
    requireRuleError(nursery, ruleName, "linter.rules.nursery", violations, biomePath);
  }
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

const validateRecordOrPush = (
  value: SoftenerJsonValue | undefined,
  push: (message: string) => void,
  missingMessage: string,
  validate: (record: { [key: string]: SoftenerJsonValue }) => void,
): void => {
  if (value === undefined || !isSoftenerRecord(value)) {
    push(missingMessage);
    return;
  }
  validate(value);
};

export const validateGroupRatchets = (
  rules: { [key: string]: SoftenerJsonValue },
  violations: ValidationViolation[],
  biomePath: string,
  push: (message: string) => void,
): void => {
  validateRecordOrPush(
    rules.complexity,
    push,
    "linter.rules.complexity must be a rule object with noVoid/complexity ceilings.",
    (complexity) => validateComplexityRatchet(complexity, violations, biomePath),
  );
  validateRecordOrPush(
    rules.style,
    push,
    "linter.rules.style must be a rule object with UI/control ratchets.",
    (style) => {
      validateStyleUiRatchet(style, violations, biomePath);
      validateStyleAdditionsRatchet(style, violations, biomePath);
    },
  );
  validateRecordOrPush(
    rules.suspicious,
    push,
    "linter.rules.suspicious must be a rule object.",
    (suspicious) => {
      validateSuspiciousUiRatchet(suspicious, violations, biomePath);
      validateSuspiciousAdditionsRatchet(suspicious, violations, biomePath);
    },
  );
  validateRecordOrPush(
    rules.correctness,
    push,
    "linter.rules.correctness must be a rule object with unused/exhaustive ratchets.",
    (correctness) => validateCorrectnessUiRatchet(correctness, violations, biomePath),
  );
  validateRecordOrPush(
    rules.security,
    push,
    "linter.rules.security must be a rule object.",
    (security) => validateSecurityUiRatchet(security, violations, biomePath),
  );
  validateRecordOrPush(
    rules.a11y,
    push,
    "linter.rules.a11y must be a rule object with full a11y ratchets.",
    (a11y) => validateA11yRatchet(a11y, violations, biomePath),
  );
  const performance = rules.performance;
  if (!isSoftenerRecord(performance) || performance.noBarrelFile !== "error") {
    push(
      'linter.rules.performance.noBarrelFile must be "error" (info/off/warn/delete is softener).',
    );
  }
  validateRecordOrPush(
    rules.nursery,
    push,
    "linter.rules.nursery must opt into floating-promise / vue / drizzle / playwright / UI gates.",
    (nursery) => validateNurseryUiRatchet(nursery, violations, biomePath),
  );
};

export const MAX_LINES_PER_FUNCTION_CEILING = MAX_LINES_PER_FUNCTION;
