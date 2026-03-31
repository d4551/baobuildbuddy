import { writeError, writeOutput } from "./utils/cli-output";
import { shouldIgnorePath } from "./utils/validation-helpers";

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

type SeoBlock = {
  body: string;
  offset: number;
};

const projectRoot = process.cwd();
const clientPagesRoot = "packages/client/pages";

const seoComposableCallPattern = /\buseSeoMeta\s*\(/u;
const seoComposableClosePattern = /\}\s*\)\s*;/u;
const serverSeoComposableCallPattern = /\buseServerSeoMeta\s*\(/u;
const humanTextPattern = /\p{L}/u;

const getLineFromOffset = (text: string, offset: number): number => {
  if (offset <= 0) {
    return 1;
  }

  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
    }
  }
  return line;
};

const findSeoBlock = (fileContent: string): SeoBlock | null => {
  const seoComposableMatch = seoComposableCallPattern.exec(fileContent);
  if (!seoComposableMatch || seoComposableMatch.index === undefined) {
    return null;
  }
  const seoComposableOffset = seoComposableMatch.index;

  const openParenthesisOffset = fileContent.indexOf(
    "(",
    seoComposableOffset,
  );
  if (openParenthesisOffset === -1) {
    return null;
  }

  const openBraceOffset = fileContent.indexOf("{", openParenthesisOffset + 1);
  if (openBraceOffset === -1) {
    return null;
  }

  const remaining = fileContent.slice(openBraceOffset + 1);
  const closeMatch = seoComposableClosePattern.exec(remaining);
  if (!closeMatch || closeMatch.index === undefined) {
    return null;
  }

  const closeOffset = openBraceOffset + 1 + closeMatch.index;
  return {
    body: fileContent.slice(openBraceOffset + 1, closeOffset),
    offset: openBraceOffset + 1,
  };
};

const usesServerOnlySeoComposable = (fileContent: string): boolean =>
  serverSeoComposableCallPattern.test(fileContent);

const resolveSeoPropertyValue = (
  seoBody: string,
  propertyName: "title" | "description",
): string | null => {
  const propertyPattern = new RegExp(
    `\\b${propertyName}\\s*:\\s*([\\s\\S]*?)(?=,\\s*(?:\\n|$)|\\n\\s*[A-Za-z_$][\\w$]*\\s*:|$)`,
    "u",
  );
  const match = propertyPattern.exec(seoBody);
  if (!match) {
    return null;
  }

  return (match[1] ?? "").trim();
};

const isStaticLiteralSeoValue = (value: string): boolean => {
  if (value.length < 2) {
    return false;
  }

  const startsWithSingleQuote = value.startsWith("'");
  const endsWithSingleQuote = value.endsWith("'");
  const startsWithDoubleQuote = value.startsWith('"');
  const endsWithDoubleQuote = value.endsWith('"');
  const startsWithBacktick = value.startsWith("`");
  const endsWithBacktick = value.endsWith("`");

  if (
    (startsWithSingleQuote && endsWithSingleQuote) ||
    (startsWithDoubleQuote && endsWithDoubleQuote)
  ) {
    const literal = value.slice(1, -1).trim();
    return literal.length > 0 && humanTextPattern.test(literal);
  }

  if (startsWithBacktick && endsWithBacktick && !value.includes("${")) {
    const literal = value.slice(1, -1).trim();
    return literal.length > 0 && humanTextPattern.test(literal);
  }

  return false;
};

export const collectPageSeoViolationsForContent = (
  filePath: string,
  fileContent: string,
): Violation[] => {
  if (usesServerOnlySeoComposable(fileContent)) {
    return [
      {
        filePath,
        line: 1,
        message:
          "Page uses useServerSeoMeta(). Use useSeoMeta() so SSR metadata stays aligned after browser hydration.",
      },
    ];
  }

  const seoBlock = findSeoBlock(fileContent);

  if (!seoBlock) {
    return [
      {
        filePath,
        line: 1,
        message:
          "Missing useSeoMeta call. Core pages must define SSR and hydrated title/description metadata.",
      },
    ];
  }

  const violations: Violation[] = [];
  for (const propertyName of ["title", "description"] as const) {
    const value = resolveSeoPropertyValue(seoBlock.body, propertyName);
    if (!value) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, seoBlock.offset),
        message: `Missing "${propertyName}" in useSeoMeta payload.`,
      });
      continue;
    }

    if (isStaticLiteralSeoValue(value)) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, seoBlock.offset),
        message:
          `Static literal "${propertyName}" metadata detected. ` +
          `Use localized values (for example t('...')) or shared constants.`,
      });
    }
  }

  return violations;
};

const collectFileViolations = async (filePath: string): Promise<Violation[]> => {
  const fileContent = await Bun.file(filePath).text();
  return collectPageSeoViolationsForContent(filePath, fileContent);
};

const collectViolations = async (): Promise<Violation[]> => {
  const glob = new Bun.Glob(`${clientPagesRoot}/**/*.vue`);
  const pagePaths = (await Array.fromAsync(glob.scan({ cwd: projectRoot, onlyFiles: true })))
    .map((pathValue) => pathValue.replace(/\\/gu, "/"))
    .filter((pathValue) => !shouldIgnorePath(pathValue));

  const perFileViolations = await Promise.all(
    pagePaths.map((pathValue) => collectFileViolations(pathValue)),
  );
  return perFileViolations.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();
  if (violations.length === 0) {
    await writeOutput("Page SEO metadata validation passed for all client pages.");
    return;
  }

  await writeError("Page SEO metadata validation failed:");
  const lines = violations.map(
    (violation) => `- ${violation.filePath}:${violation.line} ${violation.message}`,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }
  process.exit(1);
};

if (import.meta.main) {
  await main();
}
