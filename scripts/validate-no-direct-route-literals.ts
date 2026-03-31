import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  shouldIgnorePath,
  type ValidationViolation,
} from "./utils/validation-helpers";

const allowedExtensions = new Set([".ts", ".vue"]);
const scanRoots = ["packages/client", "packages/server/src", "scripts"] as const;
const routeLiteralPattern =
  /(['"`])(\/(?:api|jobs|resume|cover-letter|portfolio|interview|skills|studios|automation|settings|docs|ai|gamification|setup)(?:\/[^'"`\s]*)?)\1/gu;

const isAllowedRouteLiteralPath = (filePath: string): boolean =>
  filePath.includes("constants/routes") ||
  filePath.includes("constants/endpoints") ||
  filePath.endsWith("nuxt.config.ts") ||
  filePath.includes("/routes/") ||
  filePath.includes("verify-desktop-runtime.ts");

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions,
  });

  return files.flatMap(({ filePath, content }) => {
    if (shouldIgnorePath(filePath) || isAllowedRouteLiteralPath(filePath)) {
      return [];
    }

    const violations: ValidationViolation[] = [];
    routeLiteralPattern.lastIndex = 0;
    for (const match of content.matchAll(routeLiteralPattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Direct route literal ${match[2]} is forbidden. Use shared route or endpoint constants.`,
      });
    }
    return violations;
  });
};

if (import.meta.main) {
  await reportViolations(
    "Direct route literal validation failed:",
    await collectViolations(),
    "Direct route literal validation passed.",
  );
}
