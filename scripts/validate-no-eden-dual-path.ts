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
  "resumes",
  "studios",
] as const;

const REQUEST_API_EDEN_PATTERN = new RegExp(
  `requestApi\\s*(?:<[^>]*>)?\\s*\\([^)]*API_ENDPOINTS\\.(?:${EDEN_OWNED_ENDPOINT_PREFIXES.join("|")})`,
  "gu",
);
const BUILD_AUTOMATION_RUN_PATTERN = /buildAutomationRunEndpoint\s*\(/gu;
const BUILD_COVER_LETTER_DETAIL_PATTERN = /buildCoverLetterDetailEndpoint\s*\(/gu;
const BUILD_JOB_DETAIL_PATTERN = /buildJobDetailEndpoint\s*\(/gu;
const BUILD_RESUME_DETAIL_PATTERN = /buildResumeDetailEndpoint\s*\(/gu;
const BUILD_STUDIO_DETAIL_PATTERN = /buildStudioDetailEndpoint\s*\(/gu;
const REQUEST_API_CALL_PATTERN = /requestApi\s*(?:<[^>]*>)?\s*\(/u;

const isAllowedFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  filePath.endsWith(".spec.ts") ||
  filePath.includes("/locales/") ||
  // Binary export download still uses downloadApiFile + build*ExportEndpoint.
  filePath === "packages/client/composables/useCoverLetter.ts" ||
  filePath === "packages/client/composables/useResume.ts";

export const collectEdenDualPathViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (
    isAllowedFile(filePath) &&
    !filePath.endsWith("useCoverLetter.ts") &&
    !filePath.endsWith("useResume.ts")
  ) {
    return [];
  }
  const violations: ValidationViolation[] = [];

  // useCoverLetter / useResume: ban requestApi + detail builders; allow export download helper only.
  if (filePath.endsWith("useCoverLetter.ts") || filePath.endsWith("useResume.ts")) {
    if (REQUEST_API_CALL_PATTERN.test(content)) {
      violations.push({
        filePath,
        line: 1,
        message: `${filePath.split("/").pop()} must use Eden api.*.* for JSON CRUD — requestApi dual path banned.`,
      });
    }
    if (filePath.endsWith("useCoverLetter.ts")) {
      for (const match of content.matchAll(BUILD_COVER_LETTER_DETAIL_PATTERN)) {
        violations.push({
          filePath,
          line: getLineFromOffset(content, match.index ?? 0),
          message:
            "useCoverLetter must resolve detail via Eden api.coverLetters({ id }) — buildCoverLetterDetailEndpoint dual path banned.",
        });
      }
    }
    if (filePath.endsWith("useResume.ts")) {
      for (const match of content.matchAll(BUILD_RESUME_DETAIL_PATTERN)) {
        violations.push({
          filePath,
          line: getLineFromOffset(content, match.index ?? 0),
          message:
            "useResume must resolve detail via Eden api.resumes({ id }) — buildResumeDetailEndpoint dual path banned.",
        });
      }
    }
    return violations;
  }

  if (filePath.endsWith("useJobs.ts")) {
    if (REQUEST_API_CALL_PATTERN.test(content)) {
      violations.push({
        filePath,
        line: 1,
        message: "useJobs must use Eden api.jobs.* — requestApi dual path banned.",
      });
    }
    for (const match of content.matchAll(BUILD_JOB_DETAIL_PATTERN)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "useJobs must resolve detail via Eden api.jobs({ id }) — buildJobDetailEndpoint dual path banned.",
      });
    }
  }

  if (filePath.endsWith("useStudio.ts")) {
    if (REQUEST_API_CALL_PATTERN.test(content)) {
      violations.push({
        filePath,
        line: 1,
        message: "useStudio must use Eden api.studios.* — requestApi dual path banned.",
      });
    }
    for (const match of content.matchAll(BUILD_STUDIO_DETAIL_PATTERN)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "useStudio must resolve detail via Eden api.studios({ id }) — buildStudioDetailEndpoint dual path banned.",
      });
    }
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
