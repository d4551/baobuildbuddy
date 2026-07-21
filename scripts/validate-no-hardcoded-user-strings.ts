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
  filePath.includes("/.nuxt/") ||
  filePath.includes("/dist/");

const isLocaleCatalogFile = (filePath: string): boolean => filePath.includes("/locales/");

/**
 * Placeholder/sample value patterns that must never appear as a VALUE in an
 * i18n catalog — even in form placeholders. Form placeholders should be
 * instructional ("Enter your name"), not example identities ("John Doe").
 * Root cause this locks forward: the orphan `resumeComponentPersonalInfo`
 * catalog shipped "John Doe" / "john@example.com" / "+1 (555) 123-4567"
 * undetected because the locales directory was excluded from scanning.
 */
const PLACEHOLDER_VALUE_PATTERNS = [
  /\b(?:John|Jane|Juan|Maria)\s+(?:Doe|Smith|Pérez|García)\b/u,
  /(?:@|\{?@?\})?example\.(?:com|org|net)\b/u,
  /(?:@|\{?@?\})?ejemplo\.(?:com|es)\b/u,
  /\b555[\s).-]*\d{3}[\s.-]?\d{4}\b/u,
  /linkedin\.com\/in\/[a-z]+\d?/u,
  /github\.com\/[a-z]+\d?/u,
  /\byoursite\.com\b/u,
  /lorem\s+ipsum/u,
] as const;

const STRING_VALUE_PATTERN = /:\s*["']([^"']+)["']/gu;

const collectPlaceholderValueViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  STRING_VALUE_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(STRING_VALUE_PATTERN)) {
    const value = match[1] ?? "";
    for (const pattern of PLACEHOLDER_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        violations.push({
          filePath,
          line: getLineFromOffset(content, match.index ?? 0),
          message: `Placeholder/sample value "${value}" in i18n catalog must be instructional, not an example identity. Form placeholders should say "Enter your name", not "John Doe".`,
        });
        break;
      }
    }
  }
  return violations;
};
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

  if (isLocaleCatalogFile(filePath)) {
    // Locale catalogs legitimately contain translations (user-facing strings
    // ARE the source of truth here), so the general hardcoded-string check is
    // skipped. However, placeholder/sample values ("John Doe",
    // "john@example.com", "+1 (555) 123-4567") are still banned — form
    // placeholders must be instructional, not example identities.
    return collectPlaceholderValueViolations(filePath, content);
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
