import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const allowedExtensions = new Set([".vue", ".ts"]);
const clientFetchCallPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: "fetch", pattern: /(?:^|[^\w$])fetch\s*(?:<[^()]*>)?\s*\(/gu },
  { label: "$fetch", pattern: /(?:^|[^\w$])\$fetch\s*(?:<[^()]*>)?\s*\(/gu },
  { label: "$fetch.raw", pattern: /(?:^|[^\w$])\$fetch\.raw\s*\(/gu },
  { label: "useFetch", pattern: /(?:^|[^\w$])useFetch\s*(?:<[^()]*>)?\s*\(/gu },
  { label: "useLazyFetch", pattern: /(?:^|[^\w$])useLazyFetch\s*(?:<[^()]*>)?\s*\(/gu },
] as const;

const isAllowedFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  filePath.endsWith(".spec.ts") ||
  filePath.includes("/locales/") ||
  filePath === "packages/client/composables/api-request.ts";

export const collectClientFetchDriftViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isAllowedFile(filePath)) {
    return [];
  }

  const violations: ValidationViolation[] = [];
  for (const { label, pattern } of clientFetchCallPatterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Direct client ${label} calls are forbidden outside the shared API boundary. Route them through useApi/requestApi.`,
      });
    }
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions,
  });

  return files.flatMap(({ filePath, content }) =>
    collectClientFetchDriftViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Client fetch drift validation failed:",
    await collectViolations(),
    "Client fetch drift validation passed.",
  );
}
