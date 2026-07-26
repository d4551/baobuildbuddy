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

const QUOTE_CHARACTERS = new Set(['"', "'", "`"]);

const startsComment = (content: string, index: number): boolean =>
  content[index] === "/" && (content[index + 1] === "/" || content[index + 1] === "*");

const skipQuotedSpan = (content: string, start: number): number => {
  const quote = content[start] ?? "";
  let index = start + 1;
  while (index < content.length) {
    const character = content[index] ?? "";
    if (character === "\\") {
      index += 2;
      continue;
    }
    index += 1;
    if (character === quote) {
      return index;
    }
  }
  return index;
};

const findCommentEnd = (content: string, start: number): number => {
  if (content[start + 1] === "/") {
    const lineEnd = content.indexOf("\n", start);
    return lineEnd === -1 ? content.length : lineEnd;
  }
  const blockEnd = content.indexOf("*/", start + 2);
  return blockEnd === -1 ? content.length : blockEnd + 2;
};

/**
 * Replaces comment characters with spaces while preserving length and newlines,
 * so line numbers and offsets stay identical to the original content. Quoted
 * spans (strings / template literals) are left intact so a route literal in a
 * real string is still caught, while route literals mentioned in JSDoc / line /
 * block comments (e.g. `` `/jobs/refresh` `` in prose) are no longer false
 * positives.
 */
const maskComments = (content: string): string => {
  const characters = content.split("");
  let index = 0;
  while (index < characters.length) {
    const character = characters[index] ?? "";
    if (QUOTE_CHARACTERS.has(character)) {
      index = skipQuotedSpan(content, index);
      continue;
    }
    if (startsComment(content, index)) {
      const end = findCommentEnd(content, index);
      for (let position = index; position < end; position += 1) {
        if (characters[position] !== "\n") {
          characters[position] = " ";
        }
      }
      index = end;
      continue;
    }
    index += 1;
  }
  return characters.join("");
};

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
    const masked = maskComments(content);
    routeLiteralPattern.lastIndex = 0;
    for (const match of masked.matchAll(routeLiteralPattern)) {
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
