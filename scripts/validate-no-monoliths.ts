import {
  collectProjectFileEntries,
  countLines,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const sourceExtensions = new Set([".ts", ".tsx", ".vue"]);
const scanRoots = [
  "packages/client",
  "packages/server/src",
  "packages/shared/src",
  "packages/scraper/src",
] as const;
const maxVueLines = 350;
const maxTypeScriptLines = 400;
const maxFunctionBodyLines = 80;
const maxParameterCount = 5;
const maxBranchCount = 15;
const maxNestedConditionalDepth = 3;
const isIgnoredFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  (filePath.includes("/locales/") && filePath.endsWith("/catalog.ts")) ||
  filePath.includes("/dist-types/") ||
  filePath.includes("/db/seed/") ||
  filePath.endsWith("/studios.generated.ts");

const functionPattern =
  /(?:^|\n)(?:export\s+)?(?:async\s+)?function\s+[A-Za-z0-9_]+\s*\(([^)]*)\)\s*(?::[^{=\n]+)?\{/gu;
const methodPattern =
  /(?:^|\n)\s*(?:private|protected|public)?\s*(?:static\s+)?(?:async\s+)?[A-Za-z0-9_]+\s*\(([^)]*)\)\s*(?::[^{=\n]+)?\{/gu;
const arrowPattern =
  /(?:^|\n)(?:const|let|var)\s+[A-Za-z0-9_]+\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::[^{=\n]+)?=>\s*\{/gu;

const countParameterList = (parameterList: string): number => {
  const trimmed = parameterList.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return 1;
  }
  return trimmed
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0).length;
};

const findBlockEndOffset = (content: string, openBraceOffset: number): number => {
  let depth = 0;
  for (let index = openBraceOffset; index < content.length; index += 1) {
    const char = content[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return content.length - 1;
};

const stripStringsAndComments = (value: string): string =>
  value
    .replace(/\/\*[\s\S]*?\*\//gu, " ")
    .replace(/\/\/.*$/gmu, " ")
    .replace(/"(?:\\.|[^"\\])*"/gu, '""')
    .replace(/'(?:\\.|[^'\\])*'/gu, "''")
    .replace(/`(?:\\.|[^`\\])*`/gu, "``");

const collectBranchStats = (
  block: string,
): { branchCount: number; nestedConditionalDepth: number } => {
  const sanitized = stripStringsAndComments(block);
  const branchMatches = sanitized.match(/\b(?:if|else\s+if|switch|case|for|while)\b/gu) ?? [];

  let nestedConditionalDepth = 0;
  let currentDepth = 0;
  const conditionalPattern = /\b(?:if|switch)\b|\{/gu;
  for (const match of sanitized.matchAll(conditionalPattern)) {
    const token = match[0] ?? "";
    if (token === "{") {
      continue;
    }
    currentDepth += 1;
    nestedConditionalDepth = Math.max(nestedConditionalDepth, currentDepth);
    const startOffset = match.index ?? 0;
    const braceOffset = sanitized.indexOf("{", startOffset);
    if (braceOffset === -1) {
      continue;
    }
    const endOffset = findBlockEndOffset(sanitized, braceOffset);
    currentDepth -= 1;
    conditionalPattern.lastIndex = Math.max(conditionalPattern.lastIndex, endOffset);
  }

  return {
    branchCount: branchMatches.length,
    nestedConditionalDepth,
  };
};

const collectFunctionViolations = (
  filePath: string,
  content: string,
  pattern: RegExp,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];

  pattern.lastIndex = 0;
  for (const match of content.matchAll(pattern)) {
    const matchIndex = match.index ?? 0;
    const openBraceOffset = content.indexOf("{", matchIndex);
    if (openBraceOffset === -1) {
      continue;
    }
    const closeBraceOffset = findBlockEndOffset(content, openBraceOffset);
    const bodyLineCount = countLines(content.slice(openBraceOffset, closeBraceOffset + 1));
    const parameterCount = countParameterList(match[1] ?? "");
    const block = content.slice(openBraceOffset, closeBraceOffset + 1);
    const branchStats = collectBranchStats(block);

    if (bodyLineCount > maxFunctionBodyLines) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, matchIndex),
        message: `Function body exceeds ${maxFunctionBodyLines} lines. Break the monolith into focused helpers.`,
      });
    }

    if (parameterCount > maxParameterCount) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, matchIndex),
        message: `Function signature exposes ${parameterCount} parameters. Use an options object or split responsibilities.`,
      });
    }

    if (branchStats.branchCount > maxBranchCount) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, matchIndex),
        message: `Function branch count ${branchStats.branchCount} exceeds ${maxBranchCount}. Break the control flow into smaller units.`,
      });
    }

    if (branchStats.nestedConditionalDepth > maxNestedConditionalDepth) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, matchIndex),
        message: `Nested conditional depth ${branchStats.nestedConditionalDepth} exceeds ${maxNestedConditionalDepth}. Flatten the logic and extract helpers.`,
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

  return files.flatMap(({ filePath, content }) => {
    if (isIgnoredFile(filePath)) {
      return [];
    }

    const violations: ValidationViolation[] = [];
    const maxLines = filePath.endsWith(".vue") ? maxVueLines : maxTypeScriptLines;
    const lineCount = countLines(content);

    if (lineCount > maxLines) {
      violations.push({
        filePath,
        line: 1,
        message: `File exceeds ${maxLines} lines. Split the monolith into smaller modules.`,
      });
    }

    return [
      ...violations,
      ...collectFunctionViolations(filePath, content, functionPattern),
      ...collectFunctionViolations(filePath, content, methodPattern),
      ...collectFunctionViolations(filePath, content, arrowPattern),
    ];
  });
};

if (import.meta.main) {
  await reportViolations(
    "Monolith validation failed:",
    await collectViolations(),
    "Monolith validation passed.",
  );
}
