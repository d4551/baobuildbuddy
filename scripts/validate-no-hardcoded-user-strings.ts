import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts"]);
const keyedLiteralFieldNames = [
  "title",
  "description",
  "label",
  "message",
  "placeholder",
  "alt",
  "ariaLabel",
  "ariaDescription",
  "emptyLabel",
  "errorLabel",
  "header",
  "heading",
  "subtitle",
  "body",
  "text",
  "copy",
  "ctaLabel",
  "confirmLabel",
  "cancelLabel",
  "retryLabel",
  "closeLabel",
  "closeAriaLabel",
  "submitLabel",
  "tableLabel",
] as const;
const BACKTICK = "`";
const quoteClassPattern = `['"${BACKTICK}]`;
const literalBodyPattern = `[^'"${BACKTICK}\\n]+`;
const keyedLiteralPattern = new RegExp(
  `\\b(?:${keyedLiteralFieldNames.join("|")})\\s*:\\s*(${quoteClassPattern})(${literalBodyPattern})\\1`,
  "gu",
);
const seoLiteralPattern =
  /\b(?:useServerSeoMeta|useSeoMeta)\s*\([\s\S]*?\b(?:title|description)\s*:\s*(['"`])([^'"`\n]+)\1/gu;
const toastLiteralPattern =
  /\b(?:\$toast|toast)\s*\.\s*(?:success|error|info|warning)\s*\(\s*(['"`])([^'"`\n]+)\1/gu;
const isIgnoredFile = (filePath: string): boolean =>
  filePath.endsWith(".spec.ts") ||
  filePath.endsWith(".test.ts") ||
  filePath.includes("/locales/") ||
  filePath.includes("/.nuxt/") ||
  filePath.includes("/dist/");
const ASCII_LETTER_PATTERN = /[A-Za-z]/u;
const LOCALE_KEY_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/u;

const isAllowedLiteral = (value: string): boolean =>
  value.startsWith("http") ||
  value.startsWith("/") ||
  LOCALE_KEY_PATTERN.test(value) ||
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

export const collectHardcodedUserStringViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
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
    ...collectPatternViolations(
      filePath,
      content,
      toastLiteralPattern,
      (literalValue) =>
        `Toast literal "${literalValue}" should come from i18n, not inline source text.`,
    ),
  ];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });

  return files.flatMap(({ filePath, content }) =>
    collectHardcodedUserStringViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Hardcoded user string validation failed:",
    await collectViolations(),
    "Hardcoded user string validation passed.",
  );
}
