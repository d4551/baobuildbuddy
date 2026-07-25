/**
 * Ratchet: biome.json softener count may only shrink (full zero-softener cutover
 * is still ~1.9k diagnostics away). Blocks growth of "off" / enabled=false.
 */
import { readFileSync } from "node:fs";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const BIOME_PATH = "biome.json";
/** Shrink-only ceilings — lower when offs are removed; never raise. */
const MAX_OFF_SEVERITIES = 5;
const MAX_LINTER_ENABLED_FALSE = 1;

const countMatches = (content: string, pattern: RegExp): number =>
  (content.match(pattern) ?? []).length;

export const collectBiomeSoftenerRatchetViolations = (
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const offCount = countMatches(content, /:\s*"off"/gu);
  const enabledFalseCount = countMatches(content, /"enabled"\s*:\s*false/gu);
  if (offCount > MAX_OFF_SEVERITIES) {
    violations.push({
      filePath: BIOME_PATH,
      line: 1,
      message: `biome.json has ${String(offCount)} "off" softeners (cap ${String(MAX_OFF_SEVERITIES)}). Shrink only.`,
    });
  }
  if (enabledFalseCount > MAX_LINTER_ENABLED_FALSE) {
    violations.push({
      filePath: BIOME_PATH,
      line: 1,
      message: `biome.json has ${String(enabledFalseCount)} linter.enabled=false (cap ${String(MAX_LINTER_ENABLED_FALSE)}). Shrink only.`,
    });
  }
  if (/:\s*"warn"/u.test(content) || /:\s*"info"/u.test(content)) {
    violations.push({
      filePath: BIOME_PATH,
      line: 1,
      message: 'biome.json must not introduce "warn"/"info" softeners (use error or delete).',
    });
  }
  return violations;
};

const main = async (): Promise<void> => {
  const content = readFileSync(BIOME_PATH, "utf8");
  await reportViolations(
    "Biome softener ratchet failed:",
    collectBiomeSoftenerRatchetViolations(content),
    "Biome softener ratchet passed.",
  );
};

if (import.meta.main) {
  await main();
}
