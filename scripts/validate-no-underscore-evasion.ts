import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Underscore-evasion gate — bans `const _foo =` / `let _foo =` top-level
 * underscore-prefixed declarations used to bypass unused-variable lint.
 *
 * Root cause this locks forward: an `<script setup>` refactor left a component
 * with `_emit`, `_alertClass`, `_hasRetry` declared in script but referenced
 * from the template as `emit`, `alertClass`, `hasRetry` (template-binding
 * evasion). The underscore prefix silenced both biome and eslint unused-vars
 * rules, shipping a broken render path. Same evasion appears in composables
 * where `_micStart`/`_micStop` prefix a fire-and-forget promise to silence
 * floating-promise lint.
 *
 * Scope: .ts/.tsx/.vue source under packages/ and scripts/.
 *
 * Allowed (narrow):
 * - `_` exact single char (idiomatic discard)
 * - `_foo` inside .test.ts/.spec.ts (test fixtures may legitimately shadow)
 *
 * Banned everywhere else:
 * - `const _name = ...` where name length > 0 (any non-discard underscore prefix)
 * - `let _name = ...` (same)
 *
 * Ratchet: any new `const _x =` outside the test/self-scan exemptions is a
 * release blocker. NO ALLOWLIST — an allowlist is a softener cheat surface
 * even when ledger-documented; the correct fix is to remove the evasion.
 */

const scanRoots = ["packages", "scripts"] as const;
const sourceExtensions = new Set([".ts", ".tsx", ".vue"]);

const isTestFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  filePath.endsWith(".spec.ts") ||
  filePath.endsWith(".test.tsx") ||
  filePath.endsWith(".spec.tsx");

const isUnderscoreGateSource = (filePath: string): boolean =>
  filePath === "scripts/validate-no-underscore-evasion.ts" ||
  filePath === "scripts/validate-no-underscore-evasion.test.ts";

const isExempt = (filePath: string): boolean =>
  isTestFile(filePath) || isUnderscoreGateSource(filePath);

/**
 * Match `const _name =` or `let _name =` where `_name` has at least one extra
 * letter after the leading underscore (so plain `_` is allowed). Anchored on
 * statement start (no leading non-whitespace) to avoid matching destructuring
 * renames like `const { foo: _foo }`.
 */
const UNDERSCORE_DECL_PATTERN = /(?<=^|\n)\s*(?:const|let)\s+(_[A-Za-z0-9_$][A-Za-z0-9_$]*)\s*=/gu;

export const collectUnderscoreEvasionViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isExempt(filePath)) return [];
  const violations: ValidationViolation[] = [];
  UNDERSCORE_DECL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(UNDERSCORE_DECL_PATTERN)) {
    const identifier = match[1];
    if (!identifier || identifier === "_") continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Underscore-prefix declaration "${identifier}" is an unused-variable evasion. Either use the value (remove the leading underscore) or remove the declaration. Discard (single "_") is allowed.`,
    });
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectUnderscoreEvasionViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Underscore-evasion validation failed:",
    await collectViolations(),
    "Underscore-evasion validation passed.",
  );
}
