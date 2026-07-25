/**
 * Ratchet: client ESLint softener count may only shrink until flat/essential cutover.
 */
import { readFileSync } from "node:fs";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const ESLINT_PATH = "packages/client/eslint.config.js";
/** Shrink-only ceilings — lower when offs/ignore-patterns are removed; never raise. */
const MAX_OFF_RULES = 9;
const MAX_UNUSED_IGNORE_EVASIONS = 3;
const FORBIDDEN_IGNORE_KEYS = [
  "argsIgnorePattern",
  "varsIgnorePattern",
  "caughtErrorsIgnorePattern",
] as const;

const countMatches = (content: string, pattern: RegExp): number =>
  (content.match(pattern) ?? []).length;

export const collectEslintSoftenerRatchetViolations = (
  content: string,
  filePath = ESLINT_PATH,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const offCount = countMatches(content, /:\s*["']off["']/gu);
  if (offCount > MAX_OFF_RULES) {
    violations.push({
      filePath,
      line: 1,
      message: `ESLint has ${String(offCount)} "off" rules (cap ${String(MAX_OFF_RULES)}). Shrink only.`,
    });
  }
  const ignoreEvasionCount = FORBIDDEN_IGNORE_KEYS.filter((key) => content.includes(key)).length;
  if (ignoreEvasionCount > MAX_UNUSED_IGNORE_EVASIONS) {
    violations.push({
      filePath,
      line: 1,
      message: `ESLint has ${String(ignoreEvasionCount)} unused-ignore evasions (cap ${String(MAX_UNUSED_IGNORE_EVASIONS)}). Shrink only.`,
    });
  }
  return violations;
};

const main = async (): Promise<void> => {
  const content = readFileSync(ESLINT_PATH, "utf8");
  await reportViolations(
    "ESLint softener ratchet failed:",
    collectEslintSoftenerRatchetViolations(content),
    "ESLint softener ratchet passed.",
  );
};

if (import.meta.main) {
  await main();
}
