import {
  API_ENDPOINT_PREFIX,
  API_ENDPOINTS,
  toApiScopedPath,
} from "../packages/shared/src/constants/endpoints";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { escapeRegExp } from "../packages/shared/src/utils/string";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  shouldIgnorePath,
  type ValidationViolation,
} from "./utils/validation-helpers";

const allowedExtensions = new Set([".ts", ".vue"]);
const scanRoots = ["packages/client", "packages/server/src", "scripts"] as const;
const disallowedRouteLiterals = [
  ...new Set([
    API_ENDPOINT_PREFIX,
    ...Object.values(APP_ROUTES),
    ...Object.values(API_ENDPOINTS).map((endpoint) => toApiScopedPath(endpoint)),
  ]),
]
  .filter((routeLiteral) => routeLiteral !== "/")
  .sort((left, right) => right.length - left.length);
const routeLiteralPattern = new RegExp(
  `(['"\`])(${disallowedRouteLiterals.map((routeLiteral) => escapeRegExp(routeLiteral)).join("|")})(?:\\/[^'"\`\\s]*)?\\1`,
  "gu",
);

const isAllowedRouteLiteralPath = (filePath: string): boolean =>
  filePath.includes("constants/routes") || filePath.includes("constants/endpoints");

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions,
  });

  return files.flatMap(({ filePath, content }) => {
    if (
      shouldIgnorePath(filePath) ||
      isAllowedRouteLiteralPath(filePath) ||
      filePath.includes(".test.") ||
      filePath.includes(".spec.")
    ) {
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
