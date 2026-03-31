import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = [
  "packages/client/pages",
  "packages/client/components",
  "packages/client/composables",
] as const;
const sourceExtensions = new Set([".vue", ".ts"]);
const keyedLiteralPattern =
  /\b(?:title|description|label|message|placeholder|alt|ariaLabel|emptyLabel|errorLabel)\s*:\s*(['"`])([^'"`\n]+)\1/gu;
const seoLiteralPattern =
  /\buseServerSeoMeta\s*\([\s\S]*?\b(?:title|description)\s*:\s*(['"`])([^'"`\n]+)\1/gu;
const isIgnoredFile = (filePath: string): boolean =>
  filePath.endsWith(".spec.ts") || filePath.endsWith(".test.ts") || filePath.includes("/locales/");
const ASCII_LETTER_PATTERN = /[A-Za-z]/u;

const isAllowedLiteral = (value: string): boolean =>
  value.startsWith("http") ||
  value.startsWith("/") ||
  value.includes(".") ||
  !ASCII_LETTER_PATTERN.test(value);

const collectPatternViolations = (
  filePath: string,
  content: string,
  pattern: RegExp,
  messageFactory: (literalValue: string) => string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  pattern.lastIndex = 0;
  for (const match of content.matchAll(pattern)) {
    const literalValue = match[2] ?? "";
    if (isAllowedLiteral(literalValue)) {
      continue;
    }
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: messageFactory(literalValue),
    });
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

    return [
      ...collectPatternViolations(
        filePath,
        content,
        keyedLiteralPattern,
        (literalValue) =>
          `User-facing literal "${literalValue}" should come from i18n, not inline source text.`,
      ),
      ...collectPatternViolations(
        filePath,
        content,
        seoLiteralPattern,
        (literalValue) =>
          `SEO literal "${literalValue}" should come from i18n or shared copy constants.`,
      ),
    ];
  });
};

if (import.meta.main) {
  await reportViolations(
    "Hardcoded user string validation failed:",
    await collectViolations(),
    "Hardcoded user string validation passed.",
  );
}
