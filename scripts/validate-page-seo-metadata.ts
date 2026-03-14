import { writeError, writeOutput } from "./utils/cli-output";

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

type SeoBlock = {
  body: string;
  offset: number;
};

const corePagePaths = [
  "packages/client/pages/index.vue",
  "packages/client/pages/setup.vue",
  "packages/client/pages/resume/index.vue",
  "packages/client/pages/jobs/index.vue",
  "packages/client/pages/interview/index.vue",
  "packages/client/pages/studios/index.vue",
  "packages/client/pages/automation/index.vue",
  "packages/client/pages/settings.vue",
] as const;

const seoComposableToken = "useServerSeoMeta";
const seoComposableClosePattern = /\}\s*\)\s*;/u;
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
  const seoComposableOffset = fileContent.indexOf(seoComposableToken);
  if (seoComposableOffset === -1) {
    return null;
  }

  const openParenthesisOffset = fileContent.indexOf(
    "(",
    seoComposableOffset + seoComposableToken.length,
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

const collectFileViolations = async (filePath: string): Promise<Violation[]> => {
  const fileContent = await Bun.file(filePath).text();
  const seoBlock = findSeoBlock(fileContent);

  if (!seoBlock) {
    return [
      {
        filePath,
        line: 1,
        message:
          "Missing useServerSeoMeta call. Core pages must define SSR title and description metadata.",
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
        message: `Missing "${propertyName}" in useServerSeoMeta payload.`,
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

const collectViolations = async (): Promise<Violation[]> => {
  const perFileViolations = await Promise.all(
    corePagePaths.map((pathValue) => collectFileViolations(pathValue)),
  );
  return perFileViolations.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();
  if (violations.length === 0) {
    await writeOutput("Page SEO metadata validation passed for all core pages.");
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

await main();
