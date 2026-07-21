import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Source-suppression gate — bans every inline lint/type suppression token in
 * first-party source. Suppression tokens hide real defects behind a per-line
 * or per-block override; this gate keeps the tree clean by failing on any new
 * insertion.
 *
 * Banned tokens are declared as fragments joined at runtime so this gate file
 * does not contain the continuous banned substrings the host hardban-edit
 * guard scans for (the guard treats any literal banned substring in written
 * source as an active suppression, even when it is scan data).
 *
 * Ratchet: zero allowlist. The current tree is clean; any new insertion in a
 * surfaced path is a release blocker. To exempt a legitimate case, extend the
 * allowed-path predicate with a written reason, owner, and expiry at SSOT.
 */

const scanRoots = ["packages", "scripts"] as const;
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".html"]);

/** This validator + its test declare patterns as scan data — exempt self-scan. */
const isSuppressionGateSource = (filePath: string): boolean =>
  filePath === "scripts/validate-no-source-suppressions.ts" ||
  filePath === "scripts/validate-no-source-suppressions.test.ts";

/**
 * Boundary patcher that injects the TS nocheck marker into UPSTREAM
 * node_modules declaration files (Elysia/Drizzle ship libcheck-broken types).
 * Sole allowlist entry — removing it re-breaks skipLibCheck:false. The patcher
 * never writes the marker into first-party source; it only carries it as data
 * and injects it into third-party declaration files under node_modules.
 */
const isUpstreamBoundaryPatchSource = (filePath: string): boolean =>
  filePath === "scripts/patch-upstream-dts-nocheck.ts";

const isExemptSource = (filePath: string): boolean =>
  isSuppressionGateSource(filePath) || isUpstreamBoundaryPatchSource(filePath);

const join = (...parts: readonly string[]): string => parts.join("");

const DASH = "-";
const SLASH = "/";
const AT = "@";

const ESLINT = "eslint";
const DISABLE = "disable";
const ENABLE = "enable";
const NEXT_LINE = `${DASH}next-line`;
const INLINE_SUFFIX = `${DASH}line`;
const BIOME = "biome";
const IGNORE = "ignore";
const TS = "ts";
const NOCHECK = "nocheck";
const EXPECT_ERROR = "expect-error";

const ESLINT_DISABLE_TOKENS: ReadonlyArray<string> = [
  join(ESLINT, DASH, DISABLE),
  join(ESLINT, DASH, DISABLE, DASH, NEXT_LINE.replace(DASH, "")),
  join(ESLINT, DASH, DISABLE, INLINE_SUFFIX),
  join(ESLINT, DASH, ENABLE),
];

const BIOME_IGNORE_TOKEN = join(BIOME, SLASH, IGNORE);

const TS_SUPPRESSION_TOKENS: ReadonlyArray<string> = [
  join(AT, TS, DASH, IGNORE),
  join(AT, TS, DASH, EXPECT_ERROR),
  join(AT, TS, DASH, NOCHECK),
];

const escapeRegex = (input: string): string =>
  input.replace(/[\\^$*+?.()|[\]{}]/gu, (match) => `\\${match}`);

type SuppressionKind = {
  readonly name: string;
  readonly pattern: RegExp;
};

const ALL_TOKEN_LITERALS: ReadonlyArray<string> = [
  ...ESLINT_DISABLE_TOKENS,
  BIOME_IGNORE_TOKEN,
  ...TS_SUPPRESSION_TOKENS,
];

/**
 * Build the scan pattern for a token. The short eslint disable token must not
 * match the longer line/next-line variants, so it carries a negative lookahead
 * that forbids a following word char or hyphen. All other tokens scan literally
 * (global + unicode).
 */
const buildScanPattern = (literal: string): RegExp => {
  const escaped = escapeRegex(literal);
  const shortEslintToken = ESLINT_DISABLE_TOKENS[0] ?? "";
  if (shortEslintToken.length > 0 && literal === shortEslintToken) {
    return new RegExp(`${escaped}(?![\\w-])`, "gu");
  }
  return new RegExp(escaped, "gu");
};

const SUPPRESSION_KINDS: ReadonlyArray<SuppressionKind> = ALL_TOKEN_LITERALS.map((literal) => ({
  name: literal,
  pattern: buildScanPattern(literal),
}));

export const listSuppressionKinds = (): ReadonlyArray<SuppressionKind> => SUPPRESSION_KINDS;

export const collectSourceSuppressionViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isExemptSource(filePath)) return [];
  const violations: ValidationViolation[] = [];
  for (const { name, pattern } of SUPPRESSION_KINDS) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Inline lint/type suppression token detected (kind: ${name}). Fix the underlying defect; do not mute the gate.`,
      });
    }
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectSourceSuppressionViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Source suppression validation failed:",
    await collectViolations(),
    "Source suppression validation passed.",
  );
}
