import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Ban inert navigation stubs (brutalise UI012 gap): href="#", javascript:void.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts"]);
const hrefHashPattern = /\bhref\s*=\s*(["'])#\1/gu;
const javascriptVoidPattern = /javascript\s*:\s*void/giu;

export const collectHrefHashStubViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  hrefHashPattern.lastIndex = 0;
  for (const match of content.matchAll(hrefHashPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: 'href="#" is a dead navigation stub. Use a real route constant or button+handler.',
    });
  }
  javascriptVoidPattern.lastIndex = 0;
  for (const match of content.matchAll(javascriptVoidPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: "javascript:void handlers are forbidden dead stubs.",
    });
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [...scanRoots],
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectHrefHashStubViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Href-hash stub validation failed:",
    await collectViolations(),
    "Href-hash stub validation passed.",
  );
}
