/**
 * Ban requestApi + API_ENDPOINTS.* once Eden ClientApi owns the branch.
 * Softening ban: typed Eden fabric must be the sole HTTP path for owned prefixes.
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const allowedExtensions = new Set([".vue", ".ts"]);

/** Eden-owned prefixes — requestApi(API_ENDPOINTS.<prefix>*) is banned. */
const EDEN_OWNED_ENDPOINT_PREFIXES = [
  "automation",
  "coverLetters",
] as const;

const REQUEST_API_EDEN_PATTERN = new RegExp(
  `requestApi\\s*(?:<[^>]*>)?\\s*\\([^)]*API_ENDPOINTS\\.(?:${EDEN_OWNED_ENDPOINT_PREFIXES.join("|")})`,
  "gu",
);
const BUILD_AUTOMATION_RUN_PATTERN = /buildAutomationRunEndpoint\s*\(/gu;
const BUILD_COVER_LETTER_DETAIL_PATTERN = /buildCoverLetterDetailEndpoint\s*\(/gu;
const REQUEST_API_CALL_PATTERN = /requestApi\s*(?:<[^>]*>)?\s*\(/u;

const isAllowedFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  filePath.endsWith(".spec.ts") ||
  filePath.includes("/locales/") ||
  // Binary export download still uses downloadApiFile + buildCoverLetterExportEndpoint.
  filePath === "packages/client/composables/useCoverLetter.ts";

export const collectEdenDualPathViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isAllowedFile(filePath) && !filePath.endsWith("useCoverLetter.ts")) {
    return [];
  }
  const violations: ValidationViolation[] = [];

  // useCoverLetter: ban requestApi + detail builder; allow export download helper only.
  if (filePath.endsWith("useCoverLetter.ts")) {
    if (REQUEST_API_CALL_PATTERN.test(content)) {
      violations.push({
        filePath,
        line: 1,
        message:
          "useCoverLetter must use Eden api.coverLetters.* for JSON CRUD — requestApi dual path banned.",
      });
    }
    for (const match of content.matchAll(BUILD_COVER_LETTER_DETAIL_PATTERN)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "useCoverLetter must resolve detail via Eden api.coverLetters({ id }) — buildCoverLetterDetailEndpoint dual path banned.",
      });
    }
    return violations;
  }

  for (const match of content.matchAll(REQUEST_API_EDEN_PATTERN)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message:
        "Eden-owned HTTP must use useApi() branch — requestApi(API_ENDPOINTS.<owned>*) dual path banned.",
    });
  }
  for (const match of content.matchAll(BUILD_AUTOMATION_RUN_PATTERN)) {
    if (filePath.includes("/composables/useAutomation.ts")) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "useAutomation must resolve runs via Eden api.automation.runs({ id }) — buildAutomationRunEndpoint dual path banned.",
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
    collectEdenDualPathViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Eden dual-path validation failed:",
    await collectViolations(),
    "Eden dual-path validation passed.",
  );
}
