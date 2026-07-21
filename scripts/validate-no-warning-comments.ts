import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Warning-comment gate — bans TODO/FIXME/HACK/XXX/PLACEHOLDER/DEPRECATED
 * markers in first-party source. These markers soften intent: a TODO ships a
 * known defect, a FIXME ships a known regression, a PLACEHOLDER ships a
 * stand-in. The right fix is to resolve the marker, not ship it.
 *
 * Scope: packages/ + scripts/ source (.ts/.tsx/.js/.jsx/.mjs/.cjs/.vue/.html).
 * Docs (.md) are handled by a separate gate where migration notes are allowed.
 *
 * Allowlist: validators that declare these tokens as scan DATA (this gate,
 * validate-ui-stubs-noops, validate-no-hardcoded-user-strings) are exempt.
 *
 * Ratchet: zero new markers. Adding a marker is a release blocker; remove it
 * or resolve it before merge.
 */

const scanRoots = ["packages", "scripts"] as const;
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue", ".html"]);

const isWarningCommentGateSource = (filePath: string): boolean =>
  filePath === "scripts/validate-no-warning-comments.ts" ||
  filePath === "scripts/validate-no-warning-comments.test.ts" ||
  filePath === "scripts/validate-ui-stubs-noops.ts" ||
  filePath === "scripts/validate-ui-stubs-noops.test.ts" ||
  filePath === "scripts/validate-no-hardcoded-user-strings.ts" ||
  filePath === "scripts/validate-no-hardcoded-user-strings.test.ts";

const BOUNDARY_LEFT = "(?<![\\w-])";
const BOUNDARY_RIGHT = "(?![\\w-])";

const buildTokenPattern = (token: string): RegExp =>
  new RegExp(`${BOUNDARY_LEFT}${token}${BOUNDARY_RIGHT}`, "gu");

const WARNING_TOKENS = ["TODO", "FIXME", "HACK", "XXX", "PLACEHOLDER", "DEPRECATED"] as const;

const WARNING_KINDS: ReadonlyArray<{ name: string; pattern: RegExp }> = WARNING_TOKENS.map(
  (token) => ({ name: token, pattern: buildTokenPattern(token) }),
);

export const listWarningKinds = (): ReadonlyArray<{ name: string; pattern: RegExp }> =>
  WARNING_KINDS;

export const collectWarningCommentViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isWarningCommentGateSource(filePath)) return [];
  const violations: ValidationViolation[] = [];
  const seenOffsets = new Set<number>();
  for (const { name, pattern } of WARNING_KINDS) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      const offset = match.index ?? 0;
      if (seenOffsets.has(offset)) continue;
      seenOffsets.add(offset);
      violations.push({
        filePath,
        line: getLineFromOffset(content, offset),
        message: `Warning-comment "${name}" is forbidden in source. Resolve the underlying defect; do not ship the marker.`,
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
    collectWarningCommentViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Warning-comment validation failed:",
    await collectViolations(),
    "Warning-comment validation passed.",
  );
}
